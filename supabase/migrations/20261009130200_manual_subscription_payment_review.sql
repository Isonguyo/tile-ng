
CREATE TABLE IF NOT EXISTS public.manual_payment_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bank_name text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  transfer_instructions text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
INSERT INTO public.manual_payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.manual_payment_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS manual_payment_settings_authenticated_read ON public.manual_payment_settings;
CREATE POLICY manual_payment_settings_authenticated_read ON public.manual_payment_settings
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE ALL ON public.manual_payment_settings FROM anon, authenticated;
GRANT SELECT ON public.manual_payment_settings TO authenticated;

CREATE TABLE IF NOT EXISTS public.subscription_payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.sub_tier NOT NULL CHECK (tier IN ('lite','pro','vip')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_code text NOT NULL UNIQUE,
  bank_transaction_reference text,
  proof_path text,
  status text NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment','pending','approved','rejected','cancelled')),
  order_expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_note text,
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_payment_requests_one_open_per_user
  ON public.subscription_payment_requests(user_id) WHERE status IN ('awaiting_payment','pending');
CREATE UNIQUE INDEX IF NOT EXISTS subscription_payment_requests_bank_reference_unique
  ON public.subscription_payment_requests(lower(btrim(bank_transaction_reference)))
  WHERE bank_transaction_reference IS NOT NULL AND btrim(bank_transaction_reference) <> '';
CREATE INDEX IF NOT EXISTS subscription_payment_requests_status_created_idx
  ON public.subscription_payment_requests(status, created_at DESC);
ALTER TABLE public.subscription_payment_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_payment_requests_read_own_or_admin ON public.subscription_payment_requests;
CREATE POLICY subscription_payment_requests_read_own_or_admin ON public.subscription_payment_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
REVOKE ALL ON public.subscription_payment_requests FROM anon, authenticated;
GRANT SELECT ON public.subscription_payment_requests TO authenticated;

ALTER TABLE public.subscription_history ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'wallet';
ALTER TABLE public.subscription_history ADD COLUMN IF NOT EXISTS payment_request_id uuid
  REFERENCES public.subscription_payment_requests(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS subscription_history_payment_request_unique
  ON public.subscription_history(payment_request_id) WHERE payment_request_id IS NOT NULL;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('payment-proofs','payment-proofs',false,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=5242880,
  allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];
DROP POLICY IF EXISTS "Users upload own payment proofs" ON storage.objects;
CREATE POLICY "Users upload own payment proofs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='payment-proofs' AND (storage.foldername(name))[1]=auth.uid()::text);
DROP POLICY IF EXISTS "Users and admins read payment proofs" ON storage.objects;
CREATE POLICY "Users and admins read payment proofs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='payment-proofs' AND ((storage.foldername(name))[1]=auth.uid()::text OR public.has_role(auth.uid(),'admin')));

CREATE OR REPLACE FUNCTION public.admin_update_manual_payment_settings(
  _bank_name text,_account_name text,_account_number text,_transfer_instructions text,_enabled boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF COALESCE(_enabled,false) AND (NULLIF(btrim(_bank_name),'') IS NULL OR NULLIF(btrim(_account_name),'') IS NULL OR NULLIF(btrim(_account_number),'') IS NULL) THEN
   RAISE EXCEPTION 'Bank name, account name, and account number are required before enabling payments';
 END IF;
 INSERT INTO public.manual_payment_settings(id,bank_name,account_name,account_number,transfer_instructions,enabled,updated_at,updated_by)
 VALUES(1,COALESCE(btrim(_bank_name),''),COALESCE(btrim(_account_name),''),COALESCE(btrim(_account_number),''),COALESCE(btrim(_transfer_instructions),''),COALESCE(_enabled,false),now(),auth.uid())
 ON CONFLICT(id) DO UPDATE SET bank_name=EXCLUDED.bank_name,account_name=EXCLUDED.account_name,
 account_number=EXCLUDED.account_number,transfer_instructions=EXCLUDED.transfer_instructions,
 enabled=EXCLUDED.enabled,updated_at=now(),updated_by=auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.create_subscription_payment_order(_tier public.sub_tier)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid:=auth.uid(); _prof record; _plan record; _enabled boolean; _old public.subscription_payment_requests%ROWTYPE; _r public.subscription_payment_requests%ROWTYPE; _code text;
BEGIN
 IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 IF _tier NOT IN ('lite','pro','vip') THEN RAISE EXCEPTION 'Invalid subscription plan'; END IF;
 SELECT enabled INTO _enabled FROM public.manual_payment_settings WHERE id=1;
 IF NOT COALESCE(_enabled,false) THEN RAISE EXCEPTION 'Manual bank transfer is not configured yet'; END IF;
 SELECT subscription_tier,subscription_until,tier_locked INTO _prof FROM public.profiles WHERE id=_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account profile not found'; END IF;
 IF COALESCE(_prof.tier_locked,false) THEN RAISE EXCEPTION 'Your plan is manually assigned; contact support before purchasing'; END IF;
 IF _prof.subscription_until>now() AND _prof.subscription_tier<>'free' AND _prof.subscription_tier<>_tier THEN
   RAISE EXCEPTION 'Your current paid plan is active until %. Renew that plan or wait until it expires.',_prof.subscription_until;
 END IF;
 SELECT price_ngn INTO _plan FROM public.subscription_plans WHERE tier=_tier;
 IF NOT FOUND OR COALESCE(_plan.price_ngn,0)<=0 THEN RAISE EXCEPTION 'Plan price is not configured'; END IF;
 UPDATE public.subscription_payment_requests SET status='cancelled',updated_at=now(),admin_note='Unsubmitted order expired'
 WHERE user_id=_uid AND status='awaiting_payment' AND order_expires_at<=now();
 SELECT * INTO _old FROM public.subscription_payment_requests WHERE user_id=_uid AND status IN ('awaiting_payment','pending') ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
 IF FOUND THEN
   IF _old.status='pending' THEN RAISE EXCEPTION 'You already have a payment awaiting admin review'; END IF;
   IF _old.tier=_tier AND _old.order_expires_at>now() THEN
     RETURN jsonb_build_object('id',_old.id,'tier',_old.tier,'amount',_old.amount,'payment_code',_old.payment_code,'status',_old.status,'order_expires_at',_old.order_expires_at);
   END IF;
   UPDATE public.subscription_payment_requests SET status='cancelled',updated_at=now(),admin_note='Replaced by new checkout' WHERE id=_old.id;
 END IF;
 _code:='TILE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
 INSERT INTO public.subscription_payment_requests(user_id,tier,amount,payment_code) VALUES(_uid,_tier,_plan.price_ngn,_code) RETURNING * INTO _r;
 RETURN jsonb_build_object('id',_r.id,'tier',_r.tier,'amount',_r.amount,'payment_code',_r.payment_code,'status',_r.status,'order_expires_at',_r.order_expires_at);
END; $$;

CREATE OR REPLACE FUNCTION public.submit_subscription_payment_proof(_request_id uuid,_proof_path text,_bank_transaction_reference text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid:=auth.uid(); _r public.subscription_payment_requests%ROWTYPE;
BEGIN
 IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 IF _proof_path IS NULL OR _proof_path !~* ('^'||_uid::text||'/[a-f0-9-]+\.(png|jpe?g|webp)$') THEN RAISE EXCEPTION 'Upload a valid PNG, JPG, JPEG, or WebP screenshot'; END IF;
 SELECT * INTO _r FROM public.subscription_payment_requests WHERE id=_request_id AND user_id=_uid FOR UPDATE;
 IF NOT FOUND OR _r.status<>'awaiting_payment' THEN RAISE EXCEPTION 'Payment order is not awaiting proof'; END IF;
 IF _r.order_expires_at<=now() THEN RAISE EXCEPTION 'Payment order expired; start a new order'; END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='payment-proofs' AND name=_proof_path) THEN RAISE EXCEPTION 'Uploaded screenshot was not found'; END IF;
 IF NULLIF(btrim(_bank_transaction_reference),'') IS NOT NULL AND EXISTS(
   SELECT 1 FROM public.subscription_payment_requests r WHERE r.id<>_request_id
   AND lower(btrim(r.bank_transaction_reference))=lower(btrim(_bank_transaction_reference))
 ) THEN RAISE EXCEPTION 'This bank transaction reference has already been submitted'; END IF;
 UPDATE public.subscription_payment_requests SET proof_path=_proof_path,
 bank_transaction_reference=NULLIF(btrim(_bank_transaction_reference),''),status='pending',submitted_at=now(),updated_at=now()
 WHERE id=_request_id;
 RETURN _request_id;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_subscription_payment_order(_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 UPDATE public.subscription_payment_requests SET status='cancelled',updated_at=now()
 WHERE id=_request_id AND user_id=auth.uid() AND status='awaiting_payment';
 IF NOT FOUND THEN RAISE EXCEPTION 'Only your unsubmitted payment order can be cancelled'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_subscription_payment_requests(_status text DEFAULT 'all')
RETURNS TABLE(id uuid,user_id uuid,full_name text,email text,tier public.sub_tier,amount numeric,payment_code text,
 bank_transaction_reference text,proof_path text,status text,order_expires_at timestamptz,submitted_at timestamptz,
 reviewed_at timestamptz,reviewed_by uuid,admin_note text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,auth AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
 RETURN QUERY SELECT r.id,r.user_id,COALESCE(p.full_name,p.business_name,'Tile user')::text,u.email::text,
 r.tier,r.amount,r.payment_code,r.bank_transaction_reference,r.proof_path,r.status,r.order_expires_at,
 r.submitted_at,r.reviewed_at,r.reviewed_by,r.admin_note,r.created_at
 FROM public.subscription_payment_requests r LEFT JOIN public.profiles p ON p.id=r.user_id
 LEFT JOIN auth.users u ON u.id=r.user_id
 WHERE COALESCE(_status,'all')='all' OR r.status=_status
 ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'awaiting_payment' THEN 1 ELSE 2 END,r.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_review_subscription_payment(_request_id uuid,_decision text,_admin_note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _r public.subscription_payment_requests%ROWTYPE; _p record; _plan record; _start timestamptz; _expires timestamptz; _admin uuid:=auth.uid();
BEGIN
 IF _admin IS NULL OR NOT public.has_role(_admin,'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF _decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 IF _decision='rejected' AND NULLIF(btrim(_admin_note),'') IS NULL THEN RAISE EXCEPTION 'Provide a reason when rejecting payment'; END IF;
 SELECT * INTO _r FROM public.subscription_payment_requests WHERE id=_request_id FOR UPDATE;
 IF NOT FOUND OR _r.status<>'pending' OR _r.proof_path IS NULL THEN RAISE EXCEPTION 'Submitted payment awaiting review not found'; END IF;
 IF _decision='rejected' THEN
   UPDATE public.subscription_payment_requests SET status='rejected',reviewed_at=now(),reviewed_by=_admin,admin_note=btrim(_admin_note),updated_at=now() WHERE id=_request_id;
   INSERT INTO public.notifications(user_id,title,body,link) VALUES(_r.user_id,'Subscription payment needs attention',
    'Your '||upper(_r.tier::text)||' payment proof was not approved. '||btrim(_admin_note),'/dashboard');
   RETURN _request_id;
 END IF;
 SELECT subscription_tier,subscription_until,tier_locked,wallet_balance,promotion_credits INTO _p
 FROM public.profiles WHERE id=_r.user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;
 IF COALESCE(_p.tier_locked,false) THEN RAISE EXCEPTION 'Account plan is manually locked; resolve before approving'; END IF;
 IF _p.subscription_until>now() AND _p.subscription_tier<>'free' AND _p.subscription_tier<>_r.tier THEN
   RAISE EXCEPTION 'User has a different active paid plan; do not replace it early';
 END IF;
 SELECT price_ngn,boost_credits INTO _plan FROM public.subscription_plans WHERE tier=_r.tier;
 IF NOT FOUND OR _plan.price_ngn<>_r.amount THEN RAISE EXCEPTION 'Payment amount does not match current plan price'; END IF;
 _start:=CASE WHEN _p.subscription_tier=_r.tier AND _p.subscription_until>now() THEN _p.subscription_until ELSE now() END;
 _expires:=_start+interval '30 days';
 UPDATE public.profiles SET subscription_tier=_r.tier,subscription_until=_expires,
 promotion_credits=COALESCE(promotion_credits,0)+COALESCE(_plan.boost_credits,0) WHERE id=_r.user_id;
 UPDATE public.subscription_payment_requests SET status='approved',reviewed_at=now(),reviewed_by=_admin,
 admin_note=NULLIF(btrim(_admin_note),''),subscription_started_at=_start,subscription_expires_at=_expires,updated_at=now()
 WHERE id=_request_id;
 INSERT INTO public.subscription_history(user_id,tier,amount,wallet_before,wallet_after,started_at,expires_at,status,payment_reference,payment_method,payment_request_id)
 VALUES(_r.user_id,_r.tier,_r.amount,COALESCE(_p.wallet_balance,0),COALESCE(_p.wallet_balance,0),_start,_expires,'active',
 COALESCE(_r.bank_transaction_reference,_r.payment_code),'bank_transfer',_r.id);
 INSERT INTO public.notifications(user_id,title,body,link) VALUES(_r.user_id,'Subscription activated',
 upper(_r.tier::text)||' is now active until '||to_char(_expires AT TIME ZONE 'Africa/Lagos','DD Mon YYYY')||
 '. Your bank-transfer payment was confirmed by Tile administration.','/dashboard');
 RETURN _request_id;
END; $$;

CREATE OR REPLACE FUNCTION public.activate_subscription(_tier public.sub_tier)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 RAISE EXCEPTION 'Subscription activation requires payment proof and admin confirmation.';
END; $$;
REVOKE ALL ON FUNCTION public.activate_subscription(public.sub_tier) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_update_manual_payment_settings(text,text,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_update_manual_payment_settings(text,text,text,text,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.create_subscription_payment_order(public.sub_tier) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_subscription_payment_order(public.sub_tier) TO authenticated;
REVOKE ALL ON FUNCTION public.submit_subscription_payment_proof(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_subscription_payment_proof(uuid,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.cancel_subscription_payment_order(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cancel_subscription_payment_order(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_list_subscription_payment_requests(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_list_subscription_payment_requests(text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_review_subscription_payment(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_review_subscription_payment(uuid,text,text) TO authenticated;

UPDATE public.subscription_plans SET display_name='Pro',price_ngn=15000,max_goods=50,max_services=20,
 can_ai_desc=false,boost_credits=5,
 features=ARRAY['verified_vendor_badge','custom_shop_url','qr_code','five_top_ads_per_30_day_billing_cycle',
 'homepage_priority','featured_vendor_placement','product_performance_analytics','customer_inquiry_dashboard',
 'social_sharing_tools','priority_support','up_to_50_products','up_to_20_services']
WHERE tier='pro';
