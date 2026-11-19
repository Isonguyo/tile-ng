
CREATE OR REPLACE FUNCTION public.admin_list_prelaunch_listings()
RETURNS TABLE(
  id uuid,
  title text,
  price numeric,
  category text,
  created_at timestamptz,
  user_id uuid,
  is_prelaunch boolean,
  status text
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
    l.id,
    l.title,
    l.price,
    l.category,
    l.created_at,
    l.user_id,
    l.is_prelaunch,
    l.status::text
  FROM public.listings l
  WHERE l.status = 'approved'
    AND l.is_prelaunch = true
  ORDER BY l.created_at DESC
  LIMIT 200;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_list_prelaunch_listings() TO authenticated;

-- Approved staged content is never public, even if someone accidentally changes
-- only the launch mode through another path.
CREATE OR REPLACE FUNCTION public.is_marketplace_launched()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_settings
    WHERE id = 1
      AND launch_mode = 'launched'
  );
$function$;

GRANT EXECUTE ON FUNCTION public.is_marketplace_launched() TO anon, authenticated;
