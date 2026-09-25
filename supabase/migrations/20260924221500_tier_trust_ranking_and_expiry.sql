-- 004_tier_trust_ranking_and_expiry.sql
-- Tile: tier + trust based ranking, real trust scores, expiry -> removal -> republish (free visibility),
-- and locking down platform_settings. Idempotent, non-destructive for existing data.

-- 1. Republish marker --------------------------------------------------------
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS republished_from_expiry boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_listings_status_expires ON public.listings (status, expires_at);

-- 2. Trust score (0-100), computed from real signals ------------------------
CREATE OR REPLACE FUNCTION public.seller_trust_score(_uid uuid)
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _p public.profiles;
  _s int := 50;
  _age int; _avg numeric; _cnt int; _neg int;
  _rejected int; _flagged int; _reports int; _approved int;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE id = _uid;
  IF _p.id IS NULL THEN RETURN 0; END IF;

  _age := EXTRACT(DAY FROM (now() - _p.created_at))::int;
  SELECT COALESCE(AVG(rating),0), COUNT(*), COUNT(*) FILTER (WHERE rating <= 2)
    INTO _avg, _cnt, _neg FROM public.shop_reviews WHERE shop_user_id = _uid;
  SELECT COUNT(*) FILTER (WHERE status = 'rejected'),
         COUNT(*) FILTER (WHERE status = 'flagged'),
         COUNT(*) FILTER (WHERE status = 'approved')
    INTO _rejected, _flagged, _approved FROM public.listings WHERE user_id = _uid;
  SELECT COUNT(*) INTO _reports FROM public.reports r
   WHERE r.status <> 'dismissed' AND (
     (r.entity_type = 'user' AND r.entity_id = _uid) OR
     (r.entity_type = 'listing' AND r.entity_id IN (SELECT id FROM public.listings WHERE user_id = _uid)));

  -- positives
  IF _p.is_verified THEN _s := _s + 10; END IF;
  IF _p.kyc_status = 'verified' THEN _s := _s + 10; END IF;
  IF _age >= 180 THEN _s := _s + 8; ELSIF _age >= 30 THEN _s := _s + 4; END IF;
  _s := _s + LEAST(8, _approved);
  IF _cnt >= 3 THEN
    IF _avg >= 4.5 THEN _s := _s + 12;
    ELSIF _avg >= 4.0 THEN _s := _s + 6;
    ELSIF _avg < 2.0 THEN _s := _s - 20;
    ELSIF _avg < 3.0 THEN _s := _s - 10; END IF;
  END IF;
  -- negatives
  _s := _s - LEAST(20, _neg * 4);
  _s := _s - LEAST(25, _rejected * 5);
  _s := _s - LEAST(30, _flagged * 10);
  _s := _s - LEAST(32, _reports * 8);

  RETURN GREATEST(0, LEAST(100, _s));
END $$;

-- keep legacy name working (admin inspector uses it)
CREATE OR REPLACE FUNCTION public.user_trust_score(_uid uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.seller_trust_score(_uid) $$;

GRANT EXECUTE ON FUNCTION public.seller_trust_score(uuid) TO anon, authenticated;

-- 3. Effective tier (paid tier only counts while active) --------------------
CREATE OR REPLACE FUNCTION public.effective_tier_rank(_tier sub_tier, _until timestamptz)
RETURNS integer LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN _tier IS NULL OR _tier = 'free' THEN 0
    WHEN _until IS NOT NULL AND _until < now() THEN 0
    WHEN _tier = 'vip' THEN 3 WHEN _tier = 'pro' THEN 2 WHEN _tier = 'lite' THEN 1
    ELSE 0 END
$$;

-- 4. Ranked marketplace search ----------------------------------------------
-- Order: seller tier (VIP > PRO > LITE > FREE), then active promotion, then trust, then relevance, then recency.
-- Ads republished after expiry always rank as FREE and lose promotion.
CREATE OR REPLACE FUNCTION public.search_listings(
  _q text DEFAULT NULL, _location text DEFAULT NULL, _category text DEFAULT NULL,
  _type text DEFAULT NULL, _limit int DEFAULT 150)
RETURNS TABLE (
  id uuid, title text, price numeric, type listing_type, category text, description text,
  location text, images text[], is_promoted boolean, views_count int, clicks_count int,
  user_id uuid, created_at timestamptz, seller_tier text, seller_verified boolean,
  seller_name text, seller_shop text, trust_score int, rank_tier int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH base AS (
    SELECT l.*, p.subscription_tier, p.subscription_until, p.is_verified AS pv,
           p.business_name, p.full_name, p.shop_slug,
           CASE WHEN l.republished_from_expiry THEN 0
                ELSE public.effective_tier_rank(p.subscription_tier, p.subscription_until) END AS tr,
           (NOT l.republished_from_expiry AND l.is_promoted
             AND (l.promotion_expires_at IS NULL OR l.promotion_expires_at > now())) AS promo_active,
           CASE WHEN _q IS NULL OR _q = '' THEN 0
                WHEN l.title ILIKE '%'||_q||'%' THEN 2 ELSE 1 END AS rel
    FROM public.listings l
    JOIN public.profiles p ON p.id = l.user_id
    WHERE l.status = 'approved' AND l.expires_at > now()
      AND (_q IS NULL OR _q = '' OR l.title ILIKE '%'||_q||'%' OR l.description ILIKE '%'||_q||'%' OR l.category ILIKE '%'||_q||'%')
      AND (_location IS NULL OR _location = '' OR _location = 'all' OR l.location = _location)
      AND (_category IS NULL OR _category = '' OR l.category = _category)
      AND (_type IS NULL OR _type = '' OR l.type::text = _type)
  ), scored AS (
    SELECT b.*, public.seller_trust_score(b.user_id) AS ts FROM base b
  )
  SELECT s.id, s.title, s.price, s.type, s.category, s.description, s.location, s.images,
         s.promo_active, s.views_count, s.clicks_count, s.user_id, s.created_at,
         CASE WHEN s.tr = 0 THEN 'free' ELSE s.subscription_tier::text END,
         s.pv, COALESCE(s.business_name, s.full_name), s.shop_slug, s.ts, s.tr
  FROM scored s
  ORDER BY s.tr DESC, s.promo_active DESC, s.ts DESC, s.rel DESC, s.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit,150),1),300)
