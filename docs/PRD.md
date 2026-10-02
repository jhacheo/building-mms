# Maintenance Management System (MMS)

## Problem
Building managers, technicians, asset managers, and inspection managers operate across multiple properties with no unified view of maintenance issues. Issue reporting is slow, response/resolution times aren't tracked, and critical machinery (HVAC, lifts, fire alarms, electrical panels, water systems) lacks a central record. There is no single weekly status picture of what's resolved, in-progress, or pending.

## Target User
- **Building Managers** — assign and track work orders for their buildings
- **Technicians** — receive, work on, and resolve work orders on-site
- **Inspection Managers (HQ)** — report issues from inspections
- **Asset Managers (HQ)** — review issues against machinery/asset records

## Core Objects
- **Properties** — building name, address, floors, units
- **Assets/Machinery** — type (HVAC, lift, fire alarm, electrical panel, water system), model #, serial #, purchase date, install date, warranty expiry, linked property
- **Work Orders** — title, description, status (pending/WIP/resolved), priority, property, asset (optional), reported_by, assigned_to, created_at, responded_at, resolved_at, response_time, resolution_time
- **Weekly Status** — derived view: count of resolved/WIP/pending per property for current week

## MVP (v1)
- [ ] Mobile-first responsive UI (no desktop-only views)
- [ ] Property list with floors/units
- [ ] Asset/machinery registry with full details
- [ ] Work order CRUD: create, assign, update status, resolve
- [ ] Weekly status list: resolved / WIP / pending grouped by property
- [ ] Response & resolution time auto-calculated on status change
- [ ] Auto-prioritise work orders (rule-based scoring)
- [ ] Demo data seeded — app renders without login

## Non-Goals (v1)
- No web/desktop-specific layout
- No login/auth wall (demo-first; lock-down is a later sprint)
- No tenant self-service portal
- No notifications/push
- No file/photo uploads
- No recurring PM schedule generation

## Success Criteria
An inspection manager reports a faulty HVAC unit on Floor 3 → a building manager assigns it to a technician → the technician marks it WIP then resolved → the weekly status list reflects the resolved item and shows resolution time under 24h. All visible without login on a mobile screen.
