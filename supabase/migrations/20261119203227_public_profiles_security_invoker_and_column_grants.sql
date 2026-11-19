-- SECURITY INVOKER public profile view with anonymous column-level grants.
DROP POLICY IF EXISTS "Public can view published profiles" ON public.profiles;
CREATE POLICY "Public can view published profiles"
ON public.profiles FOR SELECT TO anon
USING (
 public.is_marketplace_launched() AND is_prelaunch=false
 AND (
  (is_artisan IS TRUE AND artisan_status='approved')
  OR (is_merchant IS TRUE AND shop_slug IS NOT NULL AND shop_status='approved')
 )
);

REVOKE ALL ON TABLE public.profiles FROM anon;
GRANT SELECT (
 id,full_name,avatar_url,profile_photo,profession,state,lga,is_artisan,years_experience,
 bio,starting_price,business_name,is_verified,shop_slug,portfolio_images,created_at,
 is_merchant,shop_logo_url,shop_cover_url,shop_status
) ON TABLE public.profiles TO anon;

ALTER VIEW public.public_profiles SET (security_invoker=true);
