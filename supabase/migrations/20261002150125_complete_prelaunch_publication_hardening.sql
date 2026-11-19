
-- Initialize the single platform settings row expected by launch controls.
INSERT INTO public.platform_settings (
  id,
  maintenance_mode,
  disable_registration,
  disable_posting,
  disable_payments,
  disable_withdrawals,
  disable_messaging,
  emergency_banner,
  launch_mode
)
VALUES (
  1,
  false,
  false,
  false,
  false,
  false,
  false,
  NULL,
  'prelaunch'
)
ON CONFLICT (id) DO NOTHING;

-- Prevent non-admin users from changing listing moderation/publication state.
CREATE OR REPLACE FUNCTION public.prevent_listing_moderation_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.is_promoted IS DISTINCT FROM OLD.is_promoted
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.is_prelaunch IS DISTINCT FROM OLD.is_prelaunch THEN
    RAISE EXCEPTION 'Not allowed to modify moderation or publication fields';
  END IF;

  RETURN NEW;
END;
$function$;

-- Protect artisan moderation fields while still allowing a user to submit/resubmit
-- their own artisan profile. Admin RPCs bypass this guard.
CREATE OR REPLACE FUNCTION public.tile_guard_profile_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND TG_OP = 'UPDATE' THEN
    IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
       OR NEW.subscription_until IS DISTINCT FROM OLD.subscription_until
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Subscription and verification fields can only be changed by Tile';
    END IF;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- A user may submit a new artisan profile, but Tile controls its moderation state.
  IF auth.uid() = NEW.id THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.is_artisan = true THEN
        NEW.artisan_status := 'pending';
        NEW.is_prelaunch := true;
      END IF;

    ELSE
      -- First submission: false -> true becomes pending/private.
      IF OLD.is_artisan = false AND NEW.is_artisan = true THEN
        NEW.artisan_status := 'pending';
        NEW.is_prelaunch := true;

      -- Rejected artisans can resubmit by saving their profile.
      ELSIF OLD.is_artisan = true
        AND OLD.artisan_status = 'rejected'
        AND NEW.is_artisan = true
        AND NEW.artisan_status IS NOT DISTINCT FROM OLD.artisan_status
        AND NEW.is_prelaunch IS NOT DISTINCT FROM OLD.is_prelaunch THEN
        NEW.artisan_status := 'pending';
        NEW.is_prelaunch := true;

      -- Existing moderation/publication state cannot be self-changed.
      ELSIF NEW.artisan_status IS DISTINCT FROM OLD.artisan_status
         OR NEW.is_prelaunch IS DISTINCT FROM OLD.is_prelaunch THEN
        RAISE EXCEPTION 'Artisan moderation and publication fields can only be changed by Tile';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.shop_slug IS NOT NULL
     AND NEW.shop_slug IS DISTINCT FROM OLD.shop_slug
     AND auth.uid() = NEW.id
     AND public.effective_tier_rank(NEW.subscription_tier, NEW.subscription_until) = 0 THEN
    RAISE EXCEPTION 'A custom shop URL requires an active Lite, Pro or VIP plan';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_tile_guard_profile_write ON public.profiles;
CREATE TRIGGER trg_tile_guard_profile_write
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.tile_guard_profile_write();

