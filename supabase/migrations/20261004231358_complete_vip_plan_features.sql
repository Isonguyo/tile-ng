
UPDATE public.subscription_plans
SET
  max_goods = 1000,
  max_services = 1000,
  can_shop = true,
  can_promote = true,
  can_ai_desc = true,
  can_vanity_slug = true,
  boost_credits = 15,
  features = ARRAY[
    'verified_vendor_badge',
    'custom_shop_url',
    'qr_code',
    'unlimited_listings',
    'unlimited_promotions',
    'homepage_featured_placement',
    'multiple_staff_accounts',
    'advanced_analytics',
    'google_business_integration',
    'automated_social_posting',
    'ai_sales_assistant',
    'priority_support'
  ]::text[]
WHERE tier = 'vip';

CREATE TABLE IF NOT EXISTS public.merchant_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('staff','manager')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','revoked')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS merchant_staff_owner_email_uq
  ON public.merchant_staff(owner_id, lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS merchant_staff_owner_member_uq
  ON public.merchant_staff(owner_id, member_id)
  WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS merchant_staff_member_idx
  ON public.merchant_staff(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS merchant_staff_owner_status_idx
  ON public.merchant_staff(owner_id, status);

CREATE TABLE IF NOT EXISTS public.merchant_staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('staff','manager')),
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS merchant_staff_invites_owner_idx
  ON public.merchant_staff_invites(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS merchant_staff_invites_email_idx
  ON public.merchant_staff_invites(lower(email), created_at DESC);

ALTER TABLE public.merchant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_staff_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS merchant_staff_owner_select ON public.merchant_staff;
CREATE POLICY merchant_staff_owner_select
  ON public.merchant_staff FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR member_id = auth.uid());

DROP POLICY IF EXISTS merchant_staff_invites_owner_select ON public.merchant_staff_invites;
CREATE POLICY merchant_staff_invites_owner_select
  ON public.merchant_staff_invites FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.merchant_owner_for_user(_uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ms.owner_id
      FROM public.merchant_staff ms
      WHERE ms.member_id = _uid AND ms.status = 'active'
      ORDER BY ms.joined_at DESC NULLS LAST, ms.created_at DESC
      LIMIT 1
    ),
    _uid
  )
$$;

