
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shop_submitted_at timestamptz;

UPDATE public.profiles
SET shop_submitted_at = COALESCE(shop_submitted_at, updated_at, created_at, now())
WHERE is_merchant = true
  AND shop_slug IS NOT NULL
  AND shop_status IN ('pending','flagged');

CREATE INDEX IF NOT EXISTS profiles_shop_review_queue_order_idx
  ON public.profiles (shop_status, shop_submitted_at DESC)
  WHERE is_merchant = true AND shop_slug IS NOT NULL;

CREATE OR REPLACE FUNCTION private.guard_shop_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean := public.has_role(auth.uid(), 'admin');
  _rpc_override boolean := COALESCE(current_setting('tile.shop_moderation_rpc', true), '') = 'on';
  _shop_details_changed boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT _is_admin THEN
      NEW.shop_status := 'draft';
      NEW.shop_rejection_reason := NULL;
      NEW.shop_reviewed_at := NULL;
      NEW.shop_reviewed_by := NULL;
      NEW.shop_submitted_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF _is_admin OR _rpc_override THEN
    RETURN NEW;
  END IF;

  IF NEW.shop_status IS DISTINCT FROM OLD.shop_status
     OR NEW.shop_rejection_reason IS DISTINCT FROM OLD.shop_rejection_reason
     OR NEW.shop_reviewed_at IS DISTINCT FROM OLD.shop_reviewed_at
     OR NEW.shop_reviewed_by IS DISTINCT FROM OLD.shop_reviewed_by
     OR NEW.shop_submitted_at IS DISTINCT FROM OLD.shop_submitted_at THEN
    RAISE EXCEPTION 'Shop moderation fields can only be changed through Tile review actions';
  END IF;

  _shop_details_changed :=
       NEW.business_name IS DISTINCT FROM OLD.business_name
    OR NEW.shop_slug IS DISTINCT FROM OLD.shop_slug
    OR NEW.bio IS DISTINCT FROM OLD.bio
    OR NEW.state IS DISTINCT FROM OLD.state
    OR NEW.lga IS DISTINCT FROM OLD.lga
    OR NEW.shop_logo_url IS DISTINCT FROM OLD.shop_logo_url
    OR NEW.shop_cover_url IS DISTINCT FROM OLD.shop_cover_url;

  IF OLD.shop_status = 'approved' AND _shop_details_changed THEN
    NEW.shop_status := 'pending';
    NEW.shop_rejection_reason := NULL;
    NEW.shop_reviewed_at := NULL;
    NEW.shop_reviewed_by := NULL;
    NEW.shop_submitted_at := now();
  ELSIF OLD.shop_status = 'rejected' AND _shop_details_changed THEN
    NEW.shop_status := 'pending';
    NEW.shop_rejection_reason := NULL;
    NEW.shop_reviewed_at := NULL;
    NEW.shop_reviewed_by := NULL;
    NEW.shop_submitted_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_shop_for_review()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to submit your shop';
  END IF;

  SELECT * INTO _profile
  FROM public.profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF NULLIF(trim(_profile.business_name), '') IS NULL THEN
    RAISE EXCEPTION 'Add your business name before submitting your shop';
  END IF;

  IF NULLIF(trim(_profile.shop_slug), '') IS NULL THEN
    RAISE EXCEPTION 'Choose your shop URL before submitting your shop';
  END IF;

  IF _profile.shop_status = 'approved' THEN
    RAISE EXCEPTION 'Your shop is already approved';
  END IF;

  PERFORM set_config('tile.shop_moderation_rpc', 'on', true);

  UPDATE public.profiles
  SET is_merchant = true,
      account_type = CASE WHEN account_type = 'buyer' THEN 'merchant' ELSE account_type END,
      shop_status = 'pending',
      shop_rejection_reason = NULL,
      shop_reviewed_at = NULL,
      shop_reviewed_by = NULL,
      shop_submitted_at = now()
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_shop_reviews(_status text DEFAULT 'pending')
RETURNS TABLE (
  user_id uuid,
  full_name text,
  business_name text,
  shop_slug text,
  bio text,
  state text,
  lga text,
  shop_logo_url text,
  shop_cover_url text,
  shop_status text,
  shop_rejection_reason text,
  shop_submitted_at timestamptz,
  shop_reviewed_at timestamptz,
  product_count bigint,
  pending_product_count bigint,
  approved_product_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _status IS NOT NULL AND _status NOT IN ('all','pending','approved','rejected','flagged','draft') THEN
    RAISE EXCEPTION 'Invalid shop review status';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.business_name,
    p.shop_slug,
    p.bio,
    p.state,
    p.lga,
    p.shop_logo_url,
    p.shop_cover_url,
    p.shop_status,
    p.shop_rejection_reason,
    p.shop_submitted_at,
    p.shop_reviewed_at,
    count(l.id)::bigint,
    count(l.id) FILTER (WHERE l.status = 'pending')::bigint,
    count(l.id) FILTER (WHERE l.status = 'approved')::bigint
  FROM public.profiles p
  LEFT JOIN public.listings l
    ON l.user_id = p.id
   AND l.type = 'goods'
  WHERE p.is_merchant = true
    AND p.shop_slug IS NOT NULL
    AND (_status IS NULL OR _status = 'all' OR p.shop_status = _status)
  GROUP BY p.id
  ORDER BY
    CASE WHEN p.shop_status = 'pending' THEN 0 ELSE 1 END,
    p.shop_submitted_at DESC NULLS LAST,
    p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_shop_reviews(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_shop_reviews(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
