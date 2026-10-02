# Architecture

## Stack
- **Next.js** (App Router, mobile-first responsive, Tailwind)
- **Supabase** (Postgres + RLS)
- **Vercel** deploy

## Build Sequencing
- **Now (v1):** Property registry, asset registry, work order engine, weekly status list, auto-priority scoring. All viewable without login.
- **Next:** Login/signup, per-user RLS, role-based views, photo attachments, notifications.
- **Later:** Tenant portal, preventive maintenance scheduling, agentic issue triage, reporting exports.

## Key User Action Flow
1. Inspection manager opens Work Orders tab on mobile → taps "New Issue" → fills title, selects property + asset, submits. → **Stored to DB.**
2. Building manager sees new pending order in Weekly Status → taps to open → assigns technician → status → WIP. → **response_at auto-set.**
3. Technician opens assigned order → marks Resolved. → **resolved_at auto-set, resolution_time calculated.**
4. Weekly Status list updates: item moves to Resolved bucket with time shown.

## Responsive Nav
Mobile bottom-nav bar: **Properties · Assets · Work Orders · Weekly Status**. On tablet/desktop collapses to left sidebar — same four sections.

## Layer Plan
1. **Data layer** — Supabase tables, constraints, RLS (permissive v1). All reads/writes via `lib/data/`.
2. **App logic** — Server actions for work order state transitions, time calculations, priority scoring. Separated from UI.
3. **Smart features** — Auto-priority scoring (rule-based), issue categorisation (later AI).

## Why Core Works Without AI
Priority scoring and weekly status are pure SQL + server-action logic. No AI needed for the core engine. AI categorisation/drafting is additive.

## Repo Structure
```
app/
  properties/  assets/  work-orders/  weekly-status/
  layout.tsx (mobile nav)
lib/
  data/  (properties.ts, assets.ts, work-orders.ts)
  actions/  (work-order-actions.ts, scoring.ts)
  ai/  (categorise.ts — later)
  utils/  (time.ts)
__tests__/
```

## Module Map
| Module | Responsibility | Owns | Build Order |
|--------|---------------|------|-------------|
| properties | Property/floor/unit CRUD | properties table | 1 |
| assets | Machinery registry + warranty tracking | assets table | 2 |
| work-orders | Work order lifecycle: create→assign→WIP→resolve | work_orders table | 3 |
| weekly-status | Aggregated status view by property/week | derived query on work_orders | 4 |
| scoring | Auto-priority score for work orders | scoring fn on work_orders | 5 |
