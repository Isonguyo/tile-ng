
-- Tile Lite value + support system
-- 1) Make subscription_plans authoritative and populate it.
INSERT INTO public.subscription_plans
  (tier, display_name, price_ngn, max_goods, max_services, can_shop, can_promote, can_ai_desc, can_vanity_slug, boost_credits, features)
VALUES
  ('free', 'Free', 0, 19, 1, false, false, false, false, 0,
    ARRAY['basic_analytics','contact_seller','search_visibility']),
  ('lite', 'Lite', 5000, 20, 5, true, true, false, true, 0,
    ARRAY['verified_vendor_badge','custom_shop_url','qr_code','one_top_ad_per_7_days','basic_analytics','priority_support']),
  ('pro', 'Pro', 15000, 50, 20, true, true, true, true, 5,
    ARRAY['verified_vendor_badge','custom_shop_url','qr_code','top_ads_5_monthly','homepage_priority','featured_vendor','advanced_analytics','priority_support']),
  ('vip', 'VIP', 40000, 1000, 1000, true, true, true, true, 15,
    ARRAY['verified_vendor_badge','custom_shop_url','qr_code','top_ads_15_concurrent','homepage_featured','advanced_analytics','priority_support','google_meta_cross_posting'])
ON CONFLICT (tier) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_ngn = EXCLUDED.price_ngn,
  max_goods = EXCLUDED.max_goods,
  max_services = EXCLUDED.max_services,
  can_shop = EXCLUDED.can_shop,
  can_promote = EXCLUDED.can_promote,
  can_ai_desc = EXCLUDED.can_ai_desc,
  can_vanity_slug = EXCLUDED.can_vanity_slug,
  boost_credits = EXCLUDED.boost_credits,
  features = EXCLUDED.features;

-- 2) Paid verified badge is a real entitlement, but only after KYC/admin verification.
CREATE OR REPLACE FUNCTION public.get_user_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _tier public.sub_tier;
  _until timestamptz;
  _max int;
  _active int;
  _verified boolean;
BEGIN
  IF _uid IS NULL THEN RETURN NULL; END IF;

  SELECT public.effective_tier(subscription_tier, subscription_until),
         subscription_until,
         COALESCE(is_verified,false)
    INTO _tier, _until, _verified
  FROM public.profiles
  WHERE id = _uid;

  _tier := COALESCE(_tier, 'free');
  _max := public.tile_max_active_listings(_tier);
  _active := public.tile_active_listing_count(_uid);

  RETURN jsonb_build_object(
    'tier', _tier,
    'tier_rank', CASE _tier WHEN 'vip' THEN 3 WHEN 'pro' THEN 2 WHEN 'lite' THEN 1 ELSE 0 END,
    'active_until', CASE WHEN _tier = 'free' THEN NULL ELSE _until END,
    'max_active_listings', _max,
    'active_listings', _active,
    'can_create_listing', (_max IS NULL OR _active < _max),
    'top_ads', public.tile_top_ad_status(_uid),
    'custom_shop_url', _tier <> 'free',
    'qr_code', _tier <> 'free',
    'verified_vendor_badge', (_tier <> 'free' AND _verified),
    'verification_required_for_badge', (_tier <> 'free' AND NOT _verified),
    'priority_support', _tier <> 'free',
    'featured_vendor_eligible', _tier IN ('pro','vip'),
    'homepage_priority', _tier IN ('pro','vip'),
    'analytics_level', CASE _tier WHEN 'free' THEN 'basic' WHEN 'lite' THEN 'basic' ELSE 'advanced' END,
    'cross_platform_publishing', CASE WHEN _tier = 'vip' THEN 'pending_external_integration' ELSE 'not_included' END
  );
END
$$;

CREATE OR REPLACE FUNCTION public.get_vendor_badges(_uid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'tier', x.t,
    'verified_vendor', (x.t <> 'free' AND COALESCE(p.is_verified,false)),
    'verification_required_for_badge', (x.t <> 'free' AND NOT COALESCE(p.is_verified,false)),
    'pro', x.t = 'pro',
    'vip', x.t = 'vip',
    'featured_vendor', x.t IN ('pro','vip'),
    'priority_support', x.t <> 'free'
  )
  FROM (SELECT public.tile_user_effective_tier(_uid) AS t) x
  LEFT JOIN public.profiles p ON p.id = _uid;
