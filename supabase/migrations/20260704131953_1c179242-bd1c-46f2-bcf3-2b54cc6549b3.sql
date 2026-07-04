
-- 1) Subscription history
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier sub_tier NOT NULL,
  amount NUMERIC NOT NULL,
  wallet_before NUMERIC NOT NULL,
  wallet_after NUMERIC NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.subscription_history TO authenticated;
GRANT ALL ON public.subscription_history TO service_role;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own history readable" ON public.subscription_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all history" ON public.subscription_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 2) Promotion tracking columns
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promotion_credits INTEGER NOT NULL DEFAULT 0;

-- 3) Enforce quota at INSERT time (defense-in-depth beyond check_post_quota)
CREATE OR REPLACE FUNCTION public.enforce_listing_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tier sub_tier; _max_g INT; _max_s INT; _cnt INT;
BEGIN
  IF NEW.user_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Cannot create listings for another user';
  END IF;
  SELECT COALESCE(subscription_tier,'free') INTO _tier FROM public.profiles WHERE id = NEW.user_id;
  SELECT max_goods, max_services INTO _max_g, _max_s FROM public.subscription_plans WHERE tier = _tier;
  IF NEW.type = 'goods' THEN
    SELECT COUNT(*) INTO _cnt FROM public.listings
      WHERE user_id = NEW.user_id AND type='goods' AND status IN ('pending','approved');
    IF _max_g IS NOT NULL AND _cnt >= _max_g THEN
      RAISE EXCEPTION 'Listing quota reached (% of % goods). Upgrade your plan to post more.', _cnt, _max_g;
    END IF;
  ELSIF NEW.type = 'service' THEN
    SELECT COUNT(*) INTO _cnt FROM public.listings
      WHERE user_id = NEW.user_id AND type='service' AND status IN ('pending','approved');
    IF _max_s IS NOT NULL AND _cnt >= _max_s THEN
      RAISE EXCEPTION 'Service quota reached (% of %). Upgrade your plan to post more.', _cnt, _max_s;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_listing_quota ON public.listings;
CREATE TRIGGER trg_enforce_listing_quota
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_quota();

-- 4) Promotion RPC
CREATE OR REPLACE FUNCTION public.promote_listing(_listing_id UUID, _days INTEGER DEFAULT 7)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner UUID; _tier sub_tier; _can BOOLEAN; _credits INT; _cost NUMERIC; _bal NUMERIC; _until TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _days NOT IN (3,7,14,30) THEN RAISE EXCEPTION 'Invalid duration'; END IF;

  SELECT user_id INTO _owner FROM public.listings WHERE id = _listing_id;
  IF _owner IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF _owner <> auth.uid() THEN RAISE EXCEPTION 'Not the listing owner'; END IF;

  SELECT COALESCE(subscription_tier,'free'), promotion_credits, wallet_balance
    INTO _tier, _credits, _bal FROM public.profiles WHERE id = auth.uid();

  SELECT can_promote INTO _can FROM public.subscription_plans WHERE tier = _tier;
  IF NOT _can AND _credits <= 0 THEN
    RAISE EXCEPTION 'Promotion requires Lite plan or higher. Upgrade to boost listings.';
  END IF;

  _cost := (_days::NUMERIC) * 200; -- ₦200/day

  IF _credits > 0 THEN
    UPDATE public.profiles SET promotion_credits = promotion_credits - 1 WHERE id = auth.uid();
  ELSE
    IF _bal < _cost THEN RAISE EXCEPTION 'Insufficient wallet balance (need ₦%). Top up to promote.', _cost; END IF;
    UPDATE public.profiles SET wallet_balance = wallet_balance - _cost WHERE id = auth.uid();
    INSERT INTO public.wallet_transactions(user_id, amount, tx_type, reference)
      VALUES (auth.uid(), -_cost, 'promotion', _listing_id::text);
  END IF;

  _until := GREATEST(COALESCE((SELECT promoted_until FROM public.listings WHERE id=_listing_id), now()), now())
            + (_days || ' days')::INTERVAL;
  UPDATE public.listings SET is_promoted = true, promoted_until = _until WHERE id = _listing_id;

  INSERT INTO public.notifications(user_id,title,body,link)
    VALUES (auth.uid(),'Listing boosted','Your listing is promoted for ' || _days || ' days.', '/listing/' || _listing_id::text);

  RETURN _until;
END $$;

REVOKE EXECUTE ON FUNCTION public.promote_listing(UUID, INTEGER) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_listing(UUID, INTEGER) TO authenticated;

