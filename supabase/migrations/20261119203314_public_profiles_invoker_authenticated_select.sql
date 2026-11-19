-- Published profiles remain visible to signed-in buyers as well.
DROP POLICY IF EXISTS "Public can view published profiles" ON public.profiles;
CREATE POLICY "Public can view published profiles"
ON public.profiles FOR SELECT TO anon,authenticated
USING (
 public.is_marketplace_launched() AND is_prelaunch=false
 AND (
  (is_artisan IS TRUE AND artisan_status='approved')
  OR (is_merchant IS TRUE AND shop_slug IS NOT NULL AND shop_status='approved')
 )
);
