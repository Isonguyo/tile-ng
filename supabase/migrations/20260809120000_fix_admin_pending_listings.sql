-- Make the admin pending-listings RPC reliably return rows for moderation.
-- This avoids depending on the client-side listing select path and is safe to re-run.

CREATE OR REPLACE FUNCTION public.admin_pending_listings()
RETURNS TABLE(
  id UUID,
  title TEXT,
  price NUMERIC,
  category TEXT,
  type public.listing_type,
  images TEXT[],
  created_at TIMESTAMPTZ,
  seller_id UUID,
  seller_name TEXT,
  seller_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.price,
    l.category,
    l.type,
    l.images,
    l.created_at,
    p.id,
    p.full_name,
    p.phone
  FROM public.listings l
  LEFT JOIN public.profiles p ON p.id = l.user_id
  WHERE l.status = 'pending'
  ORDER BY l.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_pending_listings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pending_listings() TO authenticated;
