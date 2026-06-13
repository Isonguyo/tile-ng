
-- 1. PROFILES: lock down to owner/admin, expose public view
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Owners and admins can view full profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT id, full_name, avatar_url, is_verified, location, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. LISTINGS.phone: hide from anonymous viewers via column grant
REVOKE SELECT ON public.listings FROM anon;
GRANT SELECT (
  id, user_id, type, title, description, category, location, price,
  images, status, is_promoted, condition, brand, years_experience,
  service_mode, rejection_reason, created_at, updated_at
) ON public.listings TO anon;
-- authenticated keeps full SELECT (including phone)
GRANT SELECT ON public.listings TO authenticated;

-- 3. WALLET_TRANSACTIONS: remove direct insert; only SECURITY DEFINER fn may write
DROP POLICY IF EXISTS "Create own transactions" ON public.wallet_transactions;
REVOKE INSERT ON public.wallet_transactions FROM anon, authenticated;

-- 4. STORAGE policies: add missing UPDATE/DELETE for kyc, UPDATE for listings
CREATE POLICY "Users update own listing images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own kyc"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own kyc"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Restrict EXECUTE on internal helpers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
