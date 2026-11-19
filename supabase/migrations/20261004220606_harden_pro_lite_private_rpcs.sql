
CREATE OR REPLACE FUNCTION public.touch_support_ticket()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION public.create_support_ticket(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(text,text,text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_support_tickets() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_support_tickets() TO authenticated;

REVOKE ALL ON FUNCTION public.get_support_ticket(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_support_ticket(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.add_support_message(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_support_message(uuid,text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_list_support_tickets(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_support_tickets(text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_support_ticket_status(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_support_ticket_status(uuid,text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_customer_inquiry_dashboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_customer_inquiry_dashboard(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_vendor_analytics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_vendor_analytics(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.support_priority_for_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_priority_for_user(uuid) TO authenticated;
