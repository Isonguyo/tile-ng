
-- has_any_admin helper: admin, moderator, or support all count as staff for reads
CREATE OR REPLACE FUNCTION public.is_staff(_uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role IN ('admin','moderator','support'));
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff(UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;

-- Dashboard mission control
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS TABLE(
  users_total BIGINT, users_today BIGINT,
  listings_total BIGINT, listings_pending BIGINT, listings_today BIGINT,
  revenue_total NUMERIC, revenue_today NUMERIC, revenue_month NUMERIC,
  active_subscribers BIGINT, vip BIGINT, pro BIGINT, lite BIGINT,
  reports_open BIGINT, kyc_pending BIGINT,
  shops_total BIGINT, artisans_total BIGINT,
  chats_24h BIGINT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= now() - interval '24 hours'),
    (SELECT COUNT(*) FROM public.listings),
    (SELECT COUNT(*) FROM public.listings WHERE status='pending'),
    (SELECT COUNT(*) FROM public.listings WHERE created_at >= now() - interval '24 hours'),
    COALESCE((SELECT SUM(ABS(amount)) FROM public.wallet_transactions WHERE tx_type IN ('subscription','promotion')),0)::NUMERIC,
    COALESCE((SELECT SUM(ABS(amount)) FROM public.wallet_transactions WHERE tx_type IN ('subscription','promotion') AND created_at >= now() - interval '24 hours'),0)::NUMERIC,
    COALESCE((SELECT SUM(ABS(amount)) FROM public.wallet_transactions WHERE tx_type IN ('subscription','promotion') AND created_at >= date_trunc('month', now())),0)::NUMERIC,
    (SELECT COUNT(*) FROM public.profiles WHERE subscription_tier<>'free' AND subscription_until>now()),
    (SELECT COUNT(*) FROM public.profiles WHERE subscription_tier='vip' AND subscription_until>now()),
    (SELECT COUNT(*) FROM public.profiles WHERE subscription_tier='pro' AND subscription_until>now()),
    (SELECT COUNT(*) FROM public.profiles WHERE subscription_tier='lite' AND subscription_until>now()),
    (SELECT COUNT(*) FROM public.reports WHERE status='open'),
    (SELECT COUNT(*) FROM public.profiles WHERE kyc_status='pending'),
    (SELECT COUNT(*) FROM public.profiles WHERE shop_slug IS NOT NULL),
    (SELECT COUNT(*) FROM public.profiles WHERE is_artisan=true),
    (SELECT COUNT(*) FROM public.chats WHERE created_at >= now() - interval '24 hours');
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_stats() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;

-- Activity feed
CREATE OR REPLACE FUNCTION public.admin_activity_feed(_limit INT DEFAULT 40)
RETURNS TABLE(kind TEXT, title TEXT, subtitle TEXT, at TIMESTAMPTZ, entity_id UUID)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    (SELECT 'signup'::text, COALESCE(full_name,'New user'), 'joined Tile', created_at, id FROM public.profiles ORDER BY created_at DESC LIMIT _limit)
    UNION ALL
    (SELECT 'listing'::text, title, status::text, created_at, id FROM public.listings ORDER BY created_at DESC LIMIT _limit)
    UNION ALL
    (SELECT 'payment'::text, tx_type::text, '₦' || ABS(amount)::text, created_at, id FROM public.wallet_transactions ORDER BY created_at DESC LIMIT _limit)
    UNION ALL
    (SELECT 'report'::text, entity_type || ' report', reason, created_at, id FROM public.reports ORDER BY created_at DESC LIMIT _limit)
    ORDER BY at DESC LIMIT _limit;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_activity_feed(INT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_activity_feed(INT) TO authenticated;

-- Moderation queue with risk score
CREATE OR REPLACE FUNCTION public.admin_moderation_queue()
RETURNS TABLE(id UUID, title TEXT, price NUMERIC, category TEXT, images TEXT[], created_at TIMESTAMPTZ,
              seller_id UUID, seller_name TEXT, seller_phone TEXT, account_age_days INT,
              risk_score INT, risk_reasons TEXT[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT l.id, l.title, l.price, l.category, l.images, l.created_at,
    p.id, p.full_name, p.phone,
    EXTRACT(DAY FROM (now() - p.created_at))::INT AS age_days,
    LEAST(100,
      (CASE WHEN p.created_at > now() - interval '2 days' THEN 30 ELSE 0 END) +
      (CASE WHEN p.is_verified THEN 0 ELSE 10 END) +
      (CASE WHEN p.kyc_status<>'approved' THEN 10 ELSE 0 END) +
      (COALESCE((SELECT COUNT(*)::INT FROM public.reports r WHERE r.entity_type='user' AND r.entity_id=p.id),0)*15) +
      (CASE WHEN (SELECT COUNT(*) FROM public.profiles p2 WHERE p2.phone=p.phone AND p.phone IS NOT NULL AND p2.id<>p.id) > 0 THEN 25 ELSE 0 END) +
      (CASE WHEN l.price IS NOT NULL AND l.price < 1000 THEN 15 ELSE 0 END)
    )::INT AS risk,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN p.created_at > now() - interval '2 days' THEN 'New account (< 2 days)' END,
      CASE WHEN NOT p.is_verified THEN 'Unverified seller' END,
      CASE WHEN p.kyc_status<>'approved' THEN 'KYC not approved' END,
      CASE WHEN (SELECT COUNT(*) FROM public.reports r WHERE r.entity_type='user' AND r.entity_id=p.id) > 0 THEN 'Previously reported' END,
      CASE WHEN (SELECT COUNT(*) FROM public.profiles p2 WHERE p2.phone=p.phone AND p.phone IS NOT NULL AND p2.id<>p.id) > 0 THEN 'Duplicate phone across accounts' END,
      CASE WHEN l.price IS NOT NULL AND l.price < 1000 THEN 'Unusually low price' END
    ], NULL)
  FROM public.listings l JOIN public.profiles p ON p.id = l.user_id
  WHERE l.status='pending'
  ORDER BY risk DESC, l.created_at ASC;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_moderation_queue() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_moderation_queue() TO authenticated;

-- Reports center
CREATE OR REPLACE FUNCTION public.admin_list_reports(_status TEXT DEFAULT 'open')
RETURNS TABLE(id UUID, entity_type TEXT, entity_id UUID, reason TEXT, details TEXT,
              status TEXT, reporter_id UUID, reporter_name TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT r.id, r.entity_type, r.entity_id, r.reason, r.details, r.status,
           r.reporter_id, p.full_name, r.created_at
    FROM public.reports r LEFT JOIN public.profiles p ON p.id=r.reporter_id
    WHERE (_status IS NULL OR r.status=_status)
    ORDER BY r.created_at DESC;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_list_reports(TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_reports(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_resolve_report(_report_id UUID, _action TEXT, _note TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.reports;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO r FROM public.reports WHERE id=_report_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Report not found'; END IF;

  IF _action = 'dismiss' THEN
    UPDATE public.reports SET status='dismissed', resolved_by=auth.uid() WHERE id=_report_id;
  ELSIF _action = 'warn' AND r.entity_type='user' THEN
    UPDATE public.reports SET status='resolved', resolved_by=auth.uid() WHERE id=_report_id;
    INSERT INTO public.notifications(user_id,title,body)
      VALUES (r.entity_id, 'Warning from Tile', COALESCE(_note,'Please review our community rules.'));
  ELSIF _action = 'remove_listing' AND r.entity_type='listing' THEN
    DELETE FROM public.listings WHERE id=r.entity_id;
    UPDATE public.reports SET status='resolved', resolved_by=auth.uid() WHERE id=_report_id;
  ELSIF _action = 'suspend_user' AND r.entity_type='user' THEN
    UPDATE public.profiles SET is_verified=false WHERE id=r.entity_id;
    DELETE FROM public.listings WHERE user_id=r.entity_id;
    UPDATE public.reports SET status='resolved', resolved_by=auth.uid() WHERE id=_report_id;
    INSERT INTO public.notifications(user_id,title,body)
      VALUES (r.entity_id, 'Account suspended', COALESCE(_note,'Your account is under review.'));
  ELSE
    RAISE EXCEPTION 'Invalid action for entity type';
  END IF;

  PERFORM public.log_admin_action('resolve_report::' || _action, r.entity_type, r.entity_id,
    jsonb_build_object('report_id', _report_id, 'note', _note));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_resolve_report(UUID, TEXT, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report(UUID, TEXT, TEXT) TO authenticated;

-- Broadcast notifications to a segment
CREATE OR REPLACE FUNCTION public.admin_broadcast(_audience TEXT, _title TEXT, _body TEXT, _link TEXT DEFAULT NULL)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _n INT;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF length(_title) < 2 OR length(_body) < 2 THEN RAISE EXCEPTION 'Missing title/body'; END IF;

  WITH targets AS (
    SELECT id FROM public.profiles
    WHERE
      CASE _audience
        WHEN 'all' THEN TRUE
        WHEN 'verified' THEN is_verified = true
        WHEN 'vip' THEN subscription_tier='vip' AND subscription_until>now()
        WHEN 'pro' THEN subscription_tier='pro' AND subscription_until>now()
        WHEN 'lite' THEN subscription_tier='lite' AND subscription_until>now()
        WHEN 'shops' THEN shop_slug IS NOT NULL
        WHEN 'artisans' THEN is_artisan = true
        ELSE FALSE
      END
  ), ins AS (
    INSERT INTO public.notifications(user_id, title, body, link)
    SELECT id, _title, _body, _link FROM targets
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO _n FROM ins;

  PERFORM public.log_admin_action('broadcast', 'audience', NULL,
    jsonb_build_object('audience', _audience, 'title', _title, 'count', _n));
  RETURN _n;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_broadcast(TEXT,TEXT,TEXT,TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_broadcast(TEXT,TEXT,TEXT,TEXT) TO authenticated;

-- Trust score
CREATE OR REPLACE FUNCTION public.user_trust_score(_uid UUID)
RETURNS INT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _p public.profiles; _s INT := 0; _reports INT; _sales INT; _age INT;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE id=_uid;
  IF _p.id IS NULL THEN RETURN 0; END IF;
  _age := EXTRACT(DAY FROM (now() - _p.created_at))::INT;
  SELECT COUNT(*) INTO _reports FROM public.reports WHERE entity_type='user' AND entity_id=_uid;
  _sales := COALESCE(_p.total_sales,0);
  _s := 40;
  IF _p.is_verified THEN _s := _s + 15; END IF;
  IF _p.kyc_status='approved' THEN _s := _s + 15; END IF;
  IF _age >= 90 THEN _s := _s + 10; ELSIF _age >= 30 THEN _s := _s + 5; END IF;
  IF _sales >= 20 THEN _s := _s + 10; ELSIF _sales >= 3 THEN _s := _s + 5; END IF;
  IF COALESCE(_p.avg_rating,0) >= 4.5 THEN _s := _s + 10; ELSIF COALESCE(_p.avg_rating,0) >= 4.0 THEN _s := _s + 5; END IF;
  _s := _s - LEAST(50, _reports * 10);
  RETURN GREATEST(0, LEAST(100, _s));
END $$;
REVOKE EXECUTE ON FUNCTION public.user_trust_score(UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_trust_score(UUID) TO authenticated;

-- User inspector
CREATE OR REPLACE FUNCTION public.admin_user_inspector(_uid UUID)
RETURNS TABLE(
  id UUID, full_name TEXT, email TEXT, phone TEXT, state TEXT, created_at TIMESTAMPTZ,
  is_verified BOOLEAN, kyc_status kyc_status, subscription_tier sub_tier, subscription_until TIMESTAMPTZ,
  wallet_balance NUMERIC, shop_slug TEXT, is_artisan BOOLEAN,
  listings_count BIGINT, active_listings BIGINT, chats_count BIGINT,
  reports_against BIGINT, wallet_txns BIGINT, trust_score INT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT p.id, p.full_name, u.email::text, p.phone, p.state, p.created_at,
    p.is_verified, p.kyc_status, p.subscription_tier, p.subscription_until,
    p.wallet_balance, p.shop_slug, p.is_artisan,
    (SELECT COUNT(*) FROM public.listings WHERE user_id=p.id),
    (SELECT COUNT(*) FROM public.listings WHERE user_id=p.id AND status='approved'),
    (SELECT COUNT(*) FROM public.chats WHERE buyer_id=p.id OR seller_id=p.id),
    (SELECT COUNT(*) FROM public.reports WHERE entity_type='user' AND entity_id=p.id),
    (SELECT COUNT(*) FROM public.wallet_transactions WHERE user_id=p.id),
    public.user_trust_score(p.id)
  FROM public.profiles p LEFT JOIN auth.users u ON u.id=p.id WHERE p.id=_uid;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_user_inspector(UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_user_inspector(UUID) TO authenticated;

-- Emergency controls (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_platform_settings(
  _maintenance BOOLEAN, _disable_registration BOOLEAN, _disable_posting BOOLEAN,
  _disable_payments BOOLEAN, _disable_withdrawals BOOLEAN, _disable_messaging BOOLEAN,
  _banner TEXT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.platform_settings SET
    maintenance_mode=_maintenance, disable_registration=_disable_registration,
    disable_posting=_disable_posting, disable_payments=_disable_payments,
    disable_withdrawals=_disable_withdrawals, disable_messaging=_disable_messaging,
    emergency_banner=_banner, updated_at=now(), updated_by=auth.uid()
  WHERE id=1;
  PERFORM public.log_admin_action('update_platform_settings','platform',NULL,
    jsonb_build_object('maintenance',_maintenance,'banner',_banner));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_update_platform_settings(BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_platform_settings(BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,TEXT) TO authenticated;
