
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  avatar_url,
  profile_photo,
  profession,
  state,
  lga,
  is_artisan,
  years_experience,
  bio,
  starting_price,
  business_name,
  is_verified,
  shop_slug,
  portfolio_images,
  created_at,
  is_merchant,
  shop_logo_url,
  shop_cover_url,
  shop_status
FROM public.profiles
WHERE
  (is_artisan = true OR (is_merchant = true AND shop_slug IS NOT NULL))
  AND (
    (
      public.is_marketplace_launched()
      AND is_prelaunch = false
      AND (
        (is_artisan = true AND artisan_status = 'approved')
        OR (is_merchant = true AND shop_slug IS NOT NULL AND shop_status = 'approved')
      )
    )
    OR auth.uid() = id
    OR public.has_role(auth.uid(), 'admin')
  );

NOTIFY pgrst, 'reload schema';
