
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.admin_invite_codes
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes');

-- Track view (anyone)
CREATE OR REPLACE FUNCTION public.track_listing_view(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.listings SET views_count = views_count + 1 WHERE id = _id AND status = 'approved';
$$;

CREATE OR REPLACE FUNCTION public.track_listing_click(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.listings SET clicks_count = clicks_count + 1 WHERE id = _id AND status = 'approved';
$$;

REVOKE EXECUTE ON FUNCTION public.track_listing_view(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.track_listing_click(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_listing_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_listing_click(uuid) TO anon, authenticated;

-- Update redeem to enforce expiry
CREATE OR REPLACE FUNCTION public.redeem_admin_code(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row_count INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.admin_invite_codes
    SET used_by = auth.uid(), used_at = now()
    WHERE code = _code AND used_by IS NULL AND expires_at > now();
  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count = 0 THEN RETURN FALSE; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN TRUE;
END $$;

-- Admin generator
CREATE OR REPLACE FUNCTION public.admin_generate_invite_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _code text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  _code := 'TILE-ADMIN-' || upper(substr(encode(gen_random_bytes(6),'hex'), 1, 8));
  INSERT INTO public.admin_invite_codes(code, expires_at) VALUES (_code, now() + interval '30 minutes');
  RETURN _code;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_generate_invite_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_generate_invite_code() TO authenticated;

-- Admin user inspector
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(id uuid, full_name text, email text, subscription_tier sub_tier, kyc_status kyc_status, is_verified boolean, active_ads bigint, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, u.email::text, p.subscription_tier, p.kyc_status, p.is_verified,
      (SELECT count(*) FROM public.listings l WHERE l.user_id = p.id AND l.status = 'approved'),
      p.created_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Admin invite code archive
CREATE OR REPLACE FUNCTION public.admin_list_invite_codes()
RETURNS TABLE(code text, created_at timestamptz, expires_at timestamptz, used_by uuid, used_at timestamptz, status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT c.code, c.created_at, c.expires_at, c.used_by, c.used_at,
      CASE
        WHEN c.used_by IS NOT NULL THEN 'used'
        WHEN c.expires_at <= now() THEN 'expired'
        ELSE 'active'
      END
    FROM public.admin_invite_codes c
    ORDER BY c.created_at DESC;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_invite_codes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_invite_codes() TO authenticated;
