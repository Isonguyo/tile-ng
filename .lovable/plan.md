This is roughly 40+ files and 6 migrations. Shipping it in one turn will fail — a single bad hunk can cascade and blank the app for you. I'll deliver it in 4 tight, self-contained phases in this session. Each phase compiles and runs on its own, so if we stop between phases nothing is broken.

## Phase 1 — Foundation (backend + shared UI)

Migration:
- `subscription_plans` table (tier, price, max_goods, max_services, can_shop, can_promote, can_ai_desc, can_vanity_slug, boost_credits) + seed rows for free/lite/pro/vip.
- `get_plan_limits(uid)` RPC returning the caller's effective limits + current usage counts.
- `search_logs` table (query, location, category, user_id) + `log_search` RPC + `trending_searches(_days,_limit)` RPC.
- `shop_follows` table + `toggle_follow_shop` RPC + `shop_follower_count` view.
- `audit_logs` table + `log_admin_action` RPC, backfilled into existing admin_* functions.
- `typing_indicators` (chat_id,user_id,updated_at) + realtime publication add for `listings`, `messages`, `typing_indicators`, `notifications`.
- `chat_pins` table for pinned conversations.
- Grants + RLS on every new table.

Shared UI:
- `src/components/feature-gate.tsx` — reads plan limits via TanStack Query, renders children or upgrade CTA.
- `src/components/usage-bar.tsx` — used/limit progress with color states.
- `src/hooks/use-plan.ts`.

## Phase 2 — Homepage + Auth split

Homepage (`src/routes/index.tsx` refactor):
- Rotating placeholder in hero search (8 rotating strings, 3s interval).
- Sticky search bar (IntersectionObserver on hero).
- Animated counters bound to `platform_stats` (rAF tween).
- Trending chips from `trending_searches` RPC.
- Live activity feed: realtime subscribe to `listings` INSERT + `profiles` INSERT (new shops), sliding 10-item list.
- "Near you" sort using geolocation → nearest state fallback.

Auth split (replace single `/auth`):
- `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` routes.
- Zod schemas, react-hook-form, password strength meter (zxcvbn-lite scoring), account-type radio (buyer/merchant/artisan) stored in `profiles.account_type`.
- Friendly Supabase error mapping helper.
- Keep `/auth` as redirect to `/login` for existing links.

## Phase 3 — Post-ad, Dashboard, Shop

Post-ad wizard (`src/routes/post-ad.tsx`):
- Step 0: choice cards (Sell a Good / Offer a Service / Open a Shop — shop card `<FeatureGate plan="lite">`).
- Live quota banner (used/limit from `get_plan_limits`).
- Drag-reorder images (`@dnd-kit/sortable`).
- Preview step before submit.
- "Generate description" button → Lovable AI Gateway (google/gemini-2.5-flash) server fn `src/lib/ai.functions.ts`.

Dashboard:
- Plan card with usage bars for goods/services/boosts.
- Wrap "Promote", "Open shop", "Vanity slug", "AI descriptions" in `<FeatureGate>`.
- Smart upgrade prompt modal when a gated action is clicked.

Shop page (`/shop/$slug`):
- Follow/unfollow button + follower count.
- Achievements strip (verified, 10+ sales, 4.5★, 90-day veteran) computed from profile.
- Reviews: allow photo upload (existing `shop_reviews` + new `shop_review_photos` bucket).
- Sort/filter (newest, price, rating) on listings tab.
- Sticky mobile action bar (Call / WhatsApp / Chat / Follow).

## Phase 4 — Messaging, Admin, Artisans

Messaging (`/messages` + `/messages/$chatId`):
- Tab filters (All / Buying / Selling / Unread) + search.
- Pin via `chat_pins`.
- Typing indicator (writes to `typing_indicators` every 2s while composing; realtime subscribe).
- Read-receipt ticks (single / double / double-blue) from existing `read_at`.
- Image + voice attachments to `messages` bucket (new bucket).
- Share-listing card message type (`message_type` enum: text/image/voice/listing).

Admin operations center (`/admin` refactor):
- Sidebar layout (`Sidebar` shadcn) with modules: Overview, Moderation, Users, Reports, Monetization, Audit, Codes, Sub-admins.
- Live activity feed (realtime on `audit_logs`).
- Audit log table with filters.
- Role-based sub-admins: extend `app_role` enum with `moderator`, `finance`; per-module access via `has_role` gates. Owner-admin can grant roles.
- Reports center (existing `notifications` + a new `reports` table for user-submitted reports).
- AI risk score column on pending listings (placeholder heuristic: image count, price outlier, new-account age, keyword blacklist).

Artisans (`/artisans` new route):
- Real search + filters (profession, state, availability, price range).
- Trust score derived from KYC, rating, response time, completed jobs.
- Portfolio grid.
- Availability toggle + weekly schedule.
- Map view via Google Maps connector (I'll request connection when we reach it).

## Technical notes

- All RPCs `SECURITY DEFINER`, `search_path=public`, `GRANT EXECUTE TO authenticated`.
- New tables: RLS on, policies scoped to `auth.uid()`, service_role grant.
- Realtime: single `useEffect` subscription per feature, cleanup on unmount.
- No hardcoded data anywhere — every list reads from a table or RPC.
- Server fns under `src/lib/*.functions.ts`, admin ones import `client.server` inside the handler.
- Type-safe navigation everywhere (no href interpolation).

## What I need from you

1. Approve this phased approach so I can start Phase 1 immediately.
2. Confirm we can add `@dnd-kit/core @dnd-kit/sortable` and `zxcvbn-ts` as dependencies.
3. Map view needs the Google Maps connector — okay to prompt you to connect it when we hit Phase 4?

Say "go" and I'll ship Phase 1 (migration + shared components) in the next turn, then roll straight into Phase 2, 3, 4 as separate turns.