# Agentic Layer

## Draftable Actions (low risk — auto)
- Auto-set priority_score on work order creation (rule engine)
- Auto-categorise asset type from description keywords
- Auto-calculate response/resolution time on status change

## Executable After Approval (medium risk)
- Auto-assign work order to technician based on asset type + current workload → building manager confirms
- Auto-draft weekly status report email summary → asset manager approves send

## Human-Only (high/critical risk)
- Delete a work order
- Delete/archive an asset
- Close/resolve a work order (technician must confirm)

## Named Tools
- `score_work_order(order_id)` — compute & persist priority score
- `calculate_times(order_id)` — set response/resolution times on status change
- `assign_work_order(order_id, technician_name)` — assign (draft → approve)
- `generate_weekly_summary(property_id, week_start)` — draft report text

## Audit Log Fields
| Field | Type |
|------|------|
| id | uuid PK |
| action | text (e.g. 'status_change', 'assign', 'resolve') |
| entity_type | text ('work_order') |
| entity_id | uuid |
| actor_name | text |
| detail | text |
| created_at | timestamptz |

## v1 vs Later
- **v1:** Auto-scoring, auto-time-calculation, status transitions with audit.
- **Later:** Auto-assignment drafting, weekly report generation, notification triggers.
