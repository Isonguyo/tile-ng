
-- ============ WAITLIST ============
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  state text,
  city text,
  user_type text NOT NULL DEFAULT 'buyer',
  referral_code text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX waitlist_email_unique ON public.waitlist (lower(email));

GRANT SELECT ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view waitlist" ON public.waitlist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.waitlist_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.waitlist_events TO authenticated;
GRANT ALL ON public.waitlist_events TO service_role;
ALTER TABLE public.waitlist_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view waitlist events" ON public.waitlist_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.join_waitlist(
  _full_name text, _email text, _phone text DEFAULT NULL, _state text DEFAULT NULL,
  _city text DEFAULT NULL, _user_type text DEFAULT 'buyer', _referral_code text DEFAULT NULL,
  _source text DEFAULT 'wait-list'
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _clean_email text := lower(trim(_email));
BEGIN
  IF _clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RETURN 'invalid_email'; END IF;
  IF length(trim(coalesce(_full_name,''))) < 2 THEN RETURN 'invalid_name'; END IF;
  IF EXISTS (SELECT 1 FROM public.waitlist WHERE lower(email) = _clean_email) THEN RETURN 'exists'; END IF;
  INSERT INTO public.waitlist (full_name, email, phone, state, city, user_type, referral_code, source)
  VALUES (left(trim(_full_name), 120), _clean_email, left(nullif(trim(coalesce(_phone,'')),''), 30),
          left(nullif(trim(coalesce(_state,'')),''), 60), left(nullif(trim(coalesce(_city,'')),''), 60),
          CASE WHEN _user_type IN ('buyer','seller','artisan','all') THEN _user_type ELSE 'buyer' END,
          left(nullif(trim(coalesce(_referral_code,'')),''), 40), left(coalesce(_source,'wait-list'), 60));
  INSERT INTO public.waitlist_events (event_type) VALUES ('signup');
  RETURN 'joined';
EXCEPTION WHEN unique_violation THEN RETURN 'exists';
END $$;
REVOKE ALL ON FUNCTION public.join_waitlist(text,text,text,text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.join_waitlist(text,text,text,text,text,text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.waitlist_count() RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*) FROM public.waitlist $$;
REVOKE ALL ON FUNCTION public.waitlist_count() FROM public;
GRANT EXECUTE ON FUNCTION public.waitlist_count() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_waitlist_event(_event_type text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _event_type IN ('visit','join_click') THEN
    INSERT INTO public.waitlist_events (event_type) VALUES (_event_type);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.track_waitlist_event(text) FROM public;
GRANT EXECUTE ON FUNCTION public.track_waitlist_event(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_waitlist_stats()
RETURNS TABLE(total bigint, buyers bigint, sellers bigint, artisans bigint, all_types bigint,
              today bigint, week bigint, visits bigint, join_clicks bigint, signups bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM waitlist),
    (SELECT count(*) FROM waitlist WHERE user_type='buyer'),
    (SELECT count(*) FROM waitlist WHERE user_type='seller'),
    (SELECT count(*) FROM waitlist WHERE user_type='artisan'),
    (SELECT count(*) FROM waitlist WHERE user_type='all'),
    (SELECT count(*) FROM waitlist WHERE created_at >= date_trunc('day', now())),
    (SELECT count(*) FROM waitlist WHERE created_at >= now() - interval '7 days'),
    (SELECT count(*) FROM waitlist_events WHERE event_type='visit'),
    (SELECT count(*) FROM waitlist_events WHERE event_type='join_click'),
    (SELECT count(*) FROM waitlist_events WHERE event_type='signup')
  WHERE has_role(auth.uid(), 'admin') $$;
REVOKE ALL ON FUNCTION public.admin_waitlist_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_waitlist_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_waitlist_growth(_days integer DEFAULT 30)
RETURNS TABLE(day date, signups bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT created_at::date AS day, count(*) FROM waitlist
  WHERE has_role(auth.uid(), 'admin') AND created_at >= now() - (_days || ' days')::interval
  GROUP BY 1 ORDER BY 1 $$;
REVOKE ALL ON FUNCTION public.admin_waitlist_growth(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_waitlist_growth(integer) TO authenticated;

-- ============ SECURITY FIXES ============
GRANT SELECT ON public.promotion_plans TO anon, authenticated;
GRANT ALL ON public.promotion_plans TO service_role;
ALTER TABLE public.promotion_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active plans are viewable" ON public.promotion_plans FOR SELECT TO anon, authenticated
  USING (is_active IS TRUE);

GRANT SELECT, INSERT ON public.promotion_purchases TO authenticated;
GRANT ALL ON public.promotion_purchases TO service_role;
ALTER TABLE public.promotion_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins can view purchases" ON public.promotion_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can create purchases" ON public.promotion_purchases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Column-level restriction on profiles: hide sensitive columns from anon/authenticated
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, full_name, avatar_url, location, is_verified, created_at, updated_at,
  business_name, state, lga, bio, portfolio_url, is_merchant, shop_slug,
  subscription_tier, subscription_until, total_sales, avg_rating, response_minutes,
  portfolio_images, profession, years_experience, starting_price, is_available,
  offers_home_service, offers_emergency_service, available_weekends, profile_photo,
  response_rate, is_artisan, service_radius, travels_outside_lga, account_type,
  promotion_credits, review_count
) ON public.profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.artisan_contact(_id uuid)
RETURNS TABLE(phone text, whatsapp text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.phone, p.whatsapp FROM profiles p WHERE p.id = _id AND p.is_artisan IS TRUE
  AND auth.uid() IS NOT NULL $$;
REVOKE ALL ON FUNCTION public.artisan_contact(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.artisan_contact(uuid) TO authenticated;