-- 5) Dashboard stats
CREATE OR REPLACE FUNCTION public.dashboard_stats()
RETURNS TABLE(
  listings_count BIGINT, approved_count BIGINT, pending_count BIGINT,
  views_total BIGINT, clicks_total BIGINT, favorites_total BIGINT,
  chats_total BIGINT, unread_messages BIGINT, promoted_active BIGINT,
  conversion_rate NUMERIC, wallet_balance NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  RETURN QUERY
    SELECT
      (SELECT COUNT(*) FROM public.listings WHERE user_id=_uid),
      (SELECT COUNT(*) FROM public.listings WHERE user_id=_uid AND status='approved'),
      (SELECT COUNT(*) FROM public.listings WHERE user_id=_uid AND status='pending'),
      COALESCE((SELECT SUM(views_count) FROM public.listings WHERE user_id=_uid),0)::BIGINT,
      COALESCE((SELECT SUM(clicks_count) FROM public.listings WHERE user_id=_uid),0)::BIGINT,
      (SELECT COUNT(*) FROM public.favorites f JOIN public.listings l ON l.id=f.listing_id WHERE l.user_id=_uid),
      (SELECT COUNT(*) FROM public.chats WHERE seller_id=_uid OR buyer_id=_uid),
      (SELECT COUNT(*) FROM public.messages m JOIN public.chats c ON c.id=m.chat_id
         WHERE (c.buyer_id=_uid OR c.seller_id=_uid) AND m.sender_id<>_uid AND m.read_at IS NULL),
      (SELECT COUNT(*) FROM public.listings WHERE user_id=_uid AND is_promoted=true AND (promoted_until IS NULL OR promoted_until>now())),
      CASE WHEN COALESCE((SELECT SUM(views_count) FROM public.listings WHERE user_id=_uid),0) > 0
        THEN ROUND(100.0 * COALESCE((SELECT SUM(clicks_count) FROM public.listings WHERE user_id=_uid),0)
                        / (SELECT SUM(views_count) FROM public.listings WHERE user_id=_uid), 2)
        ELSE 0 END,
      (SELECT wallet_balance FROM public.profiles WHERE id=_uid);
END $$;

REVOKE EXECUTE ON FUNCTION public.dashboard_stats() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.dashboard_stats() TO authenticated;

-- 6) Merchant health score
CREATE OR REPLACE FUNCTION public.merchant_health_score()
RETURNS TABLE(score INTEGER, verified BOOLEAN, kyc_done BOOLEAN, profile_complete BOOLEAN,
              has_avatar BOOLEAN, has_bio BOOLEAN, has_shop BOOLEAN,
              active_listings BIGINT, avg_rating NUMERIC, recommendations TEXT[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _p public.profiles; _cnt BIGINT; _s INT := 0; _recs TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _p FROM public.profiles WHERE id=_uid;
  SELECT COUNT(*) INTO _cnt FROM public.listings WHERE user_id=_uid AND status='approved';

  IF _p.is_verified THEN _s := _s + 20; ELSE _recs := _recs || 'Get verified to build trust'; END IF;
  IF _p.kyc_status = 'approved' THEN _s := _s + 20; ELSE _recs := _recs || 'Complete KYC verification'; END IF;
  IF _p.avatar_url IS NOT NULL THEN _s := _s + 10; ELSE _recs := _recs || 'Upload a profile photo'; END IF;
  IF _p.bio IS NOT NULL AND length(_p.bio) > 20 THEN _s := _s + 10; ELSE _recs := _recs || 'Write a bio (at least 20 characters)'; END IF;
  IF _p.shop_slug IS NOT NULL THEN _s := _s + 10; ELSE _recs := _recs || 'Set up your shop URL'; END IF;
  IF _cnt >= 3 THEN _s := _s + 15; ELSIF _cnt >= 1 THEN _s := _s + 5; ELSE _recs := _recs || 'Post at least 3 listings'; END IF;
  IF COALESCE(_p.avg_rating,0) >= 4.0 THEN _s := _s + 15;
    ELSIF COALESCE(_p.avg_rating,0) >= 3.0 THEN _s := _s + 8;
    ELSE _recs := _recs || 'Aim for 4+ star customer ratings'; END IF;

  RETURN QUERY SELECT _s,
    _p.is_verified,
    _p.kyc_status='approved',
    (_p.avatar_url IS NOT NULL AND _p.bio IS NOT NULL),
    _p.avatar_url IS NOT NULL,
    _p.bio IS NOT NULL,
    _p.shop_slug IS NOT NULL,
    _cnt, COALESCE(_p.avg_rating,0), _recs;
END $$;

REVOKE EXECUTE ON FUNCTION public.merchant_health_score() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.merchant_health_score() TO authenticated;

-- 7) activate_subscription now also writes history
CREATE OR REPLACE FUNCTION public.activate_subscription(_tier sub_tier)
RETURNS profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cost NUMERIC; _bal NUMERIC; _prof public.profiles; _new_bal NUMERIC; _boost INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _cost := CASE _tier WHEN 'lite' THEN 5000 WHEN 'pro' THEN 15000 WHEN 'vip' THEN 40000 ELSE 0 END;
  IF _cost = 0 THEN RAISE EXCEPTION 'Invalid tier'; END IF;
  SELECT wallet_balance INTO _bal FROM public.profiles WHERE id = auth.uid();
  IF _bal < _cost THEN RAISE EXCEPTION 'Insufficient wallet balance — top up first'; END IF;
  SELECT boost_credits INTO _boost FROM public.subscription_plans WHERE tier = _tier;

  UPDATE public.profiles
    SET wallet_balance = wallet_balance - _cost,
        subscription_tier = _tier,
        subscription_until = now() + INTERVAL '30 days',
        promotion_credits = promotion_credits + COALESCE(_boost,0)
    WHERE id = auth.uid() RETURNING * INTO _prof;
  _new_bal := _prof.wallet_balance;

  INSERT INTO public.wallet_transactions(user_id, amount, tx_type, reference)
    VALUES (auth.uid(), -_cost, 'subscription', _tier::text);
  INSERT INTO public.subscription_history(user_id, tier, amount, wallet_before, wallet_after, expires_at, status)
    VALUES (auth.uid(), _tier, _cost, _bal, _new_bal, _prof.subscription_until, 'active');
  INSERT INTO public.notifications(user_id, title, body, link)
    VALUES (auth.uid(), 'Subscription activated', _tier::text || ' plan active for 30 days', '/dashboard');
  RETURN _prof;
END $$;
