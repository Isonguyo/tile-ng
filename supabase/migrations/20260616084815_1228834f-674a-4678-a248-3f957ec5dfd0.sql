
-- 1. Fix compute_tier search_path
ALTER FUNCTION public.compute_tier(integer, integer, numeric, boolean, integer) SET search_path = public;

-- 2. Recreate public_profiles view: exclude phone/whatsapp, use security_invoker
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, is_verified, location, created_at,
       business_name, shop_slug, subscription_tier, state, bio
FROM public.profiles;

-- Allow anon+authenticated to read public shop rows from profiles, but only safe columns
DROP POLICY IF EXISTS "Public shops viewable" ON public.profiles;
CREATE POLICY "Public shops viewable"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (shop_slug IS NOT NULL);

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, avatar_url, is_verified, location, created_at,
              business_name, shop_slug, subscription_tier, state, bio)
  ON public.profiles TO anon;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Restrict listings.phone to authenticated viewers only via column grants
REVOKE SELECT ON public.listings FROM anon;
GRANT SELECT (id, user_id, type, title, description, category, location, price,
              images, status, is_promoted, condition, brand, years_experience,
              service_mode, created_at, updated_at, views_count, clicks_count,
              renewed_count, expires_at, rejection_reason)
  ON public.listings TO anon;

-- 4. Authenticated-only RPC to fetch shop contact details
CREATE OR REPLACE FUNCTION public.shop_contact(_slug text)
RETURNS TABLE(phone text, whatsapp text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  RETURN QUERY SELECT p.phone, p.whatsapp FROM public.profiles p
    WHERE p.shop_slug = _slug AND p.shop_slug IS NOT NULL;
END $$;

-- 5. Lock down EXECUTE on SECURITY DEFINER functions: deny by default, grant only what each role needs
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Functions safe for anon (public-facing, harmless or guarded internally)
GRANT EXECUTE ON FUNCTION public.track_listing_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_listing_click(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_tier(integer, integer, numeric, boolean, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gen_shop_slug(text) TO authenticated;

-- Authenticated-only functions
GRANT EXECUTE ON FUNCTION public.activate_subscription(sub_tier) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_flag_seller(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_invite_codes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_kyc() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_pending_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_listing(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_post_quota(listing_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_listing_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_admin_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.renew_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_vanity_slug(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.topup_wallet(numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shop_contact(text) TO authenticated;