CREATE OR REPLACE FUNCTION public.invite_staff_member(_email text, _role text DEFAULT 'staff')
RETURNS TABLE(invite_id uuid, invite_token text, invite_expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid;
  _tier public.sub_tier;
  _email_norm text;
  _invite_id uuid;
  _token text;
  _expires timestamptz;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _owner := public.merchant_owner_for_user(_uid);

  SELECT public.effective_tier(subscription_tier, subscription_until)
  INTO _tier
  FROM public.profiles
  WHERE id = _owner;

  IF COALESCE(_tier, 'free') <> 'vip' THEN
    RAISE EXCEPTION 'Multiple staff accounts are a VIP feature';
  END IF;

  _email_norm := lower(trim(_email));
  IF _email_norm = '' OR position('@' in _email_norm) < 2 THEN
    RAISE EXCEPTION 'Enter a valid email address';
  END IF;
  IF _email_norm = lower(COALESCE((SELECT email FROM auth.users WHERE id = _owner), '')) THEN
    RAISE EXCEPTION 'The owner account cannot be added as staff';
  END IF;
  IF _role NOT IN ('staff','manager') THEN
    RAISE EXCEPTION 'Invalid staff role';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.merchant_staff
    WHERE owner_id = _owner AND lower(email) = _email_norm AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'This email is already an active staff member';
  END IF;

  UPDATE public.merchant_staff
  SET role = _role, status = 'invited', updated_at = now(), member_id = NULL
  WHERE owner_id = _owner AND lower(email) = _email_norm;

  INSERT INTO public.merchant_staff_invites(owner_id, email, role)
  VALUES (_owner, _email_norm, _role)
  RETURNING id, token, expires_at INTO _invite_id, _token, _expires;

  INSERT INTO public.merchant_staff(owner_id, email, role, status)
  VALUES (_owner, _email_norm, _role, 'invited')
  ON CONFLICT (owner_id, lower(email))
  DO UPDATE SET role = EXCLUDED.role, status = 'invited', member_id = NULL, updated_at = now();

  RETURN QUERY SELECT _invite_id, _token, _expires;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_staff_invite(_token text)
RETURNS TABLE(owner_id uuid, staff_id uuid, role text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _invite public.merchant_staff_invites%ROWTYPE;
  _staff_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT lower(email) INTO _email FROM auth.users WHERE id = _uid;

  SELECT *
  INTO _invite
  FROM public.merchant_staff_invites
  WHERE token = trim(_token)
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF _invite.id IS NULL THEN RAISE EXCEPTION 'Invite is invalid or expired'; END IF;
  IF lower(_invite.email) <> lower(COALESCE(_email,'')) THEN
    RAISE EXCEPTION 'This invite was sent to a different email address';
  END IF;

  INSERT INTO public.merchant_staff(owner_id, member_id, email, role, status, joined_at, updated_at)
  VALUES (_invite.owner_id, _uid, lower(_invite.email), _invite.role, 'active', now(), now())
  ON CONFLICT (owner_id, lower(email))
  DO UPDATE SET member_id = EXCLUDED.member_id, role = EXCLUDED.role,
                status = 'active', joined_at = now(), updated_at = now()
  RETURNING id INTO _staff_id;

  UPDATE public.merchant_staff_invites SET accepted_at = now() WHERE id = _invite.id;

  RETURN QUERY SELECT _invite.owner_id, _staff_id, _invite.role, 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_staff_accounts()
RETURNS TABLE(id uuid, email text, full_name text, role text, status text, invited_at timestamptz, joined_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid := public.merchant_owner_for_user(auth.uid());
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF public.effective_tier((SELECT subscription_tier FROM public.profiles WHERE id=_owner),
                           (SELECT subscription_until FROM public.profiles WHERE id=_owner)) <> 'vip' THEN
    RAISE EXCEPTION 'Staff accounts are a VIP feature';
  END IF;

  RETURN QUERY
  SELECT ms.id, ms.email, p.full_name, ms.role, ms.status, ms.invited_at, ms.joined_at
  FROM public.merchant_staff ms
  LEFT JOIN public.profiles p ON p.id = ms.member_id
  WHERE ms.owner_id = _owner
  ORDER BY ms.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_staff_member(_staff_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid := public.merchant_owner_for_user(auth.uid());
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.merchant_staff
  SET status = 'revoked', updated_at = now(), member_id = NULL
  WHERE id = _staff_id AND owner_id = _owner;
  IF NOT FOUND THEN RAISE EXCEPTION 'Staff member not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_staff_context()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'is_staff', EXISTS (
      SELECT 1 FROM public.merchant_staff
      WHERE member_id = auth.uid() AND status = 'active'
    ),
    'owner_id', public.merchant_owner_for_user(auth.uid()),
    'role', (
      SELECT role FROM public.merchant_staff
      WHERE member_id = auth.uid() AND status = 'active'
      ORDER BY joined_at DESC NULLS LAST, created_at DESC
      LIMIT 1
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.tile_top_ad_status(_uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier public.sub_tier;
  _until timestamptz;
  _mode text;
  _limit int := 0;
  _used int := 0;
  _win timestamptz;
  _owner uuid := public.merchant_owner_for_user(_uid);
BEGIN
  SELECT public.effective_tier(subscription_tier, subscription_until), subscription_until
  INTO _tier, _until
  FROM public.profiles WHERE id = _owner;

  _tier := COALESCE(_tier, 'free');

  IF _tier = 'lite' THEN
    _mode := 'per_7_days'; _limit := 1; _win := now() - interval '7 days';
    SELECT COUNT(*) INTO _used FROM public.top_ad_allocations WHERE user_id = _owner AND started_at > _win;
  ELSIF _tier = 'pro' THEN
    _mode := 'per_billing_cycle'; _limit := 5; _win := _until - interval '30 days';
    SELECT COUNT(*) INTO _used FROM public.top_ad_allocations WHERE user_id = _owner AND started_at > _win;
  ELSIF _tier = 'vip' THEN
    _mode := 'unlimited'; _limit := NULL;
    SELECT COUNT(*) INTO _used FROM public.listings
    WHERE user_id = _owner AND is_promoted AND status='approved' AND expires_at>now()
      AND (promotion_expires_at IS NULL OR promotion_expires_at>now());
  ELSE
    _mode := 'none';
  END IF;

  RETURN jsonb_build_object(
    'tier', _tier, 'mode', _mode, 'limit', _limit, 'used', _used,
    'remaining', CASE WHEN _limit IS NULL THEN NULL ELSE GREATEST(_limit-_used,0) END,
    'window_start', _win
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_top_ad(_listing_id uuid, _days integer DEFAULT 7)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid;
  _l record;
  _p record;
  _st jsonb;
  _end timestamptz;
  _tier public.sub_tier;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _owner := public.merchant_owner_for_user(_uid);
  PERFORM pg_advisory_xact_lock(hashtextextended('tile_top_ad:' || _owner::text, 0));

  SELECT subscription_tier, subscription_until INTO _p FROM public.profiles WHERE id=_owner FOR UPDATE;
  _tier := public.effective_tier(_p.subscription_tier, _p.subscription_until);
  IF _tier='free' THEN RAISE EXCEPTION 'Top Ads require an active Lite, Pro or VIP plan'; END IF;

  SELECT id,status,expires_at,is_promoted,promotion_expires_at INTO _l
  FROM public.listings WHERE id=_listing_id AND user_id=_owner FOR UPDATE;
  IF _l.id IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF _l.status<>'approved' OR _l.expires_at<=now() THEN RAISE EXCEPTION 'Only live, approved ads can be Top Ads'; END IF;
  IF _l.is_promoted AND (_l.promotion_expires_at IS NULL OR _l.promotion_expires_at>now()) THEN
    RAISE EXCEPTION 'This ad is already a Top Ad';
  END IF;

  _st := public.tile_top_ad_status(_owner);
  IF _st->>'mode' <> 'unlimited' AND COALESCE((_st->>'remaining')::int,0) <= 0 THEN
    RAISE EXCEPTION 'Top Ad limit reached for your % plan', upper(_tier::text);
  END IF;

  _end := LEAST(
    now() + make_interval(days => LEAST(GREATEST(COALESCE(_days,7),1),14)),
    _l.expires_at,
    COALESCE(_p.subscription_until,_l.expires_at)
  );

  INSERT INTO public.top_ad_allocations(user_id,listing_id,tier,expires_at)
  VALUES(_owner,_listing_id,_tier,_end);

  UPDATE public.listings
  SET is_promoted=true,promotion_type='top_ad',promotion_started_at=now(),
      promotion_expires_at=_end,republished_from_expiry=false
  WHERE id=_listing_id;

  RETURN _end;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_promote_listing(_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid := public.merchant_owner_for_user(auth.uid());
  _l record;
  _st jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','not_authenticated'); END IF;
  SELECT id,status,expires_at,is_promoted,promotion_expires_at INTO _l
  FROM public.listings WHERE id=_listing_id AND user_id=_owner;

  IF _l.id IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','not_found'); END IF;
  IF _l.status<>'approved' OR _l.expires_at<=now() THEN RETURN jsonb_build_object('allowed',false,'reason','listing_not_active'); END IF;
  IF _l.is_promoted AND (_l.promotion_expires_at IS NULL OR _l.promotion_expires_at>now()) THEN
    RETURN jsonb_build_object('allowed',false,'reason','already_top_ad');
  END IF;

  _st := public.tile_top_ad_status(_owner);
  IF _st->>'mode'='none' THEN RETURN _st || jsonb_build_object('allowed',false,'reason','plan_required'); END IF;
  IF _st->>'mode'<>'unlimited' AND COALESCE((_st->>'remaining')::int,0)<=0 THEN
    RETURN _st || jsonb_build_object('allowed',false,'reason','limit_reached');
  END IF;
  RETURN _st || jsonb_build_object('allowed',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_vip_advanced_analytics(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid;
  _tier public.sub_tier;
  _period integer := LEAST(GREATEST(COALESCE(_days,30),7),90);
  _since timestamptz;
  _summary jsonb;
  _daily jsonb;
  _top_listings jsonb;
  _promotion jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _owner := public.merchant_owner_for_user(_uid);
  SELECT public.effective_tier(subscription_tier,subscription_until) INTO _tier FROM public.profiles WHERE id=_owner;
  IF _tier<>'vip' THEN RAISE EXCEPTION 'Advanced analytics are a VIP feature'; END IF;
  _since := now() - make_interval(days=>_period);

  SELECT jsonb_build_object(
    'live_listings', (SELECT COUNT(*)::int FROM public.listings WHERE user_id=_owner AND status='approved' AND expires_at>now()),
    'views', COUNT(*) FILTER (WHERE e.event_type='view'),
    'impressions', COUNT(*) FILTER (WHERE e.event_type='impression'),
    'saves', COUNT(*) FILTER (WHERE e.event_type='save'),
    'chats', COUNT(*) FILTER (WHERE e.event_type='chat'),
    'whatsapp', COUNT(*) FILTER (WHERE e.event_type='whatsapp'),
    'phone', COUNT(*) FILTER (WHERE e.event_type='phone'),
    'shares', COUNT(*) FILTER (WHERE e.event_type='share'),
    'ctr', CASE WHEN COUNT(*) FILTER (WHERE e.event_type='impression')>0
      THEN ROUND((COUNT(*) FILTER (WHERE e.event_type='view')::numeric /
                  COUNT(*) FILTER (WHERE e.event_type='impression')::numeric)*100,2)
      ELSE 0 END
  ) INTO _summary
  FROM public.listings l
  LEFT JOIN public.listing_events e ON e.listing_id=l.id AND e.created_at>=_since
  WHERE l.user_id=_owner;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', d.day::date,
    'impressions', COALESCE(x.impressions,0),
    'views', COALESCE(x.views,0),
    'saves', COALESCE(x.saves,0),
    'chats', COALESCE(x.chats,0),
    'whatsapp', COALESCE(x.whatsapp,0),
    'phone', COALESCE(x.phone,0),
    'shares', COALESCE(x.shares,0)
  ) ORDER BY d.day),'[]'::jsonb)
  INTO _daily
  FROM generate_series(date_trunc('day',_since),date_trunc('day',now()),interval '1 day') d(day)
  LEFT JOIN LATERAL (
    SELECT COUNT(*) FILTER (WHERE event_type='impression')::int impressions,
           COUNT(*) FILTER (WHERE event_type='view')::int views,
           COUNT(*) FILTER (WHERE event_type='save')::int saves,
           COUNT(*) FILTER (WHERE event_type='chat')::int chats,
           COUNT(*) FILTER (WHERE event_type='whatsapp')::int whatsapp,
           COUNT(*) FILTER (WHERE event_type='phone')::int phone,
           COUNT(*) FILTER (WHERE event_type='share')::int shares
    FROM public.listing_events e
    JOIN public.listings l ON l.id=e.listing_id
    WHERE l.user_id=_owner AND e.created_at>=d.day AND e.created_at<d.day+interval '1 day'
  ) x ON true;

  SELECT COALESCE(jsonb_agg(to_jsonb(q) ORDER BY q.views DESC,q.chats DESC),'[]'::jsonb)
  INTO _top_listings
  FROM (
    SELECT l.id listing_id,l.title,l.is_promoted,
           COUNT(e.*) FILTER (WHERE e.event_type='impression')::int impressions,
           COUNT(e.*) FILTER (WHERE e.event_type='view')::int views,
           COUNT(e.*) FILTER (WHERE e.event_type='save')::int saves,
           COUNT(e.*) FILTER (WHERE e.event_type='chat')::int chats,
           COUNT(e.*) FILTER (WHERE e.event_type='whatsapp')::int whatsapp,
           COUNT(e.*) FILTER (WHERE e.event_type='phone')::int phone,
           COUNT(e.*) FILTER (WHERE e.event_type='share')::int shares,
           CASE WHEN COUNT(e.*) FILTER (WHERE e.event_type='impression')>0
             THEN ROUND((COUNT(e.*) FILTER (WHERE e.event_type='view')::numeric /
                         COUNT(e.*) FILTER (WHERE e.event_type='impression')::numeric)*100,2)
             ELSE 0 END ctr
    FROM public.listings l
    LEFT JOIN public.listing_events e ON e.listing_id=l.id AND e.created_at>=_since
    WHERE l.user_id=_owner
    GROUP BY l.id,l.title,l.is_promoted
    LIMIT 50
  ) q;

  SELECT jsonb_build_object(
    'active_top_ads', COUNT(*) FILTER (WHERE is_promoted AND status='approved' AND expires_at>now()
      AND (promotion_expires_at IS NULL OR promotion_expires_at>now())),
    'total_promotions_started', COUNT(*)
  ) INTO _promotion
  FROM public.top_ad_allocations
  WHERE user_id=_owner AND started_at>=_since;

  RETURN jsonb_build_object('tier',_tier,'period_days',_period,'summary',_summary,'daily',_daily,
                             'top_listings',_top_listings,'promotion',_promotion);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_sales_assistant_context(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid;
  _tier public.sub_tier;
  _days_safe integer := LEAST(GREATEST(COALESCE(_days,30),7),90);
  _since timestamptz;
  _profile jsonb;
  _kpis jsonb;
  _top_products jsonb;
  _recent_inquiries jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _owner := public.merchant_owner_for_user(_uid);
  SELECT public.effective_tier(subscription_tier,subscription_until) INTO _tier FROM public.profiles WHERE id=_owner;
  IF _tier<>'vip' THEN RAISE EXCEPTION 'AI Sales Assistant is a VIP feature'; END IF;
  _since := now()-make_interval(days=>_days_safe);

  SELECT jsonb_build_object(
    'business_name',COALESCE(business_name,full_name),
    'location',COALESCE(location,concat_ws(', ',state,lga)),
    'shop_slug',shop_slug,'tier',_tier
  ) INTO _profile FROM public.profiles WHERE id=_owner;

  SELECT jsonb_build_object(
    'views',COUNT(*) FILTER (WHERE e.event_type='view'),
    'impressions',COUNT(*) FILTER (WHERE e.event_type='impression'),
    'saves',COUNT(*) FILTER (WHERE e.event_type='save'),
    'chats',COUNT(*) FILTER (WHERE e.event_type='chat'),
    'whatsapp',COUNT(*) FILTER (WHERE e.event_type='whatsapp'),
    'phone',COUNT(*) FILTER (WHERE e.event_type='phone'),
    'shares',COUNT(*) FILTER (WHERE e.event_type='share')
  ) INTO _kpis
  FROM public.listings l
  LEFT JOIN public.listing_events e ON e.listing_id=l.id AND e.created_at>=_since
  WHERE l.user_id=_owner;

  SELECT COALESCE(jsonb_agg(to_jsonb(q)),'[]'::jsonb) INTO _top_products
  FROM (
    SELECT l.id listing_id,l.title,l.price,l.is_promoted,
           COUNT(e.*) FILTER (WHERE e.event_type='view')::int views,
           COUNT(e.*) FILTER (WHERE e.event_type='chat')::int chats,
           COUNT(e.*) FILTER (WHERE e.event_type='whatsapp')::int whatsapp,
           COUNT(e.*) FILTER (WHERE e.event_type='save')::int saves
    FROM public.listings l
    LEFT JOIN public.listing_events e ON e.listing_id=l.id AND e.created_at>=_since
    WHERE l.user_id=_owner
    GROUP BY l.id,l.title,l.price,l.is_promoted
    ORDER BY chats DESC,views DESC
    LIMIT 20
  ) q;

  SELECT COALESCE(jsonb_agg(to_jsonb(q)),'[]'::jsonb) INTO _recent_inquiries
  FROM (
    SELECT c.id chat_id,c.listing_id,l.title listing_title,
           COALESCE(p.business_name,p.full_name) customer_name,
           MAX(m.created_at) last_message_at,
           (array_agg(m.content ORDER BY m.created_at DESC))[1] last_message
    FROM public.chats c
    JOIN public.listings l ON l.id=c.listing_id
    JOIN public.profiles p ON p.id=c.buyer_id
    LEFT JOIN public.messages m ON m.chat_id=c.id
    WHERE c.seller_id=_owner AND c.created_at>=_since
    GROUP BY c.id,c.listing_id,l.title,p.business_name,p.full_name
    ORDER BY last_message_at DESC NULLS LAST
    LIMIT 30
  ) q;

  RETURN jsonb_build_object(
    'business',_profile,'period_days',_days_safe,'kpis',_kpis,'top_products',_top_products,
    'recent_inquiries',_recent_inquiries,
    'capabilities',ARRAY['sales_summary','product_recommendations','follow_up_suggestions',
                         'promotion_advice','customer_inquiry_prioritization']
  );
END;
$$;

ALTER TABLE public.channel_connections
  ADD COLUMN IF NOT EXISTS auto_post_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.channel_connections
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
ALTER TABLE public.channel_publications
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

CREATE OR REPLACE FUNCTION public.set_vip_channel_automation(_channel text,_enabled boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _owner uuid:=public.merchant_owner_for_user(auth.uid()); _tier public.sub_tier;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT public.effective_tier(subscription_tier,subscription_until) INTO _tier FROM public.profiles WHERE id=_owner;
  IF _tier<>'vip' THEN RAISE EXCEPTION 'Automated channel posting is a VIP feature'; END IF;
  IF _channel NOT IN ('google','meta') THEN RAISE EXCEPTION 'Unknown channel'; END IF;
  INSERT INTO public.channel_connections(user_id,channel,status,auto_post_enabled,updated_at)
  VALUES(_owner,_channel,'pending_external_integration',_enabled,now())
  ON CONFLICT (user_id,channel)
  DO UPDATE SET auto_post_enabled=EXCLUDED.auto_post_enabled,updated_at=now();
  RETURN jsonb_build_object('channel',_channel,'auto_post_enabled',_enabled,'status','pending_external_integration');
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_vip_channel_publication(
  _listing_id uuid,_channel text,_scheduled_for timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid:=auth.uid(); _owner uuid; _tier public.sub_tier; _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _owner:=public.merchant_owner_for_user(_uid);
  SELECT public.effective_tier(subscription_tier,subscription_until) INTO _tier FROM public.profiles WHERE id=_owner;
  IF _tier<>'vip' THEN RAISE EXCEPTION 'Channel publishing is a VIP feature'; END IF;
  IF _channel NOT IN ('google','meta') THEN RAISE EXCEPTION 'Unknown channel'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.listings WHERE id=_listing_id AND user_id=_owner AND status='approved' AND expires_at>now()) THEN
    RAISE EXCEPTION 'Only your live, approved listing can be queued';
  END IF;

  INSERT INTO public.channel_publications(listing_id,user_id,channel,status,scheduled_for,next_retry_at,attempt_count,updated_at)
  VALUES(_listing_id,_owner,_channel,'queued',COALESCE(_scheduled_for,now()),COALESCE(_scheduled_for,now()),0,now())
  ON CONFLICT (listing_id,channel)
  DO UPDATE SET status='queued',scheduled_for=EXCLUDED.scheduled_for,next_retry_at=EXCLUDED.next_retry_at,last_error=NULL,updated_at=now()
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_vip_channel_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _owner uuid:=public.merchant_owner_for_user(auth.uid()); _tier public.sub_tier;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT public.effective_tier(subscription_tier,subscription_until) INTO _tier FROM public.profiles WHERE id=_owner;
  IF _tier<>'vip' THEN RAISE EXCEPTION 'Channel integrations are a VIP feature'; END IF;
  RETURN jsonb_build_object(
    'tier',_tier,
    'channels',COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'channel',cc.channel,'status',cc.status,'auto_post_enabled',cc.auto_post_enabled,
        'connected_at',cc.connected_at,'last_synced_at',cc.last_synced_at,'last_error',cc.last_error
      ) ORDER BY cc.channel) FROM public.channel_connections cc WHERE cc.user_id=_owner
    ),'[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid:=auth.uid();
  _owner uuid;
  _tier public.sub_tier;
  _until timestamptz;
  _max int;
  _active int;
  _verified boolean;
  _staff_ctx jsonb;
BEGIN
  IF _uid IS NULL THEN RETURN NULL; END IF;
  _owner:=public.merchant_owner_for_user(_uid);
  SELECT public.effective_tier(subscription_tier,subscription_until),subscription_until,COALESCE(is_verified,false)
  INTO _tier,_until,_verified FROM public.profiles WHERE id=_owner;

  _tier:=COALESCE(_tier,'free');
  _max:=public.tile_max_active_listings(_tier);
  _active:=public.tile_active_listing_count(_owner);
  _staff_ctx:=public.get_my_staff_context();

  RETURN jsonb_build_object(
    'tier',_tier,
    'tier_rank',CASE _tier WHEN 'vip' THEN 3 WHEN 'pro' THEN 2 WHEN 'lite' THEN 1 ELSE 0 END,
    'active_until',CASE WHEN _tier='free' THEN NULL ELSE _until END,
    'max_active_listings',_max,'active_listings',_active,
    'can_create_listing',(_max IS NULL OR _active<_max),
    'top_ads',public.tile_top_ad_status(_owner),
    'custom_shop_url',_tier<>'free',
    'qr_code',_tier<>'free',
    'verified_vendor_badge',(_tier<>'free' AND _verified),
    'verification_required_for_badge',(_tier<>'free' AND NOT _verified),
    'priority_support',_tier<>'free',
    'featured_vendor_eligible',_tier IN ('pro','vip'),
    'homepage_priority',_tier IN ('pro','vip'),
    'homepage_featured_placement',_tier='vip',
    'unlimited_listings',_tier='vip',
    'unlimited_promotions',_tier='vip',
    'multiple_staff_accounts',_tier='vip',
    'advanced_analytics',_tier='vip',
    'google_business_integration',_tier='vip',
    'automated_social_posting',_tier='vip',
    'ai_sales_assistant',_tier='vip',
    'analytics_level',CASE _tier WHEN 'free' THEN 'basic' WHEN 'lite' THEN 'basic' WHEN 'pro' THEN 'advanced' ELSE 'advanced_plus' END,
    'cross_platform_publishing',CASE WHEN _tier='vip' THEN 'queued_or_pending_external_integration' ELSE 'not_included' END,
    'staff_context',_staff_ctx
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_merchant_staff()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at:=now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS merchant_staff_updated_at ON public.merchant_staff;
CREATE TRIGGER merchant_staff_updated_at BEFORE UPDATE ON public.merchant_staff
FOR EACH ROW EXECUTE FUNCTION public.touch_merchant_staff();

REVOKE ALL ON FUNCTION public.invite_staff_member(text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.accept_staff_invite(text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.list_my_staff_accounts() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.revoke_staff_member(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.get_my_staff_context() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.get_vip_advanced_analytics(integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.get_ai_sales_assistant_context(integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.set_vip_channel_automation(text,boolean) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.queue_vip_channel_publication(uuid,text,timestamptz) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.get_vip_channel_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.invite_staff_member(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_staff_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_staff_accounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_staff_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_staff_context() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vip_advanced_analytics(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_sales_assistant_context(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_vip_channel_automation(text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_vip_channel_publication(uuid,text,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vip_channel_status() TO authenticated;
