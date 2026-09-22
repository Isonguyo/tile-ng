REVOKE SELECT ON public.artisan_profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, slug, full_name, profession, bio, state, lga,
  years_experience, is_verified, is_available, average_rating,
  total_reviews, profile_photo, created_at, updated_at
) ON public.artisan_profiles TO anon, authenticated;

GRANT SELECT ON public.artisan_profiles TO service_role;

CREATE OR REPLACE FUNCTION public.artisan_profile_contact(_artisan_id uuid)
RETURNS TABLE(phone text, whatsapp text, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.phone, a.whatsapp, a.email
  FROM public.artisan_profiles a
  WHERE a.id = _artisan_id AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.artisan_profile_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.artisan_profile_contact(uuid) TO authenticated;