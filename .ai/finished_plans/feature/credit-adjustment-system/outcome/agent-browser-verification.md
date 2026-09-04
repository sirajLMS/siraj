# Agent-Browser Interactive Verification (manual, post-implementation)

- **Date**: 2026-08-30 (after all waves + review fixes landed)
- **Method**: `agent-browser` CLI authenticated via `bun run scripts/browser-login.ts --inject` (super-admin session, session `verify-4e6bfa581bd6`), against the dev server on port 3000. DOM/symbol-first per rules (`snapshot -i -c`, no image reads in main context).

## Verified (all PASS)

1. `/accounting/credits` renders: heading "Student Credits", search field, per-row "Adjust Credits" actions, live balance cells (`10 / 10` etc.) from real data.
2. Sidebar: "Credits" entry present under Finance group.
3. Row action navigates to `/accounting/credits/adjust?studentId=<id>` and the form page renders with student preselected (summary chip shows balance `10 / 10`).
4. Radio group: Add (checked by default) / Subtract / Subtract With Carryover.
5. Selecting **Subtract With Carryover** → carryover banner appears: required Teacher combobox + From/To/Payment date pickers.
6. Switching back to **Add** → carryover section unmounts (E3).
7. Console: no errors (info/debug only).

Screenshot for human review: `scratch/screenshots/credit-adjust-form-carryover.png`.

## Notes
- E2E (Playwright, `test/ui/e2e/accounting-credits.test.ts`, 4/4) remains the automated, repeatable proof; this pass adds an interactive smoke against the live dev server.
- No submission performed via the browser (state-mutating); submit paths are covered by E2E + service/mutation suites.
