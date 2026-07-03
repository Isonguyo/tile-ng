
-- 1. Enable RLS on public reference tables (cities, lgas, states) with public read
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cities public read" ON public.cities FOR SELECT USING (true);
CREATE POLICY "lgas public read"  ON public.lgas  FOR SELECT USING (true);
CREATE POLICY "states public read" ON public.states FOR SELECT USING (true);

-- 2. Tighten search_logs INSERT WITH CHECK (no longer WITH CHECK (true))
DROP POLICY IF EXISTS "search_logs insert any" ON public.search_logs;
CREATE POLICY "search_logs insert own" ON public.search_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 3. Revoke EXECUTE from anon on SECURITY DEFINER functions that require auth
REVOKE EXECUTE ON FUNCTION public.admin_pending_listings()             FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_approve_listing(uuid)          FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_reject_listing(uuid, text)     FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_flag_seller(uuid)              FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_list_pending_kyc()             FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_generate_invite_code()         FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_list_invite_codes()            FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_list_users()                   FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_revenue_stats()                FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.topup_wallet(numeric, text)          FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_profile()                     FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_vanity_slug(text)                FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.activate_subscription(sub_tier)      FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_notifications_read()            FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_chat_read(uuid)                 FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ensure_chat(uuid)                    FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.my_chats()                           FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.submit_report(text, uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_following_shop(uuid)              FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.toggle_follow_shop(uuid)             FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_admin_code(text)              FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.owner_listing_stats(uuid)            FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.renew_listing(uuid)                  FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_post_quota(listing_type)       FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_plan_limits()                    FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.shop_contact(text)                   FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.expire_old_listings()                FROM anon, public;

GRANT EXECUTE ON FUNCTION public.admin_pending_listings()              TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_listing(uuid)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_listing(uuid, text)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_flag_seller(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_kyc()              TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_generate_invite_code()          TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_invite_codes()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revenue_stats()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.topup_wallet(numeric, text)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_vanity_slug(text)                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_subscription(sub_tier)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_chat_read(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_chat(uuid)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_chats()                            TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_report(text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_following_shop(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_follow_shop(uuid)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_admin_code(text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_listing_stats(uuid)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.renew_listing(uuid)                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_post_quota(listing_type)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_plan_limits()                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.shop_contact(text)                    TO authenticated;

-- 4. Column-level SELECT for anon — hide sensitive contact/financial fields
-- artisan_profiles: hide phone, whatsapp, email from anon
REVOKE SELECT ON public.artisan_profiles FROM anon;
GRANT SELECT (
  id, user_id, slug, full_name, profession, bio, state, lga,
  years_experience, is_verified, is_available, average_rating,
  total_reviews, profile_photo, created_at, updated_at
) ON public.artisan_profiles TO anon;

-- listings: hide phone from anon
REVOKE SELECT ON public.listings FROM anon;
GRANT SELECT (
  id, user_id, type, category, title, description, price, condition, brand,
  years_experience, service_mode, location, images, status, is_promoted,
  rejection_reason, created_at, updated_at, expires_at, renewed_count,
  views_count, clicks_count
) ON public.listings TO anon;

-- profiles: hide sensitive fields from anon; anon only sees safe shop columns
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, full_name, avatar_url, is_verified, location, created_at, updated_at,
  business_name, whatsapp, state, lga, bio, shop_slug, subscription_tier,
  total_sales, avg_rating, response_minutes, portfolio_images, profession,
  years_experience, starting_price, is_available, offers_home_service,
  offers_emergency_service, available_weekends, profile_photo, response_rate,
  is_artisan, service_radius, travels_outside_lga, account_type, is_merchant
) ON public.profiles TO anon;
-- Note: phone, wallet_balance, kyc_status, kyc_doc_url, bank_name,
-- bank_account, bank_account_name, subscription_until, portfolio_url
-- are intentionally excluded from anon SELECT.
-- 'whatsapp' remains public for shop contact discovery; adjust if needed.
