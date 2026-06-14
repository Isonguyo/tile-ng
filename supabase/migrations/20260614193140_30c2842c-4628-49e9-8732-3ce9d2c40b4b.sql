
-- Ad lifespan + quotas + portfolio + renew + public seller lookup

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  ADD COLUMN IF NOT EXISTS renewed_count INTEGER NOT NULL DEFAULT 0;

ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'expired';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portfolio_images TEXT[] NOT NULL DEFAULT '{}';

-- Make public homepage feed exclude expired (policy already filters by status='approved')
-- We rely on auto-expire job to flip status.

CREATE OR REPLACE FUNCTION public.expire_old_listings()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INT;
BEGIN
  UPDATE public.listings SET status = 'expired'
    WHERE status = 'approved' AND expires_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.expire_old_listings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_old_listings() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.renew_listing(_listing_id UUID)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_exp TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.listings
    SET expires_at = GREATEST(expires_at, now()) + INTERVAL '30 days',
        renewed_count = renewed_count + 1,
        status = CASE WHEN status = 'expired' THEN 'approved'::listing_status ELSE status END
    WHERE id = _listing_id AND user_id = auth.uid()
    RETURNING expires_at INTO new_exp;
  IF new_exp IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  RETURN new_exp;
END $$;
REVOKE EXECUTE ON FUNCTION public.renew_listing(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renew_listing(UUID) TO authenticated;

-- Quota check: free tier => 5 goods, 1 service
CREATE OR REPLACE FUNCTION public.check_post_quota(_type listing_type)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE tier sub_tier; cnt INT; max_goods INT; max_serv INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT subscription_tier INTO tier FROM public.profiles WHERE id = auth.uid();
  IF tier IN ('lite','pro','vip') THEN RETURN TRUE; END IF;
  SELECT COUNT(*) INTO cnt FROM public.listings
    WHERE user_id = auth.uid() AND type = _type
      AND status IN ('pending','approved');
  IF _type = 'goods' AND cnt >= 5 THEN RETURN FALSE; END IF;
  IF _type = 'service' AND cnt >= 1 THEN RETURN FALSE; END IF;
  RETURN TRUE;
END $$;
REVOKE EXECUTE ON FUNCTION public.check_post_quota(listing_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_post_quota(listing_type) TO authenticated;

-- Admin: list pending listings with seller info
CREATE OR REPLACE FUNCTION public.admin_pending_listings()
RETURNS TABLE(id UUID, title TEXT, price NUMERIC, category TEXT, type listing_type, images TEXT[], created_at TIMESTAMPTZ, seller_id UUID, seller_name TEXT, seller_phone TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT l.id, l.title, l.price, l.category, l.type, l.images, l.created_at,
           p.id, p.full_name, p.phone
    FROM public.listings l JOIN public.profiles p ON p.id = l.user_id
    WHERE l.status = 'pending' ORDER BY l.created_at DESC;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_pending_listings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pending_listings() TO authenticated;

-- Admin moderation actions that notify the seller
CREATE OR REPLACE FUNCTION public.admin_approve_listing(_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID; _title TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.listings SET status='approved' WHERE id=_id
    RETURNING user_id, title INTO _uid, _title;
  INSERT INTO public.notifications(user_id,title,body,link)
    VALUES (_uid, 'Listing approved', _title || ' is now live.', '/listing/' || _id::text);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_approve_listing(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_listing(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_listing(_id UUID, _reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID; _title TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.listings SET status='rejected', rejection_reason=_reason WHERE id=_id
    RETURNING user_id, title INTO _uid, _title;
  INSERT INTO public.notifications(user_id,title,body,link)
    VALUES (_uid, 'Listing rejected', _title || ': ' || COALESCE(_reason,'No reason given'), '/dashboard');
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_reject_listing(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_listing(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_flag_seller(_listing_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT user_id INTO _uid FROM public.listings WHERE id=_listing_id;
  DELETE FROM public.listings WHERE id=_listing_id;
  UPDATE public.profiles SET is_verified=false WHERE id=_uid;
  INSERT INTO public.notifications(user_id,title,body)
    VALUES (_uid, 'Account flagged', 'Your listing was removed for policy violation.');
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_flag_seller(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_flag_seller(UUID) TO authenticated;

-- Vanity shop slug (Pro/VIP only)
CREATE OR REPLACE FUNCTION public.set_vanity_slug(_slug TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tier sub_tier; clean TEXT; exists_count INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT subscription_tier INTO tier FROM public.profiles WHERE id=auth.uid();
  IF tier NOT IN ('pro','vip') THEN RAISE EXCEPTION 'Pro or VIP required'; END IF;
  clean := regexp_replace(lower(_slug),'[^a-z0-9-]+','-','g');
  clean := trim(both '-' from clean);
  IF length(clean) < 3 THEN RAISE EXCEPTION 'Slug too short'; END IF;
  SELECT COUNT(*) INTO exists_count FROM public.profiles WHERE shop_slug=clean AND id<>auth.uid();
  IF exists_count > 0 THEN RAISE EXCEPTION 'Slug already taken'; END IF;
  UPDATE public.profiles SET shop_slug=clean WHERE id=auth.uid();
  RETURN clean;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_vanity_slug(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_vanity_slug(TEXT) TO authenticated;
