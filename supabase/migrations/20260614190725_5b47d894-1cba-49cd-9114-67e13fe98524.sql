
-- 1. Profiles: restrict SELECT to owner/admin; public reads go through public_profiles view
DROP POLICY IF EXISTS "Profiles rows selectable" ON public.profiles;
CREATE POLICY "Owner or admin can view profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 2. admin_invite_codes: explicit admin-only policies
CREATE POLICY "Admins manage invite codes"
  ON public.admin_invite_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Listings: prevent privilege escalation on moderation fields
DROP POLICY IF EXISTS "Users update own listings" ON public.listings;
CREATE POLICY "Users update own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.prevent_listing_moderation_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.is_promoted IS DISTINCT FROM OLD.is_promoted
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Not allowed to modify moderation fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_listing_moderation ON public.listings;
CREATE TRIGGER guard_listing_moderation
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_listing_moderation_escalation();

-- 4. Fix function search_path
CREATE OR REPLACE FUNCTION public.gen_shop_slug(_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE base TEXT; final TEXT; n INT := 0;
BEGIN
  base := regexp_replace(lower(coalesce(_name,'shop')), '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  IF base = '' THEN base := 'shop'; END IF;
  final := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE shop_slug = final) LOOP
    n := n + 1; final := base || '-' || n;
  END LOOP;
  RETURN final;
END $function$;

-- 5. Revoke EXECUTE on SECURITY DEFINER funcs from anon (keep authenticated)
REVOKE EXECUTE ON FUNCTION public.topup_wallet(numeric, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_list_pending_kyc() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_notifications_read() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_admin_code(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.activate_subscription(sub_tier) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.topup_wallet(numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_kyc() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_admin_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_subscription(sub_tier) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
