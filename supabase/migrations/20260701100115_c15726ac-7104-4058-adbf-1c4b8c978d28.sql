
-- =====================================================================
-- PHASE 1 — FOUNDATION
-- =====================================================================

-- ---------- account_type on profiles ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='account_type') THEN
    ALTER TABLE public.profiles ADD COLUMN account_type TEXT NOT NULL DEFAULT 'buyer' CHECK (account_type IN ('buyer','merchant','artisan'));
  END IF;
END $$;

-- ---------- subscription_plans ----------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  tier            sub_tier PRIMARY KEY,
  display_name    TEXT NOT NULL,
  price_ngn       NUMERIC NOT NULL DEFAULT 0,
  max_goods       INT NOT NULL DEFAULT 5,
  max_services    INT NOT NULL DEFAULT 1,
  can_shop        BOOLEAN NOT NULL DEFAULT false,
  can_promote     BOOLEAN NOT NULL DEFAULT false,
  can_ai_desc     BOOLEAN NOT NULL DEFAULT false,
  can_vanity_slug BOOLEAN NOT NULL DEFAULT false,
  boost_credits   INT NOT NULL DEFAULT 0,
  features        TEXT[] NOT NULL DEFAULT '{}'
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans public read" ON public.subscription_plans;
CREATE POLICY "plans public read" ON public.subscription_plans FOR SELECT USING (true);

INSERT INTO public.subscription_plans(tier,display_name,price_ngn,max_goods,max_services,can_shop,can_promote,can_ai_desc,can_vanity_slug,boost_credits,features) VALUES
  ('free','Starter',0,5,1,false,false,false,false,0, ARRAY['Post up to 5 goods','1 service listing','Standard visibility']),
  ('lite','Lite',5000,15,5,true,true,true,false,2, ARRAY['Personal shop','15 goods / 5 services','2 promotions/month','AI descriptions']),
  ('pro','Pro',15000,50,20,true,true,true,true,10, ARRAY['Vanity shop URL','50 goods / 20 services','10 promotions/month','Priority support']),
  ('vip','VIP',40000,999,999,true,true,true,true,50, ARRAY['Unlimited listings','50 promotions/month','Homepage feature','Dedicated manager'])
ON CONFLICT (tier) DO UPDATE SET
  display_name=EXCLUDED.display_name, price_ngn=EXCLUDED.price_ngn,
  max_goods=EXCLUDED.max_goods, max_services=EXCLUDED.max_services,
  can_shop=EXCLUDED.can_shop, can_promote=EXCLUDED.can_promote,
  can_ai_desc=EXCLUDED.can_ai_desc, can_vanity_slug=EXCLUDED.can_vanity_slug,
  boost_credits=EXCLUDED.boost_credits, features=EXCLUDED.features;

