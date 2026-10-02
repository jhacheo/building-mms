# Intelligence Layer

## Messy Inputs
Inspection managers type free-text titles/descriptions: "AC not cooling on 3rd floor near unit 305, been like this 2 days".

## Auto-Structure (rule-based v1)
```json
{
  "detected_asset_type": "HVAC",
  "detected_floor": "3",
  "detected_unit": "305",
  "urgency_keyword": "2 days",
  "priority_score": 75,
  "priority_label": "high"
}
```

## Scoring Rules (v1 — deterministic)
| Condition | Score |
|-----------|-------|
| Asset type = fire_alarm | +40 |
| Asset type = electrical_panel | +30 |
| Asset type = lift | +25 |
| Asset type = HVAC | +15 |
| Asset type = water_system | +20 |
| Description contains "leak", "smoke", "spark", "no power" | +30 |
| Description contains "not cooling", "noise", "slow" | +10 |
| Warranty expired on linked asset | +15 |
| Age of open order > 48h and still pending | +20 |

**Score → Label:** 0-30 low, 31-60 medium, 61-80 high, 81+ critical.

## Events to Track
- work_order.created, work_order.assigned, work_order.status_changed, work_order.resolved

## Ranked Output
Weekly status list sorts WIP/pending by priority_score descending.

## v1 vs Later
- **v1:** Rule-based scoring, deterministic priority labels.
- **Later:** NLP categorisation of free-text descriptions, suggested asset matching, auto-assignment recommendations.