-- Rejected content must never remain staged.
CREATE OR REPLACE FUNCTION public.admin_reject_listing(_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _uid uuid;
  _title text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.listings
  SET
    status = 'rejected',
    is_prelaunch = false,
    rejection_reason = NULLIF(trim(_reason), ''),
    updated_at = now()
  WHERE id = _id
  RETURNING user_id, title INTO _uid, _title;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  INSERT INTO public.notifications(user_id, title, body, link)
  VALUES (
    _uid,
    'Listing rejected',
    _title || ': ' || COALESCE(NULLIF(trim(_reason), ''), 'No reason given'),
    '/dashboard'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_reject_artisan(_user_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
  SET
    artisan_status = 'rejected',
    is_prelaunch = false,
    updated_at = now()
  WHERE id = _user_id
    AND is_artisan = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Artisan profile not found';
  END IF;

  INSERT INTO public.notifications(user_id, title, body, link)
  VALUES (
    _user_id,
    'Artisan profile review',
    'Your artisan profile needs changes before it can be approved. ' ||
      COALESCE(NULLIF(trim(_reason), ''), 'Please review your profile details.'),
    '/dashboard'
  );

  PERFORM public.log_admin_action(
    'reject_artisan',
    'artisan_profile',
    _user_id,
    jsonb_build_object('reason', _reason)
  );
END;
$function$;

-- Robust launch switch: creates the settings row when necessary and publishes
-- approved staged listings and artisans when launch_mode becomes 'launched'.
CREATE OR REPLACE FUNCTION public.admin_set_launch_mode(_launch_mode text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _listing_count integer := 0;
  _artisan_count integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _launch_mode NOT IN ('prelaunch', 'launched') THEN
    RAISE EXCEPTION 'Invalid launch mode';
  END IF;

  IF _launch_mode = 'launched' THEN
    UPDATE public.listings
    SET
      is_prelaunch = false,
      updated_at = now()
    WHERE status = 'approved'
      AND is_prelaunch = true;

    GET DIAGNOSTICS _listing_count = ROW_COUNT;

    UPDATE public.profiles
    SET
      is_prelaunch = false,
      updated_at = now()
    WHERE is_artisan = true
      AND artisan_status = 'approved'
      AND is_prelaunch = true;

    GET DIAGNOSTICS _artisan_count = ROW_COUNT;
  END IF;

  INSERT INTO public.platform_settings (
    id,
    maintenance_mode,
    disable_registration,
    disable_posting,
    disable_payments,
    disable_withdrawals,
    disable_messaging,
    launch_mode,
    updated_at,
    updated_by
  )
  VALUES (
    1,
    false,
    false,
    false,
    false,
    false,
    false,
    _launch_mode,
    now(),
    auth.uid()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    launch_mode = EXCLUDED.launch_mode,
    updated_at = now(),
    updated_by = auth.uid();

  PERFORM public.log_admin_action(
    'set_launch_mode',
    'platform',
    NULL,
    jsonb_build_object(
      'launch_mode', _launch_mode,
      'published_listings', _listing_count,
      'published_artisans', _artisan_count
    )
  );
END;
$function$;

-- Admin-only query for approved artisan profiles waiting for launch.
CREATE OR REPLACE FUNCTION public.admin_list_prelaunch_artisans()
RETURNS TABLE(
  id uuid,
  full_name text,
  profession text,
  bio text,
  phone text,
  whatsapp text,
  email text,
  state text,
  lga text,
  years_experience integer,
  profile_photo text,
  is_available boolean,
  is_prelaunch boolean,
  artisan_status text,
  created_at timestamptz,
  user_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.profession,
    p.bio,
    p.phone,
    p.whatsapp,
    u.email::text,
    p.state,
    p.lga,
    p.years_experience,
    p.profile_photo,
    p.is_available,
    p.is_prelaunch,
    p.artisan_status,
    p.created_at,
    p.id AS user_id
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.is_artisan = true
    AND p.artisan_status = 'approved'
    AND p.is_prelaunch = true
  ORDER BY p.created_at ASC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_list_prelaunch_artisans() TO authenticated;

-- Defense-in-depth: direct public table reads require an actual marketplace launch.
DROP POLICY IF EXISTS "Approved public listings viewable by all" ON public.listings;
CREATE POLICY "Approved public listings viewable by all"
ON public.listings
FOR SELECT
USING (
  (
    public.is_marketplace_launched()
    AND status = 'approved'
    AND is_prelaunch = false
    AND expires_at > now()
  )
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Public profiles viewable after launch" ON public.profiles;
CREATE POLICY "Public profiles viewable after launch"
ON public.profiles
FOR SELECT
USING (
  (
    public.is_marketplace_launched()
    AND is_prelaunch = false
    AND (shop_slug IS NOT NULL OR is_artisan = true)
  )
  OR auth.uid() = id
  OR public.is_staff(auth.uid())
);
