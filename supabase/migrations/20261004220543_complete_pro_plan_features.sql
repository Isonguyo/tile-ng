
-- Pro plan completion: inquiry dashboard + richer product performance analytics
UPDATE public.subscription_plans
SET
  display_name = 'Pro',
  price_ngn = 15000,
  can_shop = true,
  can_promote = true,
  can_ai_desc = true,
  can_vanity_slug = true,
  boost_credits = 5,
  features = ARRAY[
    'verified_vendor_badge',
    'custom_shop_url',
    'qr_code',
    'five_top_ads_per_30_day_billing_cycle',
    'homepage_priority',
    'featured_vendor_placement',
    'product_performance_analytics',
    'customer_inquiry_dashboard',
    'social_sharing_tools',
    'priority_support'
  ]
WHERE tier = 'pro';

CREATE INDEX IF NOT EXISTS chats_seller_created_idx
  ON public.chats(seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_chat_created_idx
  ON public.messages(chat_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_vendor_analytics(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _tier public.sub_tier;
  _days_clamped integer;
  _since timestamptz;
  _res jsonb;
  _ev jsonb := '{}'::jsonb;
  _top jsonb := '[]'::jsonb;
  _performance jsonb := '[]'::jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  _tier := public.tile_user_effective_tier(_uid);
  _days_clamped := LEAST(GREATEST(COALESCE(_days,30),1),365);
  _since := now() - make_interval(days => _days_clamped);

  SELECT jsonb_build_object(
    'live_listings', COUNT(*) FILTER (WHERE status='approved' AND expires_at > now()),
    'total_views', COALESCE(SUM(views_count),0),
    'total_clicks', COALESCE(SUM(clicks_count),0),
    'total_favorites', COALESCE((
      SELECT COUNT(*)
      FROM public.favorites f
      JOIN public.listings fl ON fl.id=f.listing_id
      WHERE fl.user_id=_uid
    ),0),
    'active_top_ads', COUNT(*) FILTER (
      WHERE is_promoted
        AND status='approved'
        AND expires_at > now()
        AND (promotion_expires_at IS NULL OR promotion_expires_at > now())
    )
  )
  INTO _res
  FROM public.listings
  WHERE user_id=_uid;

  SELECT jsonb_build_object(
    'views', COUNT(*) FILTER (WHERE e.event_type='view'),
    'impressions', COUNT(*) FILTER (WHERE e.event_type='impression'),
    'saves', COUNT(*) FILTER (WHERE e.event_type='save'),
    'chats', COUNT(*) FILTER (WHERE e.event_type='chat'),
    'whatsapp', COUNT(*) FILTER (WHERE e.event_type='whatsapp'),
    'phone', COUNT(*) FILTER (WHERE e.event_type='phone'),
    'shares', COUNT(*) FILTER (WHERE e.event_type='share')
  )
  INTO _ev
  FROM public.listing_events e
  JOIN public.listings l ON l.id=e.listing_id
  WHERE l.user_id=_uid
    AND e.created_at >= _since;

  SELECT COALESCE(jsonb_agg(t ORDER BY t.views DESC), '[]'::jsonb)
  INTO _top
  FROM (
    SELECT
      l.id,
      l.title,
      l.views_count,
      l.clicks_count,
      COALESCE((SELECT COUNT(*) FROM public.favorites f WHERE f.listing_id=l.id),0)::bigint AS favorites_count,
      CASE WHEN l.views_count > 0
           THEN ROUND(100.0*l.clicks_count/l.views_count,2)
           ELSE 0 END AS ctr
    FROM public.listings l
    WHERE l.user_id=_uid
    ORDER BY l.views_count DESC NULLS LAST
    LIMIT 10
  ) t;

  -- Detailed per-listing performance for Pro/VIP.
  IF _tier IN ('pro','vip') THEN
    SELECT COALESCE(jsonb_agg(t ORDER BY t.views DESC), '[]'::jsonb)
    INTO _performance
    FROM (
      SELECT
        l.id,
        l.title,
        l.status,
        l.is_promoted,
        l.views_count,
        l.clicks_count,
        COALESCE((SELECT COUNT(*) FROM public.favorites f WHERE f.listing_id=l.id),0)::bigint AS saves,
        COALESCE((SELECT COUNT(*) FROM public.listing_events e WHERE e.listing_id=l.id AND e.event_type='impression' AND e.created_at >= _since),0)::bigint AS impressions_last_period,
        COALESCE((SELECT COUNT(*) FROM public.listing_events e WHERE e.listing_id=l.id AND e.event_type='view' AND e.created_at >= _since),0)::bigint AS views_last_period,
        COALESCE((SELECT COUNT(*) FROM public.listing_events e WHERE e.listing_id=l.id AND e.event_type='chat' AND e.created_at >= _since),0)::bigint AS chats_last_period,
        COALESCE((SELECT COUNT(*) FROM public.listing_events e WHERE e.listing_id=l.id AND e.event_type='share' AND e.created_at >= _since),0)::bigint AS shares_last_period,
        COALESCE((SELECT COUNT(*) FROM public.listing_events e WHERE e.listing_id=l.id AND e.event_type='whatsapp' AND e.created_at >= _since),0)::bigint AS whatsapp_last_period,
        CASE WHEN l.views_count > 0
             THEN ROUND(100.0*l.clicks_count/l.views_count,2)
             ELSE 0 END AS ctr
      FROM public.listings l
      WHERE l.user_id=_uid
      ORDER BY l.views_count DESC NULLS LAST
      LIMIT 25
    ) t;
  END IF;

  RETURN _res
    || jsonb_build_object(
      'tier', _tier,
      'level', CASE _tier WHEN 'free' THEN 'basic' WHEN 'lite' THEN 'basic' ELSE 'advanced' END,
      'period_days', _days_clamped,
      'events_last_period', _ev,
      'top_listings', _top,
      'product_performance', _performance,
      'ctr', CASE
        WHEN COALESCE((_res->>'total_views')::numeric,0) > 0
        THEN ROUND(
          100.0*COALESCE((_res->>'total_clicks')::numeric,0)
          / (_res->>'total_views')::numeric,
          2
        )
        ELSE 0
      END
    );
END
$$;

CREATE OR REPLACE FUNCTION public.get_customer_inquiry_dashboard(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _tier public.sub_tier;
  _days_clamped integer;
  _since timestamptz;
  _total bigint;
  _unread bigint;
  _active bigint;
  _recent bigint;
  _top_listings jsonb := '[]'::jsonb;
  _recent_rows jsonb := '[]'::jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  _tier := public.tile_user_effective_tier(_uid);
  IF _tier NOT IN ('pro','vip') THEN
    RAISE EXCEPTION 'Customer Inquiry Dashboard requires an active Pro or VIP plan';
  END IF;

  _days_clamped := LEAST(GREATEST(COALESCE(_days,30),1),365);
  _since := now() - make_interval(days => _days_clamped);

  SELECT COUNT(*)
  INTO _total
  FROM public.chats c
  WHERE c.seller_id = _uid;

  SELECT COUNT(*)
  INTO _unread
  FROM public.messages m
  JOIN public.chats c ON c.id = m.chat_id
  WHERE c.seller_id = _uid
    AND m.sender_id <> _uid
    AND m.read_at IS NULL;

  SELECT COUNT(*)
  INTO _active
  FROM public.chats c
  WHERE c.seller_id = _uid
    AND c.created_at >= _since;

  SELECT COUNT(*)
  INTO _recent
  FROM public.chats c
  WHERE c.seller_id = _uid
    AND c.created_at >= _since;

  SELECT COALESCE(jsonb_agg(t ORDER BY t.inquiries DESC), '[]'::jsonb)
  INTO _top_listings
  FROM (
    SELECT
      c.listing_id,
      l.title,
      COUNT(*)::bigint AS inquiries,
      COUNT(*) FILTER (WHERE c.created_at >= _since)::bigint AS inquiries_last_period
    FROM public.chats c
    JOIN public.listings l ON l.id = c.listing_id
    WHERE c.seller_id = _uid
    GROUP BY c.listing_id, l.title
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(t ORDER BY t.last_message_at DESC), '[]'::jsonb)
  INTO _recent_rows
  FROM (
    SELECT
      c.id AS chat_id,
      c.listing_id,
      l.title AS listing_title,
      c.buyer_id,
      COALESCE(b.business_name, b.full_name) AS customer_name,
      c.created_at,
      COALESCE(
        (SELECT m.content
         FROM public.messages m
         WHERE m.chat_id=c.id
         ORDER BY m.created_at DESC
         LIMIT 1),
        ''
      ) AS last_message,
      COALESCE(
        (SELECT m.created_at
         FROM public.messages m
         WHERE m.chat_id=c.id
         ORDER BY m.created_at DESC
         LIMIT 1),
        c.created_at
      ) AS last_message_at,
      (
        SELECT COUNT(*)::bigint
        FROM public.messages m
        WHERE m.chat_id=c.id
          AND m.sender_id <> _uid
          AND m.read_at IS NULL
      ) AS unread_count
    FROM public.chats c
    JOIN public.listings l ON l.id=c.listing_id
    JOIN public.profiles b ON b.id=c.buyer_id
    WHERE c.seller_id=_uid
    ORDER BY last_message_at DESC
    LIMIT 50
  ) t;

  RETURN jsonb_build_object(
    'tier', _tier,
    'period_days', _days_clamped,
    'total_inquiries', _total,
    'unread_inquiries', _unread,
    'inquiries_last_period', _recent,
    'active_conversations', _active,
    'top_listings', _top_listings,
    'recent_inquiries', _recent_rows
  );
END
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_inquiry_dashboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vendor_analytics(integer) TO authenticated;
