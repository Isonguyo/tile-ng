-- ============ WAITLIST REFERRAL ENGINE ============
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS referral_token text,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.waitlist(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referrals_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS queue_position bigint;

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_referral_token_unique
  ON public.waitlist (lower(referral_token)) WHERE referral_token IS NOT NULL;

CREATE SEQUENCE IF NOT EXISTS public.waitlist_queue_position_seq;
ALTER TABLE public.waitlist
  ALTER COLUMN queue_position SET DEFAULT nextval('public.waitlist_queue_position_seq');

WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.waitlist
)
UPDATE public.waitlist w
SET queue_position = ranked.rn
FROM ranked
WHERE w.id = ranked.id AND (w.queue_position IS NULL OR w.queue_position = 0);

SELECT setval('public.waitlist_queue_position_seq', COALESCE((SELECT MAX(queue_position) FROM public.waitlist), 0), true);

CREATE OR REPLACE FUNCTION public.generate_waitlist_referral_token()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  token text;
  attempts integer := 0;
BEGIN
  LOOP
    token := upper(substr(replace(md5(random()::text || clock_timestamp()::text), '0', 'A'), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.waitlist WHERE lower(referral_token) = lower(token));
    attempts := attempts + 1;
    EXIT WHEN attempts >= 100;
  END LOOP;

  IF attempts >= 100 THEN
    RAISE EXCEPTION 'Unable to generate a unique referral token';
  END IF;

  RETURN token;
END $$;
REVOKE ALL ON FUNCTION public.generate_waitlist_referral_token() FROM public;
GRANT EXECUTE ON FUNCTION public.generate_waitlist_referral_token() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_waitlist_referral_fields()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.referral_token IS NULL OR NEW.referral_token = '' THEN
    NEW.referral_token := public.generate_waitlist_referral_token();
  END IF;

  IF NEW.queue_position IS NULL OR NEW.queue_position = 0 THEN
    NEW.queue_position := nextval('public.waitlist_queue_position_seq');
  END IF;

  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS waitlist_before_insert_set_referral_fields ON public.waitlist;
CREATE TRIGGER waitlist_before_insert_set_referral_fields
BEFORE INSERT ON public.waitlist
FOR EACH ROW EXECUTE FUNCTION public.set_waitlist_referral_fields();

CREATE OR REPLACE FUNCTION public.increment_waitlist_referrals()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE public.waitlist
    SET referrals_count = COALESCE(referrals_count, 0) + 1
    WHERE id = NEW.parent_id;
  END IF;

  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS waitlist_after_insert_increment_referrals ON public.waitlist;
CREATE TRIGGER waitlist_after_insert_increment_referrals
AFTER INSERT ON public.waitlist
FOR EACH ROW EXECUTE FUNCTION public.increment_waitlist_referrals();

CREATE OR REPLACE FUNCTION public.join_waitlist_with_profile(
  _full_name text, _email text, _phone text DEFAULT NULL, _state text DEFAULT NULL,
  _city text DEFAULT NULL, _user_type text DEFAULT 'buyer', _referral_code text DEFAULT NULL,
  _source text DEFAULT 'wait-list'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _clean_email text := lower(trim(_email));
  _resolved_parent_id uuid;
  _existing_row public.waitlist%ROWTYPE;
  _created_row public.waitlist%ROWTYPE;
BEGIN
  IF _clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('status', 'invalid_email');
  END IF;

  IF length(trim(coalesce(_full_name,''))) < 2 THEN
    RETURN jsonb_build_object('status', 'invalid_name');
  END IF;

  SELECT * INTO _existing_row
  FROM public.waitlist
  WHERE lower(email) = _clean_email
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'exists',
      'referral_token', _existing_row.referral_token,
      'queue_position', _existing_row.queue_position,
      'referrals_count', COALESCE(_existing_row.referrals_count, 0)
    );
  END IF;

  IF trim(coalesce(_referral_code,'')) <> '' THEN
    SELECT id INTO _resolved_parent_id
    FROM public.waitlist
    WHERE lower(coalesce(referral_token, '')) = lower(trim(_referral_code))
       OR lower(coalesce(referral_code, '')) = lower(trim(_referral_code))
    ORDER BY created_at, id
    LIMIT 1;
  END IF;

  INSERT INTO public.waitlist (
    full_name, email, phone, state, city, user_type, referral_code, source, parent_id
  )
  VALUES (
    left(trim(_full_name), 120),
    _clean_email,
    left(nullif(trim(coalesce(_phone,'')), ''), 30),
    left(nullif(trim(coalesce(_state,'')), ''), 60),
    left(nullif(trim(coalesce(_city,'')), ''), 60),
    CASE WHEN _user_type IN ('buyer','seller','artisan','all') THEN _user_type ELSE 'buyer' END,
    NULL,
    left(coalesce(_source,'wait-list'), 60),
    _resolved_parent_id
  )
  RETURNING * INTO _created_row;

  INSERT INTO public.waitlist_events (event_type) VALUES ('signup');

  RETURN jsonb_build_object(
    'status', 'joined',
    'referral_token', _created_row.referral_token,
    'queue_position', _created_row.queue_position,
    'referrals_count', COALESCE(_created_row.referrals_count, 0)
  );
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('status', 'exists');
END $$;
REVOKE ALL ON FUNCTION public.join_waitlist_with_profile(text,text,text,text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.join_waitlist_with_profile(text,text,text,text,text,text,text,text) TO anon, authenticated;
