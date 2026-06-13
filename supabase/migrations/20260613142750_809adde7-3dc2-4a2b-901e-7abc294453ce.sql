
-- Replace owner+admin SELECT policy with a public SELECT policy gated by column grants
DROP POLICY IF EXISTS "Owners and admins can view full profile" ON public.profiles;

CREATE POLICY "Profiles rows selectable"
  ON public.profiles FOR SELECT
  USING (true);

-- Column grants: only non-sensitive columns visible via direct table reads
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, is_verified, location, created_at)
  ON public.profiles TO anon, authenticated;

-- Recreate public view to use invoker permissions (no more SECURITY DEFINER view)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT id, full_name, avatar_url, is_verified, location, created_at
FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Owner reads own full profile (including phone, wallet_balance, kyc_*)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Admin reads pending KYC submissions
CREATE OR REPLACE FUNCTION public.admin_list_pending_kyc()
RETURNS SETOF public.profiles
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles WHERE kyc_status = 'pending';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_pending_kyc() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_kyc() TO authenticated;
