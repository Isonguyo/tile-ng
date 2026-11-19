-- Tile security hardening phase 2: artisan contact, owner analytics and RPC privileges.

CREATE OR REPLACE FUNCTION public.get_artisan_profile(_id uuid)
RETURNS TABLE(
 id uuid, full_name text, profession text, bio text, phone text, whatsapp text, email text,
 state text, lga text, years_experience integer, is_verified boolean,
 subscription_tier public.sub_tier, subscription_until timestamp with time zone,
 starting_price numeric, is_available boolean, offers_home_service boolean,
 offers_emergency_service boolean, available_weekends boolean, profile_photo text,
 avatar_url text, portfolio_images text[], response_rate integer, response_minutes integer,
 avg_rating numeric, review_count integer, total_sales integer, artisan_status text,
 is_prelaunch boolean, created_at timestamp with time zone
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
 RETURN QUERY
 SELECT p.id,p.full_name,p.profession,p.bio,
   CASE WHEN _uid=p.id OR _is_admin THEN p.phone ELSE NULL END,
   CASE WHEN _uid=p.id OR _is_admin THEN p.whatsapp ELSE NULL END,
   CASE WHEN _uid=p.id OR _is_admin THEN u.email::text ELSE NULL END,
   p.state,p.lga,p.years_experience,p.is_verified,p.subscription_tier,p.subscription_until,
   p.starting_price,p.is_available,p.offers_home_service,p.offers_emergency_service,
   p.available_weekends,p.profile_photo,p.avatar_url,p.portfolio_images,p.response_rate,
   p.response_minutes,p.avg_rating,p.review_count,p.total_sales,p.artisan_status,
   p.is_prelaunch,p.created_at
 FROM public.profiles p LEFT JOIN auth.users u ON u.id=p.id
 WHERE p.id=_id AND p.is_artisan=true
   AND (_uid=p.id OR _is_admin OR (
     public.is_marketplace_launched()
     AND p.artisan_status='approved' AND p.is_prelaunch=false
   ));
END;
$function$;

CREATE OR REPLACE FUNCTION public.owner_listing_stats_v2(p_listing_id uuid)
RETURNS TABLE(impressions bigint,views bigint,saves bigint,chats bigint,phone_clicks bigint,whatsapp_clicks bigint,shares bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT
   count(*) FILTER(WHERE e.event_type='impression'),
   count(*) FILTER(WHERE e.event_type='view'),
   count(*) FILTER(WHERE e.event_type='save'),
   count(*) FILTER(WHERE e.event_type='chat'),
   count(*) FILTER(WHERE e.event_type='phone'),
   count(*) FILTER(WHERE e.event_type='whatsapp'),
   count(*) FILTER(WHERE e.event_type='share')
 FROM public.listing_events e
 WHERE e.listing_id=p_listing_id
 AND EXISTS (
   SELECT 1 FROM public.listings l
   WHERE l.id=p_listing_id
     AND (l.user_id=auth.uid() OR public.has_role(auth.uid(),'admin'))
 );
$function$;
REVOKE ALL ON FUNCTION public.owner_listing_stats_v2(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owner_listing_stats_v2(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT auth.uid() IS NOT NULL
   AND _user_id=auth.uid()
   AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role=_role);
$function$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO anon,authenticated,service_role;

DO $$
DECLARE _fn regprocedure;
BEGIN
 FOR _fn IN
   SELECT p.oid::regprocedure FROM pg_proc p
   JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname LIKE 'admin\_%' ESCAPE '\' AND p.prosecdef
 LOOP
   EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',_fn);
   EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role',_fn);
 END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_listing_quota() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.increment_waitlist_referrals() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.set_waitlist_referral_fields() FROM PUBLIC,anon,authenticated;

ALTER FUNCTION public.track_artisan_event(uuid,text) SET search_path TO 'public';
ALTER FUNCTION public.track_listing_event(uuid,text) SET search_path TO 'public';
ALTER FUNCTION public.tile_founding_plan(integer) SET search_path TO 'public';
