# Security

## Identity and organization isolation

The multi-tenant release replaces the public demo policies. Every property, asset, work order and audit entry has a required `tenant_id`. Supabase Auth identifies the user; `tenant_members` supplies their organization role. RLS checks membership on every read and write, including direct Data API requests. A selected organization cookie is a navigation preference, never an authorization credential.

Anonymous users cannot read or mutate maintenance tables. User-editable Auth metadata, submitted reporter names and `x-actor-name` headers do not grant privileges. Reporters and audit actors come from the authenticated identity and organization membership. Server actions use the user's cookie-backed Supabase session and public key; they do not bypass RLS with a service key.

## Roles

| Role | Properties and assets | Work orders | Membership |
|---|---|---|---|
| admin | Create, read, edit, delete | Report, edit, assign, start, resolve, delete | Add existing verified users with a chosen role |
| building_manager | Create, read, edit, delete | Report, edit, assign, start, resolve, delete | Read |
| inspection_manager | Read | Read and report | Read |
| technician | Read | Read assigned orders; start and resolve assigned orders | Read |
| asset_manager | Create, read, edit, delete | Read | Read |

Database triggers limit technicians to status changes and reject assignment to users outside the organization. Organization IDs cannot be changed after creation, even by a user who belongs to both organizations. Composite foreign keys prevent linking an asset or work order to another organization's property. Only an administrator can add members through the explicitly authorized RPC; direct membership mutation is denied.

## Secrets and audit

Never commit environment files or expose a service key in client bundles. The public Supabase key is safe only because table grants, RLS and trigger authorization enforce access. Audit rows are append-only through the Data API, scoped to the same organization, and written atomically with lifecycle changes. Technicians can inspect the history of assigned work only.

## Existing public data

The previous shared demo is preserved in the `Legacy public demo` organization without members. It is inaccessible to new accounts. No new user can claim this organization through onboarding. A verified administrator must arrange an explicit ownership transfer if these historical records are needed.

## Verification

`node scripts/test-tenancy.cjs` emits a rollback-only SQL test for the provisioned project's SQL editor or a privileged database connection. It creates temporary identities and uses the actual `anon` and `authenticated` PostgreSQL roles, checks database isolation and authorization, and rolls back all fixtures. This complements browser checks of real signup, sessions and organization switching; simulated SQL claims alone do not verify Supabase Auth configuration.
