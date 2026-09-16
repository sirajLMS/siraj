# Task 8 Outcome — Knowledge Propagation

Agent: Knowledge Propagation Subagent. No commits/pushes. All artifacts written.

## 1. Patterns, Occurrences, and Litmus Decisions

| # | Pattern (validated across outcome files) | Occurrences | Litmus | Destination(s) | Applied |
|---|---|---|---|---|---|
| P1 | Bun `mock.module` partial factories must enumerate the real module's export surface; new exports on a mocked module break unrelated suites at import time (stale `whatsapp-constants` partial mock broke the coexistence-sync suite; found+fixed in the Task 7 sweep) | 2+ | GLOBAL | `tests.instructions.md` (new "Bun `mock.module` Partial Factories (CRITICAL)" section) | ✅ |
| P2 | Drizzle 1.0.0-rc.4 `DrizzleQueryError` embeds FULL BOUND PARAMS in its message — never log/rethrow raw driver errors from secret-bearing tables; project to stable metadata (`name`/`code`/`detail`) for logs AND GraphQL surfaces (`toLoggableDbError` in the config service; `toSafeErrorProjection` in the env-config resolver; midpoint-R1 log-leak fix for echoed `GraphApiError`) | 3+ | GLOBAL | `backend.instructions.md` (Logging bullet) + `docs/backend/whatsapp-configuration.md` (Secret Handling section) | ✅ |
| P3 | gqlSchemaBuilder scope-auth evaluates bare multi-key `authScopes` maps under the "any" default strategy — a second truthy scope satisfies the map; any field combining `permission` with additional scopes MUST wrap in explicit `$all` (pinned by executed-schema `whatsapp-config.auth-scopes.test.ts`) | repo-wide | GLOBAL | `backend/graphql/AGENTS.md` (authScope Pattern section; file EXISTS → added) + `backend.instructions.md` (Pothos/GraphQL bullet) | ✅ |
| P4 | Transaction-scoped advisory lock + `FOR UPDATE` serializes singleton-config upserts (`FOR UPDATE` alone cannot protect the empty-table insert); DB-first credential resolution with env-config write-through must be field-complete, in-tx (merged-row hook), audited, with post-commit cache invalidation | domain | DOC-ONLY | `docs/backend/whatsapp-configuration.md` (Singleton-Row Concurrency section) | ✅ |
| P5 | Per-file quality-gate claims must carry actual exit codes from the editing session — claimed-but-unrun gates shipped a build-breaking syntax error once (R3 F-3 ternary else, TS1005 at HEAD, caught by R4; R4's integrity check found a second R3-touched file failing gates at HEAD) | 2+ | GLOBAL | `quality-gate/SKILL.md` ("Critical Rules" section EXISTS → rule 9) + `quality-loop/SKILL.md` ("Final Report" section — natural reporting rules) | ✅ |
| P6 | Sandbox 4 GB ceiling OOMs full-repo `bun tsgo` / `bun quality-gate` (exit 137, dmesg-confirmed, matches phase-0 baseline on untouched master) | env-specific | DOC-ONLY | `docs/backend/whatsapp-configuration.md` ("CI Verification" section) ONLY — **excluded from AGENTS.md and instructions** per litmus | ✅ |

### Exclusions / restraint notes

- `backend/graphql/AGENTS.md` exists → P3 added there (+ backend.instructions.md); nothing invented elsewhere.
- Pointers to the new doc added to `backend/services/AGENTS.md`, `backend/db/repo/AGENTS.md`, and root `AGENTS.md` **only** because each already has an "Important References" section; no sections were invented.
- P6 kept out of AGENTS.md/instructions (environment-specific, not a coding rule).
- New domain doc contains ZERO plan-artifact references (grep below).

## 2. Files Created / Updated

Created:
- `docs/backend/whatsapp-configuration.md` — canonical domain doc: feature overview, data flow (UI → GraphQL → service → repo → `whatsapp_configs` + env-config write-through → enforcement paths), P4 concurrency pattern, P2 secret-handling rules, masking/audit conventions, P6 CI-verification note, Related pointers. Matches `docs/backend/service-base-pattern.md` / `db-availability-fail-fast.md` conventions (H2 sections, bold key terms, fenced diagrams, code paths in backticks).

Updated:
- `.agents/instructions/tests.instructions.md` — P1 section (2 bullets) appended after "Audit-Log Cleanup in Journeys".
- `.agents/instructions/backend.instructions.md` — P2 bullet in "Logging", P3 bullet in "Pothos / GraphQL".
- `backend/graphql/AGENTS.md` — P3 bullet (with `$all` requirement, auth-scopes-test pointer, doc pointer) in "authScope Pattern: `permission` vs `superAdmin`".
- `backend/services/AGENTS.md` — doc pointer under "Important References".
- `backend/db/repo/AGENTS.md` — doc pointer under "Important References".
- `AGENTS.md` (root) — doc pointer under "Important References".
- `.agents/skills/quality-gate/SKILL.md` — P5 as rule 9 under "Critical Rules".
- `.agents/skills/quality-loop/SKILL.md` — P5 as a Final Report bullet.

## 3. Verification Results

- `bun run scripts/health/sub-loop.ts <md> --lifecycle biome` (probed on an existing doc first): tsgo passes, then **oxlint stage fails with "No files found to lint"** — the sub-loop pipeline targets TS/JS and cannot gate markdown. Per task fallback: `bunx biome check <file>` used instead.
- `bunx biome check` on all 9 touched/created md files (new doc, 2 instruction files, 4 AGENTS.md, 2 SKILL.md): **zero lint findings** — Biome 2.5.12 does not process markdown ("No files were processed in the specified paths", exit 1 from zero-file processing, identical on untouched baseline `docs/backend/service-base-pattern.md`). No markdown gate exists in this repo; no new issues introduced or suppressible.
- Path integrity: all 9 repo paths referenced by the new doc exist on disk (checked).
- Plan-artifact grep (`REQ-|Task [0-9]|Phase [0-9]|\.ai/plans|round-R`) over the new doc + all edited files: **0 new matches** (remaining hits are pre-existing lines: the anti-plan-artifact rule itself, quality-gate's own "Phase N" workflow headings, and pre-existing registry lines in root AGENTS.md).
- Working tree: only the 9 knowledge files modified + pre-existing baseline (`bun.lock`, `Caddyfile`, `.ai/plans/*`). `bun.lock` untouched by this task.

## 4. Carry-Forward

None. Task 8 closes the plan's knowledge-propagation phase; all patterns are now in permanent knowledge surfaces (instructions, AGENTS.md layers, quality skills, canonical doc).
