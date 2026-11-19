
REVOKE ALL ON FUNCTION public.merchant_owner_for_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merchant_owner_for_user(uuid) TO authenticated;
