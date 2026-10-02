# Tasks & Sprints

## Sprint 1 — Foundation: Properties + Assets
**Goal:** Property and asset registries working with demo data.
- [ ] Set up Next.js + Tailwind + Supabase client
- [ ] Create `lib/data/properties.ts` — CRUD functions
- [ ] Build Properties screen: list, add property (name, address, floors, units)
- [ ] Create `lib/data/assets.ts` — CRUD functions
- [ ] Build Assets screen: list by property, add asset (type, model, serial, dates, warranty)
- [ ] Seed 3 properties + 6 assets
- [ ] Mobile bottom-nav shell
**DoD:** User can create and view properties and assets on mobile without login.

## Sprint 2 — Core Engine: Work Orders ⭐ v1 FUNCTIONAL
**Goal:** Full work order lifecycle + weekly status — the success scenario works end-to-end.
- [ ] Create `lib/data/work-orders.ts` — CRUD + status transitions
- [ ] Create `lib/actions/work-order-actions.ts` — create, assign (→wip), resolve; auto-set responded_at/resolved_at; calculate times
- [ ] Build Work Orders screen: list (filter by status), create form, detail view, status change buttons
- [ ] Create `lib/actions/scoring.ts` — rule-based priority scoring on create
- [ ] Build Weekly Status screen: grouped counts (resolved/WIP/pending) per property, sorted by priority
- [ ] Seed 5 work orders across statuses
- [ ] Audit log writes on every status change
**DoD:** Inspection manager creates issue → building manager assigns → technician resolves → weekly status reflects it with resolution time. Mobile, no login.

## Sprint 3 — Polish + Empty States
**Goal:** All five UI states handled; scoring visible.
- [ ] Empty states for all lists (no properties, no assets, no work orders)
- [ ] Loading skeletons
- [ ] Error toasts on failed saves
- [ ] Priority badge visible on work order cards
- [ ] Response/resolution time displayed on resolved orders
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
