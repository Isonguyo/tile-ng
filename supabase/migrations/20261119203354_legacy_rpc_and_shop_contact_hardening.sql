-- Disable legacy/test RPC paths and scope merchant contact visibility.
REVOKE ALL ON FUNCTION public.join_waitlist(text,text,text,text,text,text,text,text)
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.test_admin_moderation_queue(uuid)
 FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.shop_contact(_slug text)
RETURNS TABLE(phone text,whatsapp text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 RETURN QUERY SELECT p.phone,p.whatsapp
 FROM public.profiles p
 WHERE p.shop_slug=_slug AND p.shop_slug IS NOT NULL
 AND (
  (public.is_marketplace_launched() AND p.is_merchant IS TRUE
   AND p.shop_status='approved' AND p.is_prelaunch=false)
  OR p.id=auth.uid()
  OR public.has_role(auth.uid(),'admin')
 );
END;
$function$;
REVOKE ALL ON FUNCTION public.shop_contact(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.shop_contact(text) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.support_priority_for_user(_uid uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT CASE public.tile_user_effective_tier(_uid)
  WHEN 'vip' THEN 'urgent' WHEN 'pro' THEN 'high'
  WHEN 'lite' THEN 'high' ELSE 'normal'
 END
 WHERE _uid=auth.uid() OR public.has_role(auth.uid(),'admin');
$function$;
REVOKE ALL ON FUNCTION public.support_priority_for_user(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.support_priority_for_user(uuid) TO authenticated,service_role;
