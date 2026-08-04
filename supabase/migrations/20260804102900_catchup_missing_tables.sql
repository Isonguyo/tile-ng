-- Catch-up migration: creates the 11 tables that exist in the live database
-- but were never defined in supabase/migrations. Fully idempotent so it is a
-- no-op against the live project and rebuilds correctly from scratch.

-- ============================ LOCATIONS ============================
CREATE TABLE IF NOT EXISTS public.states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lgas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state_id uuid REFERENCES public.states(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id uuid REFERENCES public.states(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.states TO anon, authenticated;
GRANT SELECT ON public.lgas   TO anon, authenticated;
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.states, public.lgas, public.cities TO service_role;

ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "states public read" ON public.states;
CREATE POLICY "states public read" ON public.states FOR SELECT USING (true);
DROP POLICY IF EXISTS "lgas public read" ON public.lgas;
CREATE POLICY "lgas public read" ON public.lgas FOR SELECT USING (true);
DROP POLICY IF EXISTS "cities public read" ON public.cities;
CREATE POLICY "cities public read" ON public.cities FOR SELECT USING (true);

-- ============================ ARTISANS ============================
CREATE TABLE IF NOT EXISTS public.artisan_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text UNIQUE,
  full_name text NOT NULL,
  profession text NOT NULL,
  bio text,
  phone text,
  whatsapp text,
  email text,
  state text,
  lga text,
  years_experience integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_available boolean DEFAULT true,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  profile_photo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artisan_slug       ON public.artisan_profiles (slug);
CREATE INDEX IF NOT EXISTS idx_artisan_profession ON public.artisan_profiles (profession);
CREATE INDEX IF NOT EXISTS idx_artisan_state      ON public.artisan_profiles (state);
CREATE INDEX IF NOT EXISTS idx_artisan_lga        ON public.artisan_profiles (lga);

-- Contact columns (phone/whatsapp/email) are deliberately withheld from anon:
-- public visitors get safe columns only, signed-in users use artisan_contact().
GRANT SELECT (id, user_id, slug, full_name, profession, bio, state, lga,
              years_experience, is_verified, is_available, average_rating,
              total_reviews, profile_photo, created_at, updated_at)
  ON public.artisan_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artisan_profiles TO authenticated;
GRANT ALL ON public.artisan_profiles TO service_role;

ALTER TABLE public.artisan_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view artisans" ON public.artisan_profiles;
CREATE POLICY "Anyone can view artisans" ON public.artisan_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own artisan profile" ON public.artisan_profiles;
CREATE POLICY "Users manage own artisan profile" ON public.artisan_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.artisan_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES public.artisan_profiles(id) ON DELETE CASCADE,
  skill text NOT NULL
);
GRANT SELECT ON public.artisan_skills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artisan_skills TO authenticated;
GRANT ALL ON public.artisan_skills TO service_role;
ALTER TABLE public.artisan_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view artisan skills" ON public.artisan_skills;
CREATE POLICY "Anyone can view artisan skills" ON public.artisan_skills FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner manages artisan skills" ON public.artisan_skills;
CREATE POLICY "Owner manages artisan skills" ON public.artisan_skills FOR ALL
  USING (EXISTS (SELECT 1 FROM public.artisan_profiles ap
                 WHERE ap.id = artisan_skills.artisan_id AND ap.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.artisan_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES public.artisan_profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.artisan_portfolio TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artisan_portfolio TO authenticated;
GRANT ALL ON public.artisan_portfolio TO service_role;
ALTER TABLE public.artisan_portfolio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view artisan portfolio" ON public.artisan_portfolio;
CREATE POLICY "Anyone can view artisan portfolio" ON public.artisan_portfolio FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner manages artisan portfolio" ON public.artisan_portfolio;
CREATE POLICY "Owner manages artisan portfolio" ON public.artisan_portfolio FOR ALL
  USING (EXISTS (SELECT 1 FROM public.artisan_profiles ap
                 WHERE ap.id = artisan_portfolio.artisan_id AND ap.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.artisan_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES public.artisan_profiles(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.artisan_reviews TO anon;
GRANT SELECT, INSERT ON public.artisan_reviews TO authenticated;
GRANT ALL ON public.artisan_reviews TO service_role;
ALTER TABLE public.artisan_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view artisan reviews" ON public.artisan_reviews;
CREATE POLICY "Anyone can view artisan reviews" ON public.artisan_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can review artisans" ON public.artisan_reviews;
CREATE POLICY "Authenticated users can review artisans" ON public.artisan_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE TABLE IF NOT EXISTS public.artisan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['impression','profile_view','save','whatsapp','phone','share'])),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_artisan_events_artisan ON public.artisan_events (artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_events_type    ON public.artisan_events (event_type);
CREATE INDEX IF NOT EXISTS idx_artisan_events_created ON public.artisan_events (created_at);
GRANT SELECT, INSERT ON public.artisan_events TO anon, authenticated;
GRANT ALL ON public.artisan_events TO service_role;
ALTER TABLE public.artisan_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert artisan events" ON public.artisan_events;
CREATE POLICY "Anyone can insert artisan events" ON public.artisan_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Artisan owners can view analytics" ON public.artisan_events;
CREATE POLICY "Artisan owners can view analytics" ON public.artisan_events FOR SELECT USING (artisan_id = auth.uid());
DROP POLICY IF EXISTS "No update artisan events" ON public.artisan_events;
CREATE POLICY "No update artisan events" ON public.artisan_events FOR UPDATE USING (false);
DROP POLICY IF EXISTS "No delete artisan events" ON public.artisan_events;
CREATE POLICY "No delete artisan events" ON public.artisan_events FOR DELETE USING (false);

-- ========================= LISTING ANALYTICS =========================
CREATE TABLE IF NOT EXISTS public.listing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['impression','view','save','chat','whatsapp','phone','share'])),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listing_events_listing ON public.listing_events (listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_events_type    ON public.listing_events (event_type);
CREATE INDEX IF NOT EXISTS idx_listing_events_created ON public.listing_events (created_at);
GRANT SELECT, INSERT ON public.listing_events TO anon, authenticated;
GRANT ALL ON public.listing_events TO service_role;
ALTER TABLE public.listing_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert listing events" ON public.listing_events;
CREATE POLICY "Anyone can insert listing events" ON public.listing_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Listing owners can view analytics" ON public.listing_events;
CREATE POLICY "Listing owners can view analytics" ON public.listing_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_events.listing_id AND l.user_id = auth.uid()));
DROP POLICY IF EXISTS "No update listing events" ON public.listing_events;
CREATE POLICY "No update listing events" ON public.listing_events FOR UPDATE USING (false);
DROP POLICY IF EXISTS "No delete listing events" ON public.listing_events;
CREATE POLICY "No delete listing events" ON public.listing_events FOR DELETE USING (false);

-- ============================ PROMOTIONS ============================
CREATE TABLE IF NOT EXISTS public.promotion_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  promotion_type text NOT NULL,
  duration_days integer NOT NULL,
  price_ngn numeric NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.promotion_plans TO anon, authenticated;
GRANT ALL ON public.promotion_plans TO service_role;
ALTER TABLE public.promotion_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active plans are viewable" ON public.promotion_plans;
CREATE POLICY "Active plans are viewable" ON public.promotion_plans FOR SELECT
  TO anon, authenticated USING (is_active IS TRUE);

CREATE TABLE IF NOT EXISTS public.promotion_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  promotion_plan_id uuid NOT NULL REFERENCES public.promotion_plans(id),
  amount_paid numeric NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_reference text,
  purchased_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.promotion_purchases TO authenticated;
GRANT ALL ON public.promotion_purchases TO service_role;
ALTER TABLE public.promotion_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners and admins can view purchases" ON public.promotion_purchases;
CREATE POLICY "Owners and admins can view purchases" ON public.promotion_purchases FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Owners can create purchases" ON public.promotion_purchases;
CREATE POLICY "Owners can create purchases" ON public.promotion_purchases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
