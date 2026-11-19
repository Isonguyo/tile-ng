
CREATE OR REPLACE FUNCTION public.admin_list_onboarding_accounts(
  _search text DEFAULT NULL,
  _account_type text DEFAULT 'all',
  _auth_status text DEFAULT 'all',
  _page integer DEFAULT 1,
  _per_page integer DEFAULT 50
)
RETURNS TABLE (
  user_id uuid,
  email text,
  email_confirmed_at timestamptz,
  full_name text,
  phone text,
  state text,
  lga text,
  account_type text,
  business_name text,
  shop_slug text,
  shop_status text,
  artisan_status text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_search text := NULLIF(BTRIM(COALESCE(_search, '')), '');
  v_account_type text := COALESCE(_account_type, 'all');
  v_auth_status text := COALESCE(_auth_status, 'all');
  v_page integer := GREATEST(COALESCE(_page, 1), 1);
  v_per_page integer := LEAST(GREATEST(COALESCE(_per_page, 50), 1), 100);
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF v_account_type NOT IN ('all', 'buyer', 'merchant', 'artisan') THEN
    RAISE EXCEPTION 'Invalid account type' USING ERRCODE = '22023';
  END IF;

  IF v_auth_status NOT IN ('all', 'verified', 'unverified') THEN
    RAISE EXCEPTION 'Invalid authentication status' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.email_confirmed_at,
    p.full_name,
    p.phone,
    p.state,
    p.lga,
    CASE
      WHEN p.is_merchant THEN 'merchant'
      WHEN p.is_artisan THEN 'artisan'
      ELSE p.account_type
    END::text,
    p.business_name,
    p.shop_slug,
    p.shop_status,
    p.artisan_status,
    p.created_at,
    COUNT(*) OVER()::bigint
  FROM auth.users AS u
  INNER JOIN public.profiles AS p ON p.id = u.id
  WHERE
    (
      v_account_type = 'all'
      OR (v_account_type = 'merchant' AND (p.is_merchant = true OR p.account_type = 'merchant'))
      OR (v_account_type = 'artisan' AND (p.is_artisan = true OR p.account_type = 'artisan'))
      OR (v_account_type = 'buyer' AND p.account_type = 'buyer' AND COALESCE(p.is_merchant, false) = false AND COALESCE(p.is_artisan, false) = false)
    )
    AND (
      v_auth_status = 'all'
      OR (v_auth_status = 'verified' AND u.email_confirmed_at IS NOT NULL)
      OR (v_auth_status = 'unverified' AND u.email_confirmed_at IS NULL)
    )
    AND (
      v_search IS NULL
      OR COALESCE(p.full_name, '') ILIKE '%' || v_search || '%'
      OR COALESCE(u.email, '') ILIKE '%' || v_search || '%'
      OR COALESCE(p.phone, '') ILIKE '%' || v_search || '%'
      OR COALESCE(p.business_name, '') ILIKE '%' || v_search || '%'
    )
  ORDER BY p.created_at DESC NULLS LAST, u.created_at DESC
  LIMIT v_per_page
  OFFSET ((v_page - 1) * v_per_page);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_onboarding_accounts(text, text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_onboarding_accounts(text, text, text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_onboarding_accounts(text, text, text, integer, integer) TO authenticated;
