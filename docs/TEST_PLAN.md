# Test Plan

## v1 Success Scenario (manual, mobile viewport)
1. Open app on mobile-width browser — no login screen, land on Properties
2. Navigate to Work Orders → tap "New Issue"
3. Fill: title "HVAC not cooling 3rd floor", select property, select HVAC asset, submit
4. Verify: new order appears in Work Orders list with status "pending" and priority badge
5. Tap order → assign technician "John" → tap "Start Work" → status becomes "WIP", responded_at populated
6. Tap "Resolve" → status becomes "resolved", resolved_at populated, resolution_time shown
7. Navigate to Weekly Status → verify: 1 resolved, 0 WIP, 0 pending for that property; resolution time visible
8. Verify order sorted by priority in list

## Empty States
- Delete all work orders (or fresh DB) → Work Orders screen shows "No work orders yet. Create the first issue."
- No properties → Properties screen shows "No properties yet. Add your first building."
- Weekly Status with no data → shows "No activity this week."

## Error States
- Disconnect network → attempt to create work order → error toast: "Could not save. Check connection."
- Invalid form (empty title) → submit blocked, field highlighted

## Loading States
- Initial page load → skeleton cards visible before data renders
- Status change button tap → button shows spinner until DB confirms

## Scoring Check
- Create work order with asset type = fire_alarm → verify priority_score ≥ 40, label = medium for a score of 40, following the explicit intelligence rule table
- Create with water_system + "leak" in description → verify score includes leak bonus


## Verified implementation — 2 October 2026

- Production build, strict TypeScript and ESLint pass.
- Real database lifecycle test passes, including append-only audit, invalid transitions, cross-property asset rejection, expired warranty and pending age scoring.
- 390px mobile browser: report Floor 3 HVAC issue, assign John, start, confirm resolution; Weekly Status shows the resolved issue with a 1-minute resolution.
- Mobile property and asset create/edit forms persist, including warranty dates.
- Empty filtered registry and failed linked-asset save show readable states; the failed save leaves records intact.
- Temporary integration and registry records are removed; audit entries remain append-only.
- Vercel public deployment awaits GitHub application installation and repository connection.