$$;
GRANT EXECUTE ON FUNCTION public.search_listings(text,text,text,text,int) TO anon, authenticated;

-- 5. Expiry: hide immediately, delete permanently 30 days after it was marked expired
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS expired_at timestamptz;
CREATE OR REPLACE FUNCTION public.expire_old_listings()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ DECLARE n int; BEGIN
  UPDATE public.listings SET status = 'expired', is_promoted = false, expired_at = now()
   WHERE status = 'approved' AND expires_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE public.listings SET expired_at = now() WHERE status = 'expired' AND expired_at IS NULL;
  DELETE FROM public.listings WHERE status = 'expired' AND expired_at <= now() - interval '30 days';
  RETURN n; END $$;
REVOKE EXECUTE ON FUNCTION public.expire_old_listings() FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.clear_expired_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN IF NEW.status <> 'expired' THEN NEW.expired_at := NULL; END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS listings_clear_expired_at ON public.listings;
CREATE TRIGGER listings_clear_expired_at BEFORE UPDATE OF status ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.clear_expired_at();

-- 6. Renew / republish ------------------------------------------------------
-- Active ad: extend 30 days. Expired ad: republish (goes live again but ranks as FREE, no promotion).
CREATE OR REPLACE FUNCTION public.renew_listing(_listing_id uuid)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_exp timestamptz; _st listing_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT status INTO _st FROM public.listings WHERE id = _listing_id AND user_id = auth.uid();
  IF _st IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF _st IN ('rejected','flagged','pending') THEN RAISE EXCEPTION 'This ad cannot be renewed in its current state'; END IF;

  IF _st = 'expired' THEN
    UPDATE public.listings
       SET status = 'approved', expires_at = now() + interval '30 days',
           renewed_count = renewed_count + 1, republished_from_expiry = true,
           is_promoted = false, promotion_type = NULL,
           promotion_started_at = NULL, promotion_expires_at = NULL
     WHERE id = _listing_id RETURNING expires_at INTO new_exp;
  ELSE
    UPDATE public.listings
       SET expires_at = GREATEST(expires_at, now()) + interval '30 days',
           renewed_count = renewed_count + 1
     WHERE id = _listing_id RETURNING expires_at INTO new_exp;
  END IF;
  RETURN new_exp;
END $$;
REVOKE EXECUTE ON FUNCTION public.renew_listing(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.renew_listing(uuid) TO authenticated;

-- ensure the hourly expiry job exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-listings-hourly') THEN
    PERFORM cron.schedule('expire-listings-hourly', '0 * * * *', 'SELECT public.expire_old_listings();');
  END IF;
END $$;

-- 7. platform_settings: no more open table reads ----------------------------
DROP POLICY IF EXISTS "Anyone reads platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Staff read platform settings" ON public.platform_settings;
CREATE POLICY "Staff read platform settings" ON public.platform_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator') OR public.has_role(auth.uid(),'support'));
REVOKE SELECT ON public.platform_settings FROM anon;

-- public-facing flags only (no updated_by)
CREATE OR REPLACE FUNCTION public.get_public_platform_flags()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((SELECT to_jsonb(ps) - 'updated_by' FROM public.platform_settings ps WHERE id = 1), '{}'::jsonb) $$;
GRANT EXECUTE ON FUNCTION public.get_public_platform_flags() TO anon, authenticated;
