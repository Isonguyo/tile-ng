# Tile: Supabase Project Migration — Audit & Plan

## Blocker before any execution

Only ONE backend is connected to this project right now: the current Lovable Cloud–managed
database (the source). No second/destination project is visible to my tools, and Lovable Cloud
projects expose exactly one managed backend at a time. Nothing can be copied until we settle this.

I need one of these from you:
- **Option A (recommended for a Lovable Cloud app):** stay on the managed backend. It is already
  permanent and backed up; no migration needed. Zero risk.
- **Option B:** you own the destination project (your own Supabase account). Then I need its
  connection details as secrets: destination `DB URL` (direct, not pooler), `SERVICE_ROLE_KEY`,
  `PROJECT_URL`, `PUBLISHABLE/ANON KEY`. I will use them only from server-side scripts.
- **Option C:** switch the whole app to the Supabase Integration (BYO account). That replaces the
  managed backend wiring and is itself a one-way step for this project.

No destructive operation, env change, or disconnect will happen until you pick.

## Audit of the source database

### Schema
- **30 public tables:** admin_invite_codes, artisan_events, artisan_portfolio, artisan_profiles,
  artisan_reviews, artisan_skills, audit_logs, chat_pins, chats, cities, favorites, lgas,
  listing_events, listings, messages, notifications, platform_settings, profiles, promotion_plans,
  promotion_purchases, reports, reviews, search_logs, shop_follows, shop_reviews, states,
  subscription_history, subscription_plans, typing_indicators, user_roles, wallet_transactions.
- **7 enums:** app_role, listing_type, listing_status, item_condition, service_mode, kyc_status, sub_tier.
- **57 indexes**, PK/FK constraints across all tables. Most user-owned tables FK to `auth.users.id`.
- **60 functions/RPCs** (36 called directly from the frontend), incl. subscriptions
  (activate_subscription, get_plan_limits), listings/quota (enforce_listing_quota, renew_listing,
  promote_listing, expire_old_listings), chat (ensure_chat, my_chats, mark_chat_read), analytics
  (track_listing_event, track_artisan_event, owner_listing_stats_v2, dashboard_stats,
  merchant_health_score), wallet (topup_wallet), shops (top_vendors, shop_contact, gen_shop_slug),
  and 18 admin/moderation functions.
- **7 triggers:** on_auth_user_created (auth.users → profiles + default role), profiles_updated,
  listings_updated, msg_notify, guard_listing_moderation, shop_reviews_touch,
  trg_enforce_listing_quota.
- **66 RLS policies** on public tables, **9 policies** on storage.objects.
- **Extensions:** pgcrypto, uuid-ossp, pg_cron (scheduled listing expiry), pg_stat_statements,
  supabase_vault.

### Data volume (source)
users 17 · profiles 17 · user_roles 21 · listings 9 · chats 15 · messages 26 · favorites 5 ·
notifications 61 · listing_events 65 · wallet_transactions 17 · search_logs 5 · shop_reviews 1 ·
admin_invite_codes 6 · subscription_plans 4 · promotion_plans 6 · platform_settings 1 ·
states 37 · lgas 773 · cities 0. Artisan tables, reports, audit_logs, subscription_history,
promotion_purchases, typing_indicators, chat_pins: 0 rows.

### Storage
- `listings` (public): 88 objects, ~30 MB — listing images, shop banners, portfolio images.
- `kyc` (private): 2 objects, ~377 kB — identity documents.

### Auth
- 17 users, with identities rows (email/password + Google via the Lovable OAuth broker),
  sessions, refresh tokens.
- Frontend auth surface: `/login`, `/signup`, `/forgot-password`, `/reset-password`,
  `/verify-email`, Google sign-in through `@lovable.dev/cloud-auth-js`.

### Code references
- No hardcoded project ref anywhere in `src/` — everything reads env vars in
  `.env` / `src/integrations/supabase/*`. 29 modules import the generated client.
- Auto-generated files that must be regenerated (not hand-edited) against the destination:
  `src/integrations/supabase/{client.ts,client.server.ts,auth-middleware.ts,auth-attacher.ts,types.ts}`,
  `supabase/config.toml`, `.env`.

## Risks found
1. **Auth users do not migrate by copying rows.** `auth.users`/`auth.identities` are only movable
   via the Auth Admin API with password-hash import, and that requires service-role access on both
   sides. Google identities must keep the same `provider_id` (Google sub) or those users get new
   UUIDs and lose every listing/chat/wallet link. This is the single highest-risk item.
2. **Password hashes** may not be exportable on a managed project. If not, every email/password
   user must go through a forced password reset. Needs your explicit sign-off.
3. **UUID preservation** requires inserting `auth.users` FIRST, then public tables with FKs
   disabled/deferred, then re-enabling triggers (`on_auth_user_created` must be disabled during
   import or it will create duplicate profiles).
4. **Storage paths** are user-id-scoped (`{userId}/{uuid}.ext`); they survive only if user UUIDs
   survive. KYC files are sensitive — copy over a server-side script, never through the browser.
5. **pg_cron jobs** do not travel with a schema dump; must be recreated on the destination.
6. **Lovable Cloud managed Google OAuth** is tied to the managed project. On a BYO destination you
   must supply your own Google OAuth client ID/secret and re-add redirect URLs.
7. **Pre-existing bug, unrelated to migration:** the inbox pin button calls `toggle_chat_pin`,
   which does not exist in the database, and `my_chats` does not return `pinned_at`. Worth fixing
   before or after, not during, the migration.
8. **Vercel deployment** carries its own env vars; it will keep pointing at the old project until
   updated separately.

## Migration checklist (execution order, once a destination exists)
1. Freeze writes: enable maintenance mode via `admin_update_platform_settings`.
2. Snapshot source: schema DDL + per-table CSV exports + row-count manifest.
3. Destination schema: extensions → enums → tables → constraints → indexes → functions →
   triggers → RLS policies → grants.
4. Auth import first: users + identities with preserved UUIDs and Google `provider_id`
   (**pause here for your confirmation — irreversible**).
5. Data import in FK order with `on_auth_user_created` and quota/moderation triggers disabled,
   sequences/defaults untouched, then re-enable triggers.
6. Storage: recreate `listings` (public) and `kyc` (private) buckets + the 9 object policies,
   then stream all 90 objects preserving exact paths.
7. Recreate pg_cron schedule for `expire_old_listings`.
8. Verify: row-count diff source vs destination for all 30 tables, object-count diff per bucket,
   FK orphan check, RLS smoke tests as anon / authenticated / admin.
9. Cutover: regenerate the client integration files + env for the destination; redeploy; update
   Vercel env vars.
10. Post-cutover verification: Google login, email/password login, email verification, password
    reset, profile load, listing create/approve, listing images, artisan profile + portfolio,
    chat + messages + realtime, favorites, subscription activation, wallet top-up, analytics
    RPCs, admin dashboard, storage read/write.
11. Keep the old project untouched and read-only for a rollback window (suggest 14 days).

## What I will NOT do
No changes to `.env`, no disconnect, no deletes on the source, no Auth writes — until you confirm
the destination and explicitly approve step 4.
