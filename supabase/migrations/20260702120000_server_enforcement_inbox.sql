-- Server-side enforcement for listings, promotions, and inbox actions

ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.check_post_quota(_type listing_type)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  _tier sub_tier;
  _until TIMESTAMPTZ;
  _max_goods INT;
  _max_services INT;
  _used INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT subscription_tier, subscription_until
    INTO _tier, _until
    FROM public.profiles
    WHERE id = auth.uid();

  IF _tier IS NULL OR (_until IS NOT NULL AND _until <= now()) THEN
    _tier := 'free';
  END IF;

  SELECT max_goods, max_services
    INTO _max_goods, _max_services
    FROM public.subscription_plans
    WHERE tier = _tier;

  IF _max_goods IS NULL OR _max_services IS NULL THEN
    _max_goods := 5;
    _max_services := 1;
  END IF;

  SELECT COUNT(*) INTO _used
    FROM public.listings
    WHERE user_id = auth.uid()
      AND type = _type
      AND status IN ('pending', 'approved');

  IF _type = 'goods' AND _used >= _max_goods THEN
    RETURN FALSE;
  END IF;

  IF _type = 'service' AND _used >= _max_services THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END $$;

REVOKE EXECUTE ON FUNCTION public.check_post_quota(listing_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_post_quota(listing_type) TO authenticated;

CREATE OR REPLACE FUNCTION public.promote_listing(
  p_listing_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  _effective_user UUID;
  _owner UUID;
  _tier sub_tier;
  _until TIMESTAMPTZ;
  _plan public.subscription_plans%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _effective_user := COALESCE(p_user_id, auth.uid());
  IF _effective_user <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT user_id INTO _owner FROM public.listings WHERE id = p_listing_id;
  IF _owner IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF _owner <> _effective_user AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT subscription_tier, subscription_until
    INTO _tier, _until
    FROM public.profiles
    WHERE id = _effective_user;

  IF _tier IS NULL OR (_until IS NOT NULL AND _until <= now()) THEN
    _tier := 'free';
  END IF;

  SELECT * INTO _plan FROM public.subscription_plans WHERE tier = _tier;
  IF _plan.tier IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  IF NOT _plan.can_promote THEN
    RAISE EXCEPTION 'Your plan does not include promotions';
  END IF;

  UPDATE public.listings
    SET is_promoted = true,
        updated_at = now()
    WHERE id = p_listing_id AND user_id = _effective_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  RETURN TRUE;
END $$;

REVOKE EXECUTE ON FUNCTION public.promote_listing(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_listing(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_chat_pin(_chat_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  _pinned_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT pinned_at INTO _pinned_at
    FROM public.chats
    WHERE id = _chat_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid());

  IF _pinned_at IS NULL THEN
    UPDATE public.chats
      SET pinned_at = now()
      WHERE id = _chat_id
        AND (buyer_id = auth.uid() OR seller_id = auth.uid());
    RETURN TRUE;
  END IF;

  UPDATE public.chats
    SET pinned_at = NULL
    WHERE id = _chat_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid());
  RETURN FALSE;
END $$;

REVOKE EXECUTE ON FUNCTION public.toggle_chat_pin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_chat_pin(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_chats()
RETURNS TABLE (
  id uuid,
  listing_id uuid,
  listing_title text,
  listing_image text,
  other_id uuid,
  other_name text,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint,
  pinned_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
    SELECT
      c.id,
      c.listing_id,
      l.title,
      CASE WHEN array_length(l.images, 1) > 0 THEN l.images[1] ELSE NULL END,
      CASE WHEN c.buyer_id = auth.uid() THEN c.seller_id ELSE c.buyer_id END,
      p.full_name,
      (SELECT m.content FROM public.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1),
      COALESCE((SELECT m.created_at FROM public.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1), c.created_at),
      (SELECT count(*) FROM public.messages m WHERE m.chat_id = c.id AND m.sender_id <> auth.uid() AND m.read_at IS NULL),
      c.pinned_at
    FROM public.chats c
    LEFT JOIN public.listings l ON l.id = c.listing_id
    LEFT JOIN public.profiles p ON p.id = (CASE WHEN c.buyer_id = auth.uid() THEN c.seller_id ELSE c.buyer_id END)
    WHERE c.buyer_id = auth.uid() OR c.seller_id = auth.uid()
    ORDER BY CASE WHEN c.pinned_at IS NOT NULL THEN 0 ELSE 1 END, 8 DESC NULLS LAST;
END $$;

REVOKE EXECUTE ON FUNCTION public.my_chats() FROM anon;
GRANT EXECUTE ON FUNCTION public.my_chats() TO authenticated;
