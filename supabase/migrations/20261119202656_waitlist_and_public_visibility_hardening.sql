-- Tile security hardening: public visibility and wait-list privacy.
-- Existing wait-list members receive keys through an administrator-verified recovery
-- process. New members receive a random access key once; only its hash is stored.

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS status_access_token_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_status_access_token_hash_uidx
  ON public.waitlist (status_access_token_hash)
  WHERE status_access_token_hash IS NOT NULL;

COMMENT ON COLUMN public.waitlist.status_access_token_hash IS
  'SHA-256 hash of the private wait-list status access key. Never expose this hash through a client-facing query.';

ALTER FUNCTION public.join_waitlist_with_profile(text,text,text,text,text,text,text,text)
  RENAME TO _join_waitlist_with_profile_legacy;

REVOKE ALL ON FUNCTION public._join_waitlist_with_profile_legacy(text,text,text,text,text,text,text,text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.join_waitlist_with_profile(
  _full_name text,
  _email text,
  _phone text DEFAULT NULL,
  _state text DEFAULT NULL,
  _city text DEFAULT NULL,
  _user_type text DEFAULT 'buyer',
  _referral_code text DEFAULT NULL,
  _source text DEFAULT 'wait-list'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _result jsonb;
  _status text;
  _waitlist_id uuid;
  _access_token text;
BEGIN
  _result := public._join_waitlist_with_profile_legacy(
    _full_name, _email, _phone, _state, _city, _user_type, _referral_code, _source
  );
  _status := _result->>'status';

  IF _status = 'joined' THEN
    _waitlist_id := NULLIF(_result->>'id', '')::uuid;
    IF _waitlist_id IS NULL THEN
      RAISE EXCEPTION 'Wait-list join did not return a member identifier';
    END IF;

    _access_token := encode(extensions.gen_random_bytes(32), 'hex');
    UPDATE public.waitlist
       SET status_access_token_hash =
             encode(extensions.digest(_access_token, 'sha256'), 'hex')
     WHERE id = _waitlist_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Wait-list member could not be secured';
    END IF;

    RETURN _result || jsonb_build_object('status_access_token', _access_token);
  END IF;

  IF _status IN ('found', 'exists') THEN
    RETURN jsonb_build_object(
      'status', 'exists',
      'already_member', true,
      'message',
        'An entry already exists for this email. Enter the private access key issued when you joined to retrieve member details.'
    );
  END IF;

  RETURN jsonb_build_object('status', COALESCE(_status, 'error'));
END;
$function$;

REVOKE ALL ON FUNCTION public.join_waitlist_with_profile(text,text,text,text,text,text,text,text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_waitlist_with_profile(text,text,text,text,text,text,text,text)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_waitlist_status(_email text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object('status', 'access_key_required');
$function$;

REVOKE ALL ON FUNCTION public.get_my_waitlist_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_waitlist_status(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_waitlist_status(
  _email text,
  _access_token text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _row public.waitlist;
  _clean_email text := lower(trim(COALESCE(_email, '')));
  _token_hash text;
BEGIN
  IF _clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     OR COALESCE(_access_token, '') !~ '^[a-fA-F0-9]{64}$' THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  _token_hash := encode(extensions.digest(lower(_access_token), 'sha256'), 'hex');

  SELECT *
    INTO _row
    FROM public.waitlist w
   WHERE lower(trim(w.email)) = _clean_email
     AND (
       w.status_access_token_hash = _token_hash
       OR (auth.uid() IS NOT NULL AND w.auth_user_id = auth.uid())
     )
   LIMIT 1;

  IF _row.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  RETURN jsonb_build_object(
    'status', 'found',
    'id', _row.id,
    'full_name', _row.full_name,
    'email', _row.email,
    'user_type', _row.user_type,
    'referral_token', _row.referral_token,
    'referrals_count', COALESCE(_row.referrals_count, 0),
    'queue_position', _row.queue_position,
    'reward', public.waitlist_reward_for_position(_row.queue_position),
    'account_created_at', _row.account_created_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_my_waitlist_status(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_waitlist_status(text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.link_my_waitlist_account()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object('status', 'access_key_required');
$function$;

REVOKE ALL ON FUNCTION public.link_my_waitlist_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_my_waitlist_account() TO authenticated;

CREATE OR REPLACE FUNCTION public.link_my_waitlist_account(
  _email text,
  _access_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _auth_email text;
  _clean_email text := lower(trim(COALESCE(_email, '')));
  _row public.waitlist;
  _token_hash text;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('status', 'not_authenticated');
  END IF;

  SELECT lower(email)
    INTO _auth_email
    FROM auth.users
   WHERE id = _uid;

  IF _auth_email IS NULL OR _auth_email <> _clean_email THEN
    RETURN jsonb_build_object('status', 'invalid_access');
  END IF;

  IF COALESCE(_access_token, '') !~ '^[a-fA-F0-9]{64}$' THEN
    RETURN jsonb_build_object('status', 'invalid_access');
  END IF;

  _token_hash := encode(extensions.digest(lower(_access_token), 'sha256'), 'hex');

  UPDATE public.waitlist
     SET auth_user_id = _uid,
         account_created_at = COALESCE(account_created_at, now())
   WHERE lower(trim(email)) = _clean_email
     AND status_access_token_hash = _token_hash
     AND (auth_user_id IS NULL OR auth_user_id = _uid)
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid_access');
  END IF;

  RETURN jsonb_build_object(
    'status', 'linked',
    'queue_position', _row.queue_position,
    'reward', public.waitlist_reward_for_position(_row.queue_position)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.link_my_waitlist_account(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_my_waitlist_account(text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_issue_waitlist_access_key(_waitlist_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _token text;
  _row public.waitlist;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  _token := encode(extensions.gen_random_bytes(32), 'hex');

  UPDATE public.waitlist
     SET status_access_token_hash = encode(extensions.digest(_token, 'sha256'), 'hex')
   WHERE id = _waitlist_id
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Wait-list member not found';
  END IF;

  PERFORM public.log_admin_action(
    'issue_waitlist_access_key',
    'waitlist',
    _row.id,
    jsonb_build_object('access_key_reissued', true)
  );

  RETURN jsonb_build_object(
    'status', 'issued',
    'email', _row.email,
    'full_name', _row.full_name,
    'status_access_token', _token
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_issue_waitlist_access_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_issue_waitlist_access_key(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.featured_vendors(_limit integer DEFAULT 12)
RETURNS TABLE(id uuid, display_name text, shop_slug text, tier text, trust_score integer, live_ads integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    COALESCE(p.business_name, p.full_name),
    p.shop_slug,
    public.effective_tier(p.subscription_tier, p.subscription_until)::text,
    public.seller_trust_score(p.id),
    a.n
  FROM public.profiles p
  JOIN LATERAL (
    SELECT COUNT(*)::int AS n
    FROM public.listings l
    WHERE l.user_id = p.id
      AND l.type = 'goods'
      AND l.status = 'approved'
      AND l.is_prelaunch = false
      AND l.expires_at > now()
  ) a ON a.n > 0
  WHERE public.is_marketplace_launched()
    AND p.is_merchant IS TRUE
    AND p.shop_slug IS NOT NULL
    AND p.shop_status = 'approved'
    AND p.is_prelaunch = false
    AND public.effective_tier_rank(p.subscription_tier, p.subscription_until) >= 2
  ORDER BY
    public.effective_tier_rank(p.subscription_tier, p.subscription_until) DESC,
    md5(p.id::text || to_char(now(), 'YYYYMMDDHH24'))
  LIMIT LEAST(GREATEST(COALESCE(_limit, 12), 1), 48);
$function$;

CREATE OR REPLACE FUNCTION public.top_vendors(_limit integer DEFAULT 8)
RETURNS TABLE(
  id uuid, full_name text, business_name text, shop_slug text, avatar_url text,
  subscription_tier public.sub_tier, is_verified boolean, active_listings bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.full_name,
    p.business_name,
    p.shop_slug,
    p.avatar_url,
    p.subscription_tier,
    p.is_verified,
    (
      SELECT count(*)
      FROM public.listings l
      WHERE l.user_id = p.id
        AND l.type = 'goods'
        AND l.status = 'approved'
        AND l.is_prelaunch = false
        AND l.expires_at > now()
    ) AS active_listings
  FROM public.profiles p
  WHERE public.is_marketplace_launched()
    AND p.is_merchant IS TRUE
    AND p.shop_slug IS NOT NULL
    AND p.shop_status = 'approved'
    AND p.is_prelaunch = false
    AND p.is_verified = true
    AND EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.user_id = p.id
        AND l.type = 'goods'
        AND l.status = 'approved'
        AND l.is_prelaunch = false
        AND l.expires_at > now()
    )
  ORDER BY
    (
      SELECT count(*)
      FROM public.listings l
      WHERE l.user_id = p.id
        AND l.type = 'goods'
        AND l.status = 'approved'
        AND l.is_prelaunch = false
        AND l.expires_at > now()
    ) DESC,
    CASE p.subscription_tier
      WHEN 'vip' THEN 0 WHEN 'pro' THEN 1 WHEN 'lite' THEN 2 ELSE 3
    END
  LIMIT LEAST(GREATEST(COALESCE(_limit, 8), 1), 48);
$function$;

CREATE OR REPLACE FUNCTION public.search_artisans(
  _q text DEFAULT NULL,
  _state text DEFAULT NULL,
  _lga text DEFAULT NULL,
  _verified_only boolean DEFAULT false
)
RETURNS TABLE(
  id uuid, full_name text, profession text, state text, lga text, bio text,
  avatar_url text, profile_photo text, is_verified boolean, subscription_tier public.sub_tier,
  tier_rank integer, trust_score integer, years_experience integer, starting_price numeric,
  avg_rating numeric, review_count integer, is_available boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT p.*, public.effective_tier_rank(p.subscription_tier, p.subscription_until) AS tr
    FROM public.profiles p
    WHERE public.is_marketplace_launched()
      AND p.is_prelaunch = false
      AND p.is_artisan = true
      AND p.artisan_status = 'approved'
      AND (
        NULLIF(trim(COALESCE(_q, '')), '') IS NULL
        OR p.profession ILIKE '%' || trim(_q) || '%'
        OR p.full_name ILIKE '%' || trim(_q) || '%'
        OR p.bio ILIKE '%' || trim(_q) || '%'
      )
      AND (NULLIF(_state, '') IS NULL OR _state = 'all' OR p.state = _state)
      AND (NULLIF(_lga, '') IS NULL OR _lga = 'all' OR p.lga = _lga)
      AND (NOT COALESCE(_verified_only, false) OR p.is_verified = true)
  )
  SELECT
    b.id, b.full_name, b.profession, b.state, b.lga, b.bio, b.avatar_url,
    b.profile_photo, b.is_verified,
    CASE WHEN b.tr = 0 THEN 'free'::public.sub_tier ELSE b.subscription_tier END,
    b.tr, public.artisan_trust_score(b.id), b.years_experience::int,
    b.starting_price::numeric, b.avg_rating::numeric, b.review_count::int,
    b.is_available
  FROM base b
  ORDER BY
    b.tr DESC,
    public.artisan_trust_score(b.id) DESC,
    b.avg_rating DESC NULLS LAST,
    b.full_name
  LIMIT 300;
$function$;

CREATE OR REPLACE FUNCTION public.artisan_contact(_id uuid)
RETURNS TABLE(phone text, whatsapp text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.phone, p.whatsapp
  FROM public.profiles p
  WHERE p.id = _id
    AND public.is_marketplace_launched()
    AND p.is_prelaunch = false
    AND p.is_artisan IS TRUE
    AND p.artisan_status = 'approved'
    AND auth.uid() IS NOT NULL;
$function$;

REVOKE ALL ON FUNCTION public.artisan_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.artisan_contact(uuid) TO authenticated;