$$;

-- 3) Basic analytics for Lite: views, clicks, saves, chats and engagement events.
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
      JOIN public.listings fl ON fl.id = f.listing_id
      WHERE fl.user_id = _uid
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
  WHERE user_id = _uid;

  _res := _res || jsonb_build_object(
    'tier', _tier,
    'level', CASE WHEN _tier='free' THEN 'basic' ELSE 'advanced' END,
    'period_days', LEAST(GREATEST(COALESCE(_days,30),1),365)
  );

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
      COALESCE((
        SELECT COUNT(*) FROM public.favorites f WHERE f.listing_id=l.id
      ),0)::bigint AS favorites_count,
      CASE WHEN l.views_count > 0
        THEN ROUND(100.0 * l.clicks_count / l.views_count, 2)
        ELSE 0
      END AS ctr
    FROM public.listings l
    WHERE l.user_id=_uid
    ORDER BY l.views_count DESC NULLS LAST
    LIMIT 10
  ) t;

  _res := _res
    || jsonb_build_object(
      'events_last_period', _ev,
      'top_listings', _top,
      'ctr', CASE
        WHEN COALESCE((_res->>'total_views')::numeric,0) > 0
        THEN ROUND(100.0 * COALESCE((_res->>'total_clicks')::numeric,0) / (_res->>'total_views')::numeric, 2)
        ELSE 0
      END
    );

  RETURN _res;
END
$$;

