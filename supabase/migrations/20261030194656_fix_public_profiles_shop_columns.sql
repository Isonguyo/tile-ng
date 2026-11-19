create or replace view public.public_profiles as
select
  id,
  full_name,
  avatar_url,
  profile_photo,
  profession,
  state,
  lga,
  is_artisan,
  years_experience,
  bio,
  starting_price,
  business_name,
  is_verified,
  shop_slug,
  portfolio_images,
  created_at
from public.profiles
where
  (is_artisan = true and artisan_status = 'approved' and is_prelaunch = false)
  or
  (is_artisan = false and is_prelaunch = false and shop_slug is not null);