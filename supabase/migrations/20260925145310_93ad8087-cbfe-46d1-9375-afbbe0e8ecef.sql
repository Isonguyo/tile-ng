CREATE OR REPLACE FUNCTION public.artisan_trust_score(_uid uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE _p public.profiles; _s int;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE id = _uid;
  IF _p.id IS NULL THEN RETURN 0; END IF;
  _s := public.seller_trust_score(_uid);
  IF COALESCE(_p.profile_photo, _p.avatar_url) IS NOT NULL THEN _s := _s + 3; END IF;
  IF length(COALESCE(_p.bio,'')) >= 40 THEN _s := _s + 3; END IF;
  IF COALESCE(array_length(_p.portfolio_images,1),0) >= 3 THEN _s := _s + 4; END IF;
  IF COALESCE(_p.years_experience,0) >= 5 THEN _s := _s + 3; END IF;
  IF COALESCE(_p.review_count,0) >= 3 THEN
    IF _p.avg_rating >= 4.5 THEN _s := _s + 5; ELSIF _p.avg_rating < 3 THEN _s := _s - 10; END IF;
  END IF;
  RETURN GREATEST(0, LEAST(100, _s));
END $$;
GRANT EXECUTE ON FUNCTION public.artisan_trust_score(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_artisans(_q text DEFAULT NULL, _state text DEFAULT NULL, _lga text DEFAULT NULL, _verified_only boolean DEFAULT false)
RETURNS TABLE(id uuid, full_name text, profession text, state text, lga text, bio text, avatar_url text, profile_photo text,
  is_verified boolean, subscription_tier sub_tier, tier_rank int, trust_score int, years_experience int,
  starting_price numeric, avg_rating numeric, review_count int, is_available boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM (
    SELECT p.id, p.full_name, p.profession, p.state, p.lga, p.bio, p.avatar_url, p.profile_photo,
      p.is_verified,
      CASE WHEN public.effective_tier_rank(p.subscription_tier, p.subscription_until) = 0 THEN 'free'::sub_tier ELSE p.subscription_tier END AS subscription_tier,
      public.effective_tier_rank(p.subscription_tier, p.subscription_until) AS tier_rank,
      public.artisan_trust_score(p.id) AS trust_score,
      p.years_experience, p.starting_price, p.avg_rating, p.review_count, p.is_available
    FROM public.profiles p
    WHERE p.is_artisan = true
      AND (_q IS NULL OR _q = '' OR p.profession ILIKE '%'||_q||'%' OR p.full_name ILIKE '%'||_q||'%' OR p.bio ILIKE '%'||_q||'%')
      AND (_state IS NULL OR _state = '' OR p.state ILIKE '%'||_state||'%')
      AND (_lga IS NULL OR _lga = '' OR p.lga ILIKE '%'||_lga||'%')
      AND (NOT _verified_only OR p.is_verified)
  ) r
  ORDER BY r.tier_rank DESC, r.trust_score DESC, r.avg_rating DESC NULLS LAST, r.full_name
  LIMIT 300
$$;
GRANT EXECUTE ON FUNCTION public.search_artisans(text,text,text,boolean) TO anon, authenticated;