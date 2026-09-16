# Phase 0: Pre-Implementation Quality Baseline

**Feature:** `profit-loss-dashboard`
**Plan:** `.ai/plans/profit-loss-dashboard/`
**Captured:** 2026-09-16
**Branch:** `master`

---

## Purpose

This file records the quality baseline captured **before** any implementation work on the
profit-loss-dashboard plan began. Post-implementation review findings must be **compared against
this baseline** — anything already present here is pre-existing and NOT caused by the
implementation.

---

## Quality Check Baseline

| Check | Command | Result |
|---|---|---|
| tsgo type errors | `~/.bun/bin/bun tsgo` (grep "error TS" \| wc -l) | **0 errors** |
| Biome warnings | `~/.bun/bin/bun biome:check` (grep -c "warn") | **1 warning** |
| ESLint (lint service, full-repo) | `~/.bun/bin/bun run scripts/lint-service.ts --json --id baseline` | **success: false, exitCode: 1** |

ESLint detail (the single pre-existing failure):

```
test/security/multi-account-bola.test.ts
  613:5  error  Add at least one assertion to this test case  sonarjs/assertions-in-tests

✖ 1 problem (1 error, 0 warnings)
```

Raw artifacts saved to `/tmp/baseline-tsgo.txt`, `/tmp/baseline-biome.txt`,
`/tmp/baseline-lint.json` (note: the lint JSON file is prefixed with lint-service process-lock
log lines; the structured `success`/`exitCode`/`output` fields are intact and shown above).

---

## Modified-File Baseline (`git diff --name-only`)

**935 files** were already modified (tracked, unstaged) before implementation started.
**Zero of them are source files** — all 935 are `.ai/` plan/outcome/prototype markdown and
documentation from prior plan work. Largest groups:

| Count | Directory |
|---|---|
| 224 | `.ai/finished_plans/quality/code-duplications` |
| 80 | `.ai/finished_plans/quality/reexport-elimination` |
| 65 | `.ai/plans/carryover-balance-module/outcome` |
| 50 | `.ai/plans/session-event-audit/outcome` |
| 39 | `.ai/plans/expense-ledger/outcome` |
| 36 | `.ai/finished_plans/issues/graphql-mutation-test-args` |
| 35 | `.ai/finished_plans/graphql-devlog-catch-errors/outcome` |
| 33 | `.ai/plans/whatsapp-conversations/outcome` |
| 32 | `.ai/plans/whatsapp2/prototype` |
| 29 | `.ai/plans/whatsapp2/outcome` |
| (remainder) | other `.ai/finished_plans/*` and `.ai/plans/*` doc dirs |

Full list: `/tmp/baseline-files.txt`.

## Stash Baseline (`git stash list`)

```
stash@{0}: On master: wip before pr69
stash@{1}: On master: S7-final-baseline
```

Full list: `/tmp/baseline-stash.txt`.

---

## Untracked / In-Flight Files (ignore during post-implementation review)

`git status --porcelain` reports **10 untracked directories**, all documentation under
`.ai/finished_plans/` (no untracked source files):

- `.ai/finished_plans/feature/carryover-balance-module/`
- `.ai/finished_plans/feature/expense-ledger/`
- `.ai/finished_plans/feature/quota/`
- `.ai/finished_plans/feature/session-event-audit/`
- `.ai/finished_plans/feature/student-credit-hours-system/`
- `.ai/finished_plans/feature/whatsapp/whatsapp-conversations/`
- `.ai/finished_plans/feature/whatsapp/whatsapp2/`
- `.ai/finished_plans/feature/whatsapp/whatsapp_page_config_tab/`
- `.ai/finished_plans/performance/login-cold-start-fix/`
- `.ai/finished_plans/quality/graphql-devlog-catch-errors/`

These are leftover plan documentation from completed work — exclude them from post-implementation
review diffs. No other agents' in-flight source work was observed.

---

## Review Rule

**All post-implementation review findings must be compared against this baseline.**

- tsgo errors: baseline is 0 — any tsgo error after implementation is new and must be fixed.
- Biome warnings: baseline is 1 — biome output containing 1 "warn" match post-implementation
  matches the baseline; investigate only if it exceeds it.
- ESLint: baseline is 1 pre-existing error in `test/security/multi-account-bola.test.ts:613`
  (sonarjs/assertions-in-tests) — this failure exists before the plan and is NOT attributable to
  the implementation; any *additional* ESLint error is new and must be fixed.

---

## Related Documents

- Deferred items ledger: `.ai/plans/profit-loss-dashboard/deferred-items.md`
- Plan: `.ai/plans/profit-loss-dashboard/implementation.md`
