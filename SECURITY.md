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