-- 4) Priority support: real ticketing with priority determined by active plan at ticket creation.
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (char_length(trim(subject)) BETWEEN 3 AND 160),
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','high','urgent')),
  requester_tier public.sub_tier NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending_user','pending_support','resolved','closed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_updated_idx
  ON public.support_tickets(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS support_tickets_priority_status_idx
  ON public.support_tickets(priority, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS support_messages_ticket_created_idx
  ON public.support_messages(ticket_id, created_at);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON public.support_messages TO authenticated;

DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
CREATE POLICY "Users can view own support tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Users can create own support tickets" ON public.support_tickets;
CREATE POLICY "Users can create own support tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view messages on own tickets" ON public.support_messages;
CREATE POLICY "Users can view messages on own tickets"
ON public.support_messages
FOR SELECT
TO authenticated
USING (
  public.is_staff(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_messages.ticket_id
      AND st.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can add messages to own tickets" ON public.support_messages;
CREATE POLICY "Users can add messages to own tickets"
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = support_messages.ticket_id
        AND st.user_id = auth.uid()
    )
  )
);

CREATE OR REPLACE FUNCTION public.touch_support_ticket()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS support_tickets_updated ON public.support_tickets;
CREATE TRIGGER support_tickets_updated
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.touch_support_ticket();

CREATE OR REPLACE FUNCTION public.support_priority_for_user(_uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE public.tile_user_effective_tier(_uid)
    WHEN 'vip' THEN 'urgent'
    WHEN 'pro' THEN 'high'
    WHEN 'lite' THEN 'high'
    ELSE 'normal'
  END;
$$;

CREATE OR REPLACE FUNCTION public.create_support_ticket(
  _subject text,
  _message text,
  _category text DEFAULT 'general'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _ticket_id uuid;
  _tier public.sub_tier;
  _priority text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF char_length(trim(_subject)) < 3 OR char_length(trim(_subject)) > 160 THEN
    RAISE EXCEPTION 'Subject must be 3-160 characters';
  END IF;
  IF char_length(trim(_message)) < 1 OR char_length(trim(_message)) > 10000 THEN
    RAISE EXCEPTION 'Message must be 1-10000 characters';
  END IF;

  _tier := public.tile_user_effective_tier(_uid);
  _priority := public.support_priority_for_user(_uid);

  INSERT INTO public.support_tickets(user_id, subject, category, priority, requester_tier, status)
  VALUES (_uid, trim(_subject), COALESCE(NULLIF(trim(_category),''),'general'), _priority, _tier, 'open')
  RETURNING id INTO _ticket_id;

  INSERT INTO public.support_messages(ticket_id, sender_id, message)
  VALUES (_ticket_id, _uid, trim(_message));

  RETURN _ticket_id;
END
$$;

CREATE OR REPLACE FUNCTION public.get_my_support_tickets()
RETURNS TABLE(
  id uuid,
  subject text,
  category text,
  priority text,
  requester_tier public.sub_tier,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT st.id, st.subject, st.category, st.priority, st.requester_tier, st.status,
         st.created_at, st.updated_at
  FROM public.support_tickets st
  WHERE st.user_id = auth.uid()
  ORDER BY
    CASE st.status WHEN 'open' THEN 0 WHEN 'pending_user' THEN 1 WHEN 'pending_support' THEN 2 WHEN 'resolved' THEN 3 ELSE 4 END,
    CASE st.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,
    st.updated_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_support_ticket(_ticket_id uuid)
RETURNS TABLE(
  id uuid,
  subject text,
  category text,
  priority text,
  requester_tier public.sub_tier,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  message_id uuid,
  sender_id uuid,
  message text,
  message_created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT st.id, st.subject, st.category, st.priority, st.requester_tier, st.status,
         st.created_at, st.updated_at,
         sm.id, sm.sender_id, sm.message, sm.created_at
  FROM public.support_tickets st
  JOIN public.support_messages sm ON sm.ticket_id=st.id
  WHERE st.id=_ticket_id
    AND (st.user_id=auth.uid() OR public.is_staff(auth.uid()))
  ORDER BY sm.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.add_support_message(
  _ticket_id uuid,
  _message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF char_length(trim(_message)) < 1 OR char_length(trim(_message)) > 10000 THEN
    RAISE EXCEPTION 'Message must be 1-10000 characters';
  END IF;

  SELECT user_id INTO _owner FROM public.support_tickets WHERE id=_ticket_id;
  IF _owner IS NULL THEN RAISE EXCEPTION 'Support ticket not found'; END IF;

  IF _uid <> _owner AND NOT public.is_staff(_uid) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.support_messages(ticket_id, sender_id, message)
  VALUES (_ticket_id, _uid, trim(_message));

  UPDATE public.support_tickets
  SET status = CASE WHEN public.is_staff(_uid) THEN 'pending_user' ELSE 'pending_support' END,
      updated_at = now()
  WHERE id=_ticket_id;

  IF public.is_staff(_uid) THEN
    INSERT INTO public.notifications(user_id, title, body, link)
    VALUES (_owner, 'Support replied', 'Tile support has replied to your support ticket.', '/dashboard');
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.admin_list_support_tickets(_status text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  business_name text,
  requester_tier public.sub_tier,
  priority text,
  status text,
  category text,
  subject text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT st.id, st.user_id, p.full_name, p.business_name, st.requester_tier,
         st.priority, st.status, st.category, st.subject, st.created_at, st.updated_at
  FROM public.support_tickets st
  LEFT JOIN public.profiles p ON p.id=st.user_id
  WHERE public.is_staff(auth.uid())
    AND (_status IS NULL OR st.status=_status)
  ORDER BY
    CASE st.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,
    CASE st.status WHEN 'open' THEN 0 WHEN 'pending_support' THEN 1 WHEN 'pending_user' THEN 2 WHEN 'resolved' THEN 3 ELSE 4 END,
    st.updated_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_support_ticket_status(
  _ticket_id uuid,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _status NOT IN ('open','pending_user','pending_support','resolved','closed') THEN
    RAISE EXCEPTION 'Invalid ticket status';
  END IF;

  UPDATE public.support_tickets
  SET status=_status, updated_at=now()
  WHERE id=_ticket_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Support ticket not found'; END IF;
END
$$;

-- Helpful grants for the new RPCs.
GRANT EXECUTE ON FUNCTION public.create_support_ticket(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_support_tickets() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_support_ticket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_support_message(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_support_tickets(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_support_ticket_status(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_entitlements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vendor_badges(uuid) TO anon, authenticated;
