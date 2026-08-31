# Prototype vs Implementation — Comparison Outcome

- **Method**: 5 isolated comparison subagents, each reading exactly the prototype PNG then the Storybook capture of the implementation (EN locale), colors excluded from comparison.
- **Storybook**: 16 stories across the 5 components (ids in `stories-outcome.md`); captures in `scratch/screenshots/proto-compare/`.

## Verdicts

| Surface | Winner | Impl structure score | Key deltas |
|---|---|---|---|
| `student-credits-list` (desktop) | **Implementation** | 7/10 | Impl better: merged `remaining/total` pill, labeled row actions (vs kebab). Missing vs proto: quick-filter chips (All / Low Balance / No Credits), subtitle, Last-Transaction column, footer aggregate summary |
| `student-credits-mobile` | **Implementation** | 8/10 | Impl better: always-visible search + actions (vs icon/swipe gestures), higher density, zero/negative balance pill states. Missing: relative "last adjusted" time, aggregate summary; avatars hidden <md was a deliberate width fix |
| `credit-adjust-form` | **Prototype** | 5.5/10 | Impl faithfully reproduces field order + control types, but prototype adds: live OUTCOME PREVIEW banner ("14 → 16 after"), current-balance context line, description subline per type card, Notes (optional) field, Hours stepper, page subtitle |
| `credit-adjust-carryover` | **Prototype** | 7/10 | Same spine; prototype adds: subtitle, resolved-student context card, carryover helper sentence, internal-notes field, pre-submit summary band. Impl better: date pickers, search autocompletes, asterisk semantics |
| `credit-adjust-error` | **Prototype** (3/10 — see caveat) | — | Capture used the banner-errors story, not the form's error state → not a faithful surface comparison. The plan's actual error surface is inline (INSUFFICIENT_CLASSES on Hours) vs prototype's full-width code+explanation banner + rejected-balance preview |
| `student-credit-history` | n/a | — | No history UI in this plan's scope (student-portal surface; carryover data exposed via `getStudentTransactions` backend + TB tests only) |

## Deliberate design conflicts to resolve before borrowing prototype elements

- **"Internal Notes" field**: no column exists in `credit_transactions` beyond `reason/notes` rich-text — adding a second free-text field = schema change. Do NOT implement without spec amendment.
- **Live preview banner / rejected-balance preview**: implementable client-side (balance known from selected student + pending delta) — no backend change needed.
- **Quick-filter chips** on the list: the `studentsDirectory` resolver search is the only filter domain — "Low Balance" would require a filter extension; "No Credits" too; needs scope decision.

## Addendum — post-implementation of prototype deltas (user-approved scope)

After implementing: type-card descriptions, live balance preview + balance context, pre-submit summary + full-width error band, `internalNotes` field (schema → migrations → service → Pothos → form), page subtitle, carryover helper caption:

- `credit-adjust-form` (empty state): **TIE** — impl matches IA 1:1 + adds asterisks/staff-only helper; remaining prototype edges: Hours stepper, preview in filled state (exists in impl, unverifiable in empty story).
- `credit-adjust-carryover` (filled): **TIE** — impl wins on control quality + breathing room (3-col dates, notched labels, staff-visibility helper); prototype's identity strip exists in impl via the selected-student card (verified in the preselected story/state).
- `credit-adjust-error`: error surface = inline hours error + full-width band with code + message (implemented in x2).

Not implemented by user decision: quick-filter chips + footer aggregates on the list, separate "Notes" beyond the now-added internalNotes. Regressions pinned green: form 17/17, service 48/48, mutation 6/6, E2E 4/4 (plus compile-race warmup fix in runner scaffold).
