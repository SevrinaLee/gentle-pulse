# Test Plan

## v1 Success Scenario (manual)
1. Open the app URL without logging in
   - **Expect:** Home screen loads with ≥ 3 seeded check-ins and one insight card visible. No login wall.
2. Pick mood 😩, type "Spent 2 hours replying to customer DMs", click Submit
   - **Expect:** New row appears in friction log within 5 s with category badge (e.g. "Customer Support")
3. Wait for AI tagging (or mock it in dev)
   - **Expect:** `friction_tags` row exists in DB with category_confidence > 0 and review_status
4. Navigate to Patterns screen
   - **Expect:** "Customer Support" appears ranked first if it has highest estimated hours
5. Return to Home, click "Show Me How" on the insight card
   - **Expect:** Drawer opens with at least one non-empty tab (ChatGPT Prompt or Template)
6. Click "Ignore" in the drawer
   - **Expect:** Drawer closes, card disappears from Home, `suggestions.status = 'ignored'` in DB, audit_log row written
7. Tap the floating 😮‍💨 Sigh Button
   - **Expect:** Follow-up prompt appears. Type a note, submit. `sigh_events` row in DB with follow_up_note.

## Empty State Tests
- Clear all check-ins for a user (or use a fresh demo) → Home shows "No check-ins yet — what stole your time today?"
- Pattern screen with no patterns → "Check in for 3+ days to see your patterns emerge"

## Error State Tests
- Disable network → submit check-in → error banner appears, form text is preserved, no duplicate row in DB
- OpenAI returns 500 → check-in saves, tag row created with review_status = `pending`, UI shows "AI tagging pending" badge
- Submit empty text field → form validation prevents submit, inline error "Tell me what happened — even one word works"

## Lock-Down Tests (Sprint 4)
- Create check-in as user A; query Supabase as user B → 0 rows returned
- Anon visitor reads demo seed rows → returns seed rows, no real user data
