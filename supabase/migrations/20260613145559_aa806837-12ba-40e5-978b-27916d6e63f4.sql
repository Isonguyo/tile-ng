
-- ============ TIER 2 SCHEMA EXPANSION ============

-- subscription tier enum
DO $$ BEGIN
  CREATE TYPE public.sub_tier AS ENUM ('free','lite','pro','vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS lga TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS is_merchant BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shop_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_tier public.sub_tier NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_sales INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_minutes INTEGER NOT NULL DEFAULT 240;

GRANT SELECT (id, full_name, avatar_url, is_verified, location, created_at,
  business_name, state, lga, bio, shop_slug, subscription_tier, total_sales,
  avg_rating, response_minutes, is_merchant) ON public.profiles TO anon, authenticated;

-- tier calculator
CREATE OR REPLACE FUNCTION public.compute_tier(_age_days INT, _sales INT, _rating NUMERIC, _kyc_verified BOOL, _response_min INT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _kyc_verified AND _age_days >= 90 AND _sales >= 20 AND _rating >= 4.5 AND _response_min <= 120 THEN 'gold'
    WHEN _kyc_verified AND _age_days >= 30 AND _sales >= 3 AND _rating >= 4.0 THEN 'silver'
    ELSE 'bronze'
  END;
$$;

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user_unread ON public.notifications(user_id, read, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Notify on new chat message
CREATE OR REPLACE FUNCTION public.notify_new_message() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE recipient UUID; chat_rec RECORD;
BEGIN
  SELECT * INTO chat_rec FROM public.chats WHERE id = NEW.chat_id;
  recipient := CASE WHEN NEW.sender_id = chat_rec.buyer_id THEN chat_rec.seller_id ELSE chat_rec.buyer_id END;
  INSERT INTO public.notifications(user_id, title, body, link)
  VALUES (recipient, 'New message', LEFT(NEW.body, 80), '/listing/' || chat_rec.listing_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS msg_notify ON public.messages;
CREATE TRIGGER msg_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ============ ADMIN INVITE CODES ============
CREATE TABLE IF NOT EXISTS public.admin_invite_codes (
  code TEXT PRIMARY KEY,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_invite_codes TO service_role;
ALTER TABLE public.admin_invite_codes ENABLE ROW LEVEL SECURITY;
-- no policies: locked, only accessible via SECURITY DEFINER fn

INSERT INTO public.admin_invite_codes(code) VALUES ('TILE-ADMIN-7F3K9P') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.redeem_admin_code(_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE row_count INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.admin_invite_codes
    SET used_by = auth.uid(), used_at = now()
    WHERE code = _code AND used_by IS NULL;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count = 0 THEN RETURN FALSE; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN TRUE;
END $$;
REVOKE EXECUTE ON FUNCTION public.redeem_admin_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_admin_code(TEXT) TO authenticated;

-- ============ SUBSCRIPTIONS ============
CREATE OR REPLACE FUNCTION public.activate_subscription(_tier public.sub_tier)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _cost NUMERIC; _bal NUMERIC; _prof public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _cost := CASE _tier WHEN 'lite' THEN 5000 WHEN 'pro' THEN 15000 WHEN 'vip' THEN 40000 ELSE 0 END;
  IF _cost = 0 THEN RAISE EXCEPTION 'Invalid tier'; END IF;
  SELECT wallet_balance INTO _bal FROM public.profiles WHERE id = auth.uid();
  IF _bal < _cost THEN RAISE EXCEPTION 'Insufficient wallet balance — top up first'; END IF;
  UPDATE public.profiles
    SET wallet_balance = wallet_balance - _cost,
        subscription_tier = _tier,
        subscription_until = now() + INTERVAL '30 days'
    WHERE id = auth.uid() RETURNING * INTO _prof;
  INSERT INTO public.wallet_transactions(user_id, amount, tx_type, reference)
    VALUES (auth.uid(), -_cost, 'subscription', _tier::text);
  INSERT INTO public.notifications(user_id, title, body, link)
    VALUES (auth.uid(), 'Subscription activated', _tier::text || ' plan active for 30 days', '/dashboard/billing');
  RETURN _prof;
END $$;
REVOKE EXECUTE ON FUNCTION public.activate_subscription(public.sub_tier) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_subscription(public.sub_tier) TO authenticated;

-- Generate shop slug on merchant signup
CREATE OR REPLACE FUNCTION public.gen_shop_slug(_name TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE base TEXT; final TEXT; n INT := 0;
BEGIN
  base := regexp_replace(lower(coalesce(_name,'shop')), '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  IF base = '' THEN base := 'shop'; END IF;
  final := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE shop_slug = final) LOOP
    n := n + 1; final := base || '-' || n;
  END LOOP;
  RETURN final;
END $$;

-- Public shop view (safe columns only)
CREATE OR REPLACE VIEW public.shops WITH (security_invoker=on) AS
SELECT id, full_name, business_name, avatar_url, bio, state, lga, location,
       is_verified, shop_slug, subscription_tier, total_sales, avg_rating,
       response_minutes, created_at,
       public.compute_tier(
         GREATEST(0, EXTRACT(day FROM (now() - created_at))::INT),
         total_sales, avg_rating, is_verified, response_minutes
       ) AS tier
FROM public.profiles WHERE shop_slug IS NOT NULL;
GRANT SELECT ON public.shops TO anon, authenticated;

-- Mark notifs read
CREATE OR REPLACE FUNCTION public.mark_notifications_read() RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.notifications SET read = true WHERE user_id = auth.uid() AND read = false;
$$;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read() TO authenticated;
