
-- 1) Fix admin invite code generator (gen_random_bytes requires pgcrypto, which isn't installed). Use gen_random_uuid instead.
CREATE OR REPLACE FUNCTION public.admin_generate_invite_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _code text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  _code := 'TILE-ADMIN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO public.admin_invite_codes(code, expires_at) VALUES (_code, now() + interval '30 minutes');
  RETURN _code;
END $function$;

-- 2) Fix chat trigger (column is "content", not "body"). This was silently breaking message inserts.
CREATE OR REPLACE FUNCTION public.notify_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE recipient UUID; chat_rec RECORD;
BEGIN
  SELECT * INTO chat_rec FROM public.chats WHERE id = NEW.chat_id;
  recipient := CASE WHEN NEW.sender_id = chat_rec.buyer_id THEN chat_rec.seller_id ELSE chat_rec.buyer_id END;
  INSERT INTO public.notifications(user_id, title, body, link)
  VALUES (recipient, 'New message', LEFT(NEW.content, 80), '/listing/' || chat_rec.listing_id);
  RETURN NEW;
END $function$;

-- 3) shop_reviews table — users rate a merchant's shop (not a listing)
CREATE TABLE IF NOT EXISTS public.shop_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_user_id, reviewer_id),
  CHECK (shop_user_id <> reviewer_id)
);

GRANT SELECT ON public.shop_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_reviews TO authenticated;
GRANT ALL ON public.shop_reviews TO service_role;

ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shop reviews" ON public.shop_reviews FOR SELECT USING (true);
CREATE POLICY "Auth users post reviews" ON public.shop_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id AND auth.uid() <> shop_user_id);
CREATE POLICY "Reviewer edits own" ON public.shop_reviews FOR UPDATE TO authenticated USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewer deletes own" ON public.shop_reviews FOR DELETE TO authenticated USING (auth.uid() = reviewer_id);

CREATE TRIGGER shop_reviews_touch BEFORE UPDATE ON public.shop_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Owner-only listing stats (views, clicks, saves)
CREATE OR REPLACE FUNCTION public.owner_listing_stats(_id uuid)
RETURNS TABLE(views_count int, clicks_count int, favorites_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.listings WHERE id = _id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not the listing owner';
  END IF;
  RETURN QUERY
    SELECT l.views_count, l.clicks_count,
      (SELECT count(*) FROM public.favorites f WHERE f.listing_id = _id)
    FROM public.listings l WHERE l.id = _id;
END $$;

-- 5) Storage policy: let admins read all listing images so they can moderate
DROP POLICY IF EXISTS "Admins read listings storage" ON storage.objects;
CREATE POLICY "Admins read listings storage" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'listings' AND public.has_role(auth.uid(), 'admin'));
