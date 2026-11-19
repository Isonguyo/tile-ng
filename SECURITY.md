# Security Policy

## Reporting a vulnerability

Do not publish credentials, personal data, exploit details, or reproducible attack steps in a public issue. Report suspected vulnerabilities privately to the repository maintainers and include the affected component, impact, and a safe reproduction summary.

## Credential handling

- Never commit passwords, database passwords, Supabase secret/service-role keys, JWT signing secrets, private API keys, SMTP credentials, or recovery tokens.
- Supabase publishable keys are intended for use in client applications. They do not replace Row Level Security and must not be treated as authorization.
- Store deployment secrets in the hosting provider's secret/environment-variable settings. Keep developer-specific environment files out of commits; commit only placeholder examples.
- Do not create or modify Auth users by writing directly to `auth.users` or by setting `encrypted_password` in SQL.

## Admin bootstrap

The SQL helper at `supabase/manual/001_admin_roles_and_owner_account.sql` only grants roles to an account that already exists in Supabase Auth. Create the account through Supabase Auth or an approved invitation flow, then replace the email placeholder before running the helper. The helper must not be used to set or reset an account password.

## Response to an exposed credential

Treat any credential committed to a public repository as compromised, even after the current file is corrected.

1. Rotate or reset the affected credential through the system that issued it.
2. Revoke existing sessions or tokens where the provider supports it.
3. Check authentication, audit, and application logs for unexpected use during the exposure window.
4. Remove the credential from the working tree and arrange a coordinated Git-history rewrite (for example, with `git filter-repo`) if the credential is present in earlier commits. Coordinate this with all contributors before force-pushing; collaborators will need to refresh their clones.
5. Rotate any additional credentials that were exposed alongside it.

A normal follow-up commit does not remove secrets from earlier Git objects.

## Database change controls

- Enable and review Row Level Security on every table exposed through the Data API.
- Review each `SECURITY DEFINER` function for a fixed `search_path`, explicit authorization checks, and least-privilege EXECUTE grants.
- Treat views that execute with the view owner's privileges as security-sensitive. Test visibility and grants before changing them to invoker security.
- Reconcile repository migration files with the live Supabase migration history before applying schema changes to production.
- Do not use a production schema change as a substitute for a reviewed, version-controlled migration.


## Wait-list privacy

- Wait-list profile details must never be returned from an email-only lookup.
- New members receive a random private status access key once; only its SHA-256 hash is stored in the database.
- Status lookup and account linking require the private key. Duplicate join attempts return no existing member details.
- Entries created before private keys were introduced require identity-verified recovery by an administrator using the admin-only key reissue RPC. Administrators must verify ownership out-of-band before sharing the new key.


## Published profile access

- The `public_profiles` view runs with caller permissions (SECURITY INVOKER).
- Anonymous access to `profiles` is column-limited to fields required for public shop and artisan pages. Contact, KYC and wallet fields are not granted to anonymous users.
- Public profile rows must meet marketplace launch and approval conditions. Authenticated owners and staff retain the existing private-preview RLS policy.
- Public artisan-profile RPC responses redact phone, WhatsApp and email fields. Contact endpoints independently enforce launch, approval and ownership/admin visibility.

## RPC privilege rules

- Admin RPCs must not be executable by `anon`; authenticated callers must pass an in-function administrator-role check.
- Trigger-only functions must not be directly executable through the Data API.
- SECURITY DEFINER RPCs accepting a user or record identifier must verify ownership or an explicit administrative permission.
- Test-only moderation RPCs and legacy wait-list insertion RPCs are not exposed through the Data API.
