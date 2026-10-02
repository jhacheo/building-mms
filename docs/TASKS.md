# Tasks & Sprints

## Sprint 1 — Foundation: Properties + Assets
**Goal:** Property and asset registries working with demo data.
- [x] Set up Next.js + Tailwind + Supabase client
- [x] Create `lib/data/properties.ts` — CRUD functions
- [x] Build Properties screen: list, add property (name, address, floors, units)
- [x] Create `lib/data/assets.ts` — CRUD functions
- [x] Build Assets screen: list by property, add asset (type, model, serial, dates, warranty)
- [x] Seed 3 properties + 6 assets
- [x] Mobile bottom-nav shell
**DoD:** User can create and view properties and assets on mobile without login.

## Sprint 2 — Core Engine: Work Orders ⭐ v1 FUNCTIONAL
**Goal:** Full work order lifecycle + weekly status — the success scenario works end-to-end.
- [x] Create `lib/data/work-orders.ts` — CRUD + status transitions
- [x] Create `lib/actions/work-order-actions.ts` — create, assign, start (→wip), resolve; auto-set responded_at/resolved_at; calculate times
- [x] Build Work Orders screen: list (filter by status), create form, detail view, status change buttons
- [x] Create `lib/actions/scoring.ts` — rule-based priority scoring on create
- [x] Build Weekly Status screen: grouped counts (resolved/WIP/pending) per property, sorted by priority
- [x] Seed 5 work orders across statuses
- [x] Audit log writes on every status change
**DoD:** Inspection manager creates issue → building manager assigns → technician resolves → weekly status reflects it with resolution time. Mobile, no login.

## Sprint 3 — Polish + Empty States
**Goal:** All five UI states handled; scoring visible.
- [x] Empty states for all lists (no properties, no assets, no work orders)
- [x] Loading skeletons
- [x] Error alerts on failed saves
- [x] Priority badge visible on work order cards
- [x] Response/resolution time displayed on resolved orders
**DoD:** Every screen handles loading/empty/error/ready. No dead buttons.

## Sprint 4 — Lock It Down
**Goal:** Auth + per-user data isolation.
- [ ] Supabase Auth (email/password)
- [ ] Profiles table with role field
- [ ] Replace permissive RLS with `auth.uid() = user_id` on all tables
- [ ] Login/signup screens
- [ ] Role-based UI: inspection_manager sees create-only on work orders; technician sees assigned orders
**DoD:** Anonymous users redirected to login. Users only see their data. Roles enforced server-side.

## Text Gantt
```
S1: [Properties + Assets]
S2: [Work Orders + Weekly Status] ← v1 functional
S3: [Polish + States]
S4: [Auth + Lock-down]
```

## Multi-tenant release (requested after the public demo)

This release supersedes the earlier owner-only Sprint 4 sketch: organizations share records among members, and a user can have different roles across organizations. The original no-login demo rule describes the previous release; the requested multi-tenant app uses authentication and database isolation.

- [ ] Supabase email/password signup, login and signout verified in browser
- [x] Organization onboarding and membership-aware switching verified in browser
- [x] Required immutable tenant IDs and composite foreign keys applied to every core table
- [x] Membership-backed RLS replaces every anonymous demo policy
- [ ] Administrator adds existing email-verified users with roles
- [x] Technician assignment and status-only mutation enforced by database
- [x] Authoritative authenticated reporter and audit identities
- [x] Rollback SQL isolation/role/lifecycle test passes
- [ ] Authenticated PRD workflow verified against production

**DoD:** Two independent organizations cannot see or change each other's data; an organization team can report, assign, start and resolve a work order and see its weekly result. Signing out removes access. A member of multiple organizations can switch without mixing data.

