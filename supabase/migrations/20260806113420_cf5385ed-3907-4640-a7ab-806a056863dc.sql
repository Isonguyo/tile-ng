-- 1. Remove legacy invite-code system
DROP FUNCTION IF EXISTS public.admin_generate_invite_code();
DROP FUNCTION IF EXISTS public.admin_list_invite_codes();
DROP FUNCTION IF EXISTS public.redeem_admin_code(text);
DROP TABLE IF EXISTS public.admin_invite_codes;

-- 2. Seed the single owner admin account
DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = 'princewillisonguyo@gmail.com';

  IF _uid IS NULL THEN
    _uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', _uid, 'authenticated', 'authenticated',
      'princewillisonguyo@gmail.com',
      extensions.crypt('TiLe$098Gh23Bc', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Tile Owner"}'::jsonb,
      now(), now()
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), _uid, _uid::text,
      jsonb_build_object('sub', _uid::text, 'email', 'princewillisonguyo@gmail.com', 'email_verified', true),
      'email', now(), now(), now());
  ELSE
    UPDATE auth.users
      SET encrypted_password = extensions.crypt('TiLe$098Gh23Bc', extensions.gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = _uid;
  END IF;

  INSERT INTO public.profiles (id, full_name) VALUES (_uid, 'Tile Owner') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'user') ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 3. Role management for admins
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