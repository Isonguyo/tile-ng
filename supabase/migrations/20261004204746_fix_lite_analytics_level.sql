
CREATE OR REPLACE FUNCTION public.get_vendor_analytics(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _tier public.sub_tier;
  _since timestamptz;
  _res jsonb;
  _ev jsonb := '{}'::jsonb;
  _top jsonb := '[]'::jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  _tier := public.tile_user_effective_tier(_uid);
  _since := now() - make_interval(days => LEAST(GREATEST(COALESCE(_days,30),1),365));

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
  WHERE l.user_id=_uid AND e.created_at >= _since;

  SELECT COALESCE(jsonb_agg(t ORDER BY t.views DESC), '[]'::jsonb)
  INTO _top
  FROM (
    SELECT l.id, l.title, l.views_count, l.clicks_count,
           COALESCE((SELECT COUNT(*) FROM public.favorites f WHERE f.listing_id=l.id),0)::bigint AS favorites_count,
           CASE WHEN l.views_count > 0
                THEN ROUND(100.0*l.clicks_count/l.views_count,2)
                ELSE 0 END AS ctr
    FROM public.listings l
    WHERE l.user_id=_uid
    ORDER BY l.views_count DESC NULLS LAST
    LIMIT 10
  ) t;

  RETURN _res
    || jsonb_build_object(
      'tier', _tier,
      'level', CASE _tier WHEN 'free' THEN 'basic' WHEN 'lite' THEN 'basic' ELSE 'advanced' END,
      'period_days', LEAST(GREATEST(COALESCE(_days,30),1),365),
      'events_last_period', _ev,
      'top_listings', _top,
      'ctr', CASE
        WHEN COALESCE((_res->>'total_views')::numeric,0) > 0
        THEN ROUND(100.0*COALESCE((_res->>'total_clicks')::numeric,0)/(_res->>'total_views')::numeric,2)
        ELSE 0
      END
    );
END
$$;
