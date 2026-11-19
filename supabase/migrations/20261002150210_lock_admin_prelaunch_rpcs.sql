
REVOKE ALL ON FUNCTION public.admin_list_prelaunch_listings() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_prelaunch_listings() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_list_prelaunch_artisans() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_prelaunch_artisans() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_launch_mode(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_launch_mode(text) TO authenticated;