CREATE OR REPLACE FUNCTION public.get_plan_limits()
RETURNS TABLE(
  tier sub_tier, display_name TEXT, price_ngn NUMERIC,
  max_goods INT, max_services INT,
  can_shop BOOLEAN, can_promote BOOLEAN, can_ai_desc BOOLEAN, can_vanity_slug BOOLEAN,
  boost_credits INT, features TEXT[],
  used_goods BIGINT, used_services BIGINT,
  active_until TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _tier sub_tier; _until TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT p.subscription_tier, p.subscription_until INTO _tier, _until
    FROM public.profiles p WHERE p.id = auth.uid();
  IF _tier IS NULL OR (_until IS NOT NULL AND _until <= now()) THEN _tier := 'free'; END IF;
  RETURN QUERY
    SELECT sp.tier, sp.display_name, sp.price_ngn,
           sp.max_goods, sp.max_services,
           sp.can_shop, sp.can_promote, sp.can_ai_desc, sp.can_vanity_slug,
           sp.boost_credits, sp.features,
           (SELECT count(*) FROM public.listings l WHERE l.user_id=auth.uid() AND l.type='goods'   AND l.status IN ('pending','approved')),
           (SELECT count(*) FROM public.listings l WHERE l.user_id=auth.uid() AND l.type='service' AND l.status IN ('pending','approved')),
           _until
    FROM public.subscription_plans sp WHERE sp.tier=_tier;
END $$;
REVOKE EXECUTE ON FUNCTION public.get_plan_limits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_plan_limits() TO authenticated;

-- ---------- search_logs ----------
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  location TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_logs_created_idx ON public.search_logs(created_at DESC);
GRANT SELECT, INSERT ON public.search_logs TO authenticated;
GRANT INSERT ON public.search_logs TO anon;
GRANT ALL ON public.search_logs TO service_role;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "search_logs insert any" ON public.search_logs;
CREATE POLICY "search_logs insert any" ON public.search_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "search_logs admin read" ON public.search_logs;
CREATE POLICY "search_logs admin read" ON public.search_logs FOR SELECT USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.log_search(_q TEXT, _loc TEXT DEFAULT NULL, _cat TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.search_logs(user_id,query,location,category)
  SELECT auth.uid(), trim(_q), _loc, _cat WHERE coalesce(length(trim(_q)),0) BETWEEN 2 AND 80;
$$;
REVOKE EXECUTE ON FUNCTION public.log_search(TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_search(TEXT,TEXT,TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.trending_searches(_days INT DEFAULT 7, _limit INT DEFAULT 10)
RETURNS TABLE(query TEXT, hits BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT lower(query) AS query, count(*)::bigint AS hits
  FROM public.search_logs
  WHERE created_at >= now() - (_days || ' days')::interval AND length(query) >= 2
  GROUP BY lower(query)
  ORDER BY hits DESC, query
  LIMIT _limit;
$$;
REVOKE EXECUTE ON FUNCTION public.trending_searches(INT,INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trending_searches(INT,INT) TO anon, authenticated;

-- ---------- shop_follows ----------
CREATE TABLE IF NOT EXISTS public.shop_follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, shop_id),
  CHECK (follower_id <> shop_id)
);
CREATE INDEX IF NOT EXISTS shop_follows_shop_idx ON public.shop_follows(shop_id);
GRANT SELECT, INSERT, DELETE ON public.shop_follows TO authenticated;
GRANT ALL ON public.shop_follows TO service_role;
ALTER TABLE public.shop_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows self read" ON public.shop_follows;
CREATE POLICY "follows self read" ON public.shop_follows FOR SELECT USING (follower_id = auth.uid() OR shop_id = auth.uid());
DROP POLICY IF EXISTS "follows self write" ON public.shop_follows;
CREATE POLICY "follows self write" ON public.shop_follows FOR INSERT WITH CHECK (follower_id = auth.uid());
DROP POLICY IF EXISTS "follows self delete" ON public.shop_follows;
CREATE POLICY "follows self delete" ON public.shop_follows FOR DELETE USING (follower_id = auth.uid());

CREATE OR REPLACE FUNCTION public.toggle_follow_shop(_shop_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _exists INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _shop_id = auth.uid() THEN RAISE EXCEPTION 'Cannot follow yourself'; END IF;
  DELETE FROM public.shop_follows WHERE follower_id=auth.uid() AND shop_id=_shop_id;
  GET DIAGNOSTICS _exists = ROW_COUNT;
  IF _exists > 0 THEN RETURN false; END IF;
  INSERT INTO public.shop_follows(follower_id,shop_id) VALUES (auth.uid(),_shop_id);
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.toggle_follow_shop(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_follow_shop(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.shop_follower_count(_shop_id UUID)
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT count(*)::bigint FROM public.shop_follows WHERE shop_id=_shop_id;
$$;
REVOKE EXECUTE ON FUNCTION public.shop_follower_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shop_follower_count(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_following_shop(_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.shop_follows WHERE follower_id=auth.uid() AND shop_id=_shop_id);
$$;
REVOKE EXECUTE ON FUNCTION public.is_following_shop(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_following_shop(UUID) TO authenticated;

-- ---------- audit_logs ----------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_created_idx ON public.audit_logs(created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit admin read" ON public.audit_logs;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.log_admin_action(_action TEXT, _entity TEXT DEFAULT NULL, _entity_id UUID DEFAULT NULL, _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _name TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RETURN; END IF;
  SELECT full_name INTO _name FROM public.profiles WHERE id=auth.uid();
  INSERT INTO public.audit_logs(actor_id,actor_name,action,entity,entity_id,metadata)
    VALUES (auth.uid(), _name, _action, _entity, _entity_id, coalesce(_metadata,'{}'::jsonb));
END $$;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(TEXT,TEXT,UUID,JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT,TEXT,UUID,JSONB) TO authenticated;

-- ---------- typing_indicators ----------
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.typing_indicators TO authenticated;
GRANT ALL ON public.typing_indicators TO service_role;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "typing participants read" ON public.typing_indicators;
CREATE POLICY "typing participants read" ON public.typing_indicators FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.chats c WHERE c.id=chat_id AND (c.buyer_id=auth.uid() OR c.seller_id=auth.uid()))
);
DROP POLICY IF EXISTS "typing self upsert" ON public.typing_indicators;
CREATE POLICY "typing self upsert" ON public.typing_indicators FOR INSERT WITH CHECK (user_id=auth.uid());
DROP POLICY IF EXISTS "typing self update" ON public.typing_indicators;
CREATE POLICY "typing self update" ON public.typing_indicators FOR UPDATE USING (user_id=auth.uid());
DROP POLICY IF EXISTS "typing self delete" ON public.typing_indicators;
CREATE POLICY "typing self delete" ON public.typing_indicators FOR DELETE USING (user_id=auth.uid());

-- ---------- chat_pins ----------
CREATE TABLE IF NOT EXISTS public.chat_pins (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chat_id)
);
GRANT SELECT, INSERT, DELETE ON public.chat_pins TO authenticated;
GRANT ALL ON public.chat_pins TO service_role;
ALTER TABLE public.chat_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pins self" ON public.chat_pins;
CREATE POLICY "pins self" ON public.chat_pins FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

-- ---------- reports ----------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing','user','shop','message')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports own insert" ON public.reports;
CREATE POLICY "reports own insert" ON public.reports FOR INSERT WITH CHECK (reporter_id=auth.uid());
DROP POLICY IF EXISTS "reports admin read" ON public.reports;
CREATE POLICY "reports admin read" ON public.reports FOR SELECT USING (public.has_role(auth.uid(),'admin') OR reporter_id=auth.uid());
DROP POLICY IF EXISTS "reports admin update" ON public.reports;
CREATE POLICY "reports admin update" ON public.reports FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.submit_report(_type TEXT, _id UUID, _reason TEXT, _details TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _new UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.reports(reporter_id,entity_type,entity_id,reason,details)
    VALUES (auth.uid(), _type, _id, _reason, _details) RETURNING id INTO _new;
  RETURN _new;
END $$;
REVOKE EXECUTE ON FUNCTION public.submit_report(TEXT,UUID,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_report(TEXT,UUID,TEXT,TEXT) TO authenticated;

-- ---------- Realtime publication ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='typing_indicators') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='audit_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='listings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
