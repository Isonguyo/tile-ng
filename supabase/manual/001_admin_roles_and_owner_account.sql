-- ════════════════════════════════════════════════════════════════
-- Tile — Admin owner account + role management
-- Run this ONCE in the SQL Editor of your fresh Supabase project,
-- AFTER the full schema file (tables, enums, RLS) has been applied.
-- ════════════════════════════════════════════════════════════════

-- 1. Remove the legacy one-time invite-code system ----------------
DROP FUNCTION IF EXISTS public.admin_generate_invite_code();
DROP FUNCTION IF EXISTS public.admin_list_invite_codes();
DROP FUNCTION IF EXISTS public.redeem_admin_code(text);
DROP TABLE IF EXISTS public.admin_invite_codes;

-- 2. Grant the owner admin role to an EXISTING Supabase Auth account.
--    Before running this script:
--      1. Create the account through Supabase Auth (Dashboard or approved invite flow).
--      2. Replace the placeholder below with that account's email address.
--    This script never creates Auth users, sets passwords, or edits auth.users.
DO $$
DECLARE
  _owner_email text := 'REPLACE_WITH_EXISTING_AUTH_USER_EMAIL';
  _uid uuid;
BEGIN
  IF _owner_email = 'REPLACE_WITH_EXISTING_AUTH_USER_EMAIL'
     OR position('@' IN _owner_email) = 0 THEN
    RAISE EXCEPTION 'Set _owner_email to the email of an existing Supabase Auth user before running this script';
  END IF;

  SELECT id
    INTO _uid
    FROM auth.users
   WHERE lower(email) = lower(trim(_owner_email));

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'No Auth user exists for the supplied email. Create the account through Supabase Auth first.';
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (_uid, 'Tile Owner')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 3. Role management RPCs used by the Admin Cabin -----------------
CREATE OR REPLACE FUNCTION public.admin_list_staff()
RETURNS TABLE(user_id uuid, full_name text, email text, roles text[], created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, u.email::text,
           ARRAY(SELECT r.role::text FROM public.user_roles r WHERE r.user_id = p.id AND r.role <> 'user' ORDER BY r.role::text),
           p.created_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role <> 'user')
    ORDER BY p.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.admin_search_users(_q text)
RETURNS TABLE(user_id uuid, full_name text, email text, roles text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF coalesce(length(trim(_q)), 0) < 2 THEN RETURN; END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, u.email::text,
           ARRAY(SELECT r.role::text FROM public.user_roles r WHERE r.user_id = p.id ORDER BY r.role::text)
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.full_name ILIKE '%' || trim(_q) || '%' OR u.email ILIKE '%' || trim(_q) || '%'
    ORDER BY p.created_at DESC
    LIMIT 20;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role app_role, _grant boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _role = 'user' THEN RAISE EXCEPTION 'The base user role cannot be changed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN RAISE EXCEPTION 'User not found'; END IF;

  IF _grant THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role) ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.notifications(user_id, title, body, link)
      VALUES (_user_id, 'Role granted', 'You have been granted the ' || _role::text || ' role on Tile.', '/admin');
  ELSE
    IF _role = 'admin' AND _user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot remove your own admin role'; END IF;
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  END IF;

  PERFORM public.log_admin_action(CASE WHEN _grant THEN 'grant_role' ELSE 'revoke_role' END, 'user', _user_id,
    jsonb_build_object('role', _role::text));
END $$;

REVOKE ALL ON FUNCTION public.admin_list_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_search_users(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, app_role, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role, boolean) TO authenticated;
