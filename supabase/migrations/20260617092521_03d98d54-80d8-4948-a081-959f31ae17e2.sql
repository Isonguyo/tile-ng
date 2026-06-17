
-- Public homepage stats
CREATE OR REPLACE FUNCTION public.platform_stats()
RETURNS TABLE(total_listings bigint, verified_vendors bigint, active_shops bigint, active_categories bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.listings WHERE status = 'approved'),
    (SELECT count(*) FROM public.profiles WHERE is_verified = true),
    (SELECT count(*) FROM public.profiles WHERE shop_slug IS NOT NULL),
    (SELECT count(DISTINCT category) FROM public.listings WHERE status = 'approved');
$$;

CREATE OR REPLACE FUNCTION public.category_counts()
RETURNS TABLE(category text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT category, count(*)::bigint
  FROM public.listings
  WHERE status = 'approved' AND category IS NOT NULL
  GROUP BY category
  ORDER BY count(*) DESC;
$$;

CREATE OR REPLACE FUNCTION public.top_vendors(_limit int DEFAULT 8)
RETURNS TABLE(id uuid, full_name text, business_name text, shop_slug text, avatar_url text, subscription_tier sub_tier, is_verified boolean, active_listings bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.business_name, p.shop_slug, p.avatar_url,
         p.subscription_tier, p.is_verified,
         (SELECT count(*) FROM public.listings l WHERE l.user_id = p.id AND l.status = 'approved') AS active_listings
  FROM public.profiles p
  WHERE p.shop_slug IS NOT NULL AND p.is_verified = true
  ORDER BY (SELECT count(*) FROM public.listings l WHERE l.user_id = p.id AND l.status = 'approved') DESC,
           CASE p.subscription_tier WHEN 'vip' THEN 0 WHEN 'pro' THEN 1 WHEN 'lite' THEN 2 ELSE 3 END
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.platform_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.category_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.top_vendors(int) TO anon, authenticated;

-- Unified admin revenue source. All subscription debits are stored as negative
-- amounts in wallet_transactions with tx_type='subscription'. We treat the
-- absolute value as platform revenue, single source of truth for all admin views.
CREATE OR REPLACE FUNCTION public.admin_revenue_stats()
RETURNS TABLE(
  total_revenue numeric,
  monthly_revenue numeric,
  yearly_revenue numeric,
  total_subscribers bigint,
  active_subscribers bigint,
  expired_subscribers bigint,
  lite_active bigint,
  pro_active bigint,
  vip_active bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE((SELECT sum(abs(amount)) FROM public.wallet_transactions WHERE tx_type='subscription'), 0)::numeric,
    COALESCE((SELECT sum(abs(amount)) FROM public.wallet_transactions WHERE tx_type='subscription' AND created_at >= date_trunc('month', now())), 0)::numeric,
    COALESCE((SELECT sum(abs(amount)) FROM public.wallet_transactions WHERE tx_type='subscription' AND created_at >= date_trunc('year', now())), 0)::numeric,
    (SELECT count(DISTINCT user_id) FROM public.wallet_transactions WHERE tx_type='subscription'),
    (SELECT count(*) FROM public.profiles WHERE subscription_tier <> 'free' AND subscription_until > now()),
    (SELECT count(*) FROM public.profiles WHERE subscription_tier <> 'free' AND (subscription_until IS NULL OR subscription_until <= now())),
    (SELECT count(*) FROM public.profiles WHERE subscription_tier='lite' AND subscription_until > now()),
    (SELECT count(*) FROM public.profiles WHERE subscription_tier='pro'  AND subscription_until > now()),
    (SELECT count(*) FROM public.profiles WHERE subscription_tier='vip'  AND subscription_until > now());
END $$;

GRANT EXECUTE ON FUNCTION public.admin_revenue_stats() TO authenticated;
