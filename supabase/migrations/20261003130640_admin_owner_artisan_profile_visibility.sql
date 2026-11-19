
CREATE OR REPLACE FUNCTION public.get_artisan_profile(_id uuid)
RETURNS TABLE (
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
  is_verified boolean,
  subscription_tier public.sub_tier,
  subscription_until timestamptz,
  starting_price numeric,
  is_available boolean,
  offers_home_service boolean,
  offers_emergency_service boolean,
  available_weekends boolean,
  profile_photo text,
  avatar_url text,
  portfolio_images text[],
  response_rate integer,
  response_minutes integer,
  avg_rating numeric,
  review_count integer,
  total_sales integer,
  artisan_status text,
  is_prelaunch boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _is_admin boolean := public.has_role(_uid, 'admin');
BEGIN
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
    p.is_verified,
    p.subscription_tier,
    p.subscription_until,
    p.starting_price,
    p.is_available,
    p.offers_home_service,
    p.offers_emergency_service,
    p.available_weekends,
    p.profile_photo,
    p.avatar_url,
    p.portfolio_images,
    p.response_rate,
    p.response_minutes,
    p.avg_rating,
    p.review_count,
    p.total_sales,
    p.artisan_status,
    p.is_prelaunch,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.id = _id
    AND p.is_artisan = true
    AND (
      -- The artisan can always view their own profile.
      _uid = p.id

      -- Admin can view any artisan profile, including pre-launch/pending/rejected.
      OR _is_admin

      -- Everyone else can only view approved, published profiles after launch.
      OR (
        public.is_marketplace_launched()
        AND p.artisan_status = 'approved'
        AND p.is_prelaunch = false
      )
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_artisan_profile(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_artisan_profile(uuid) TO authenticated;
