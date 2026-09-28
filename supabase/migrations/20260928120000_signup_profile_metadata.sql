-- Preserve the signup form's non-auth fields on the user's public profile.
-- Email and password remain managed securely by Supabase Auth.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'buyer'
    CHECK (account_type IN ('buyer', 'merchant', 'artisan')),
  ADD COLUMN IF NOT EXISTS is_merchant BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_artisan BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _account_type TEXT;
BEGIN
  _account_type := CASE NEW.raw_user_meta_data->>'account_type'
    WHEN 'merchant' THEN 'merchant'
    WHEN 'artisan' THEN 'artisan'
    ELSE 'buyer'
  END;

  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    business_name,
    account_type,
    is_merchant,
    is_artisan
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'phone_number'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'business_name'), ''),
    _account_type,
    _account_type = 'merchant',
    _account_type = 'artisan'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;
