
DROP VIEW IF EXISTS public.public_profiles CASCADE;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  id, full_name, avatar_url, is_verified, location, created_at,
  business_name, shop_slug, subscription_tier, state, bio, phone, whatsapp
FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
