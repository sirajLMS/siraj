# Plan Review Gate — whatsapp2 (Phase 1.5)

**Scope:** `specs.md`, `implementation.md`, `trackable-tasks.md`, `deferred-items.md` vs the repo AGENTS.md stack (root, app, backend/{,services,graphql/pothos+query+mutation,db/repo,db/test,types,enum}, shared, shared/locale, frontend, frontend/common/views, frontend/common/graphql/sharedDocuments, test/workflows).

**Rounds run: 2** — R1 by a prior review pass (2026-09-04, morning), R2 by this pass (2026-09-04, afternoon). Re-scan after R2 fixes: clean.

## Round 1 — findings & resolutions (prior pass)

| # | Severity | Finding | Resolution |
|---|---|---|---|
| F1 | HIGH | Repo tasks (3.x) omitted the `queryDb(tx)` Neon-HTTP rule for non-transactional reads, the `inArray` + prepared-statement prohibition, and DataLoader batch-method guidance | Fixed — task 3.8 |
| F2 | HIGH | Task 9.2 used manual `PermissionsService.hasPermission(...)` without mandatory `UserPermissionContext` from `ctx` (cold-start rule); resolver error type not pinned to DomainError; Pothos enum backing unstated | Fixed — task 9.2 |
| F3 | LOW | Permission enum line anchor drift (273–275 → 276–278) | Fixed — task 1.6 |

## Round 2 — findings & resolutions (this pass)

Ground truth verified: `getTranslations(locale)` / `getServerTranslations(locale)` are locale-only (`shared/locale/server.ts:19`, `server-graphql.ts:3`); `ctx.t` is a zero-arg translator (`backend/graphql/gqlContext.ts:39`); `Translation` is a const registry of `defineNamespace` handles (`shared/locale/namespaces/translation.ts:124`); env-config keys are UPPER_SNAKE (`backend/lib/env-config-keys.ts`, `whatsapp` category exists); permission strings follow `whatsapp.view` style.

| # | Severity | Finding | Fix |
|---|---|---|---|
| R2-1 | HIGH (i18n) | specs REQ-0.5.2 + impl prescribed `ctx.t("namespace")` and `getServerTranslations(locale, "ns")` — both signatures stale | Rewrote both docs to locale-only + property access (`ctx.t().errorsTranslations`, `getServerTranslations(locale).whatsappInboxTranslations`) |
| R2-2 | HIGH (i18n) | "`Translation` enum gains `WhatsappInbox = "whatsappInbox"`" — wrong kind of symbol; namespace wiring omitted `types/message.ts` schema entry and `namespaces/translation.ts` registration | specs REQ-0.5.3 + impl Translation System section + task 10.1 now list all five registration points (types, leaves, messages.ts, defineNamespace loader, message.ts, Translation registry) |
| R2-3 | HIGH (internal consistency) | specs REQ-1 AC1 / task 1.1 put `syncRequestId` + `syncRequestedAt` on `whatsapp_accounts`, contradicting implementation D9 (request IDs live per-type on `whatsapp_sync_requests`) | Removed both columns; added explicit D9-consistent note to specs AC1 + task 1.1 |
| R2-4 | MEDIUM | `whatsapp_sync_requests.status` had values (`PENDING/REQUESTED/STREAMING/COMPLETE/FAILED`) but no named TS enum; tasks 1.4/1.5 shipped only six enums | Added `WhatsappSyncRequestStatus` (seven enums) in impl data models + tasks 1.4/1.5; table columns reference named enums |
| R2-5 | MEDIUM | Env-config key `whatsapp-graph.version` violates the UPPER_SNAKE registry convention; hidden list is secrets-only | Renamed to `WHATSAPP_GRAPH_API_VERSION` (category `whatsapp`, DB-overridable, NOT hidden) in specs REQ-3.4, impl Component 1 + D6, task 4.2 |
| R2-6 | LOW | Journey test filename drift: impl `coexistence-journey.test.ts` vs tasks `coexistence-routing.test.ts` | Unified on `coexistence-routing.test.ts` |
| R2-7 | LOW | `whatsapp.embeddedSignupFailed` used in Error Handling table but missing from i18n error-key lists | Added to impl i18n section + task 10.2 |
| R2-8 | LOW | Phase 3 repo tests lacked location/coverage mandate | Task 3.TE now names `backend/db/test/repo/whatsapp/`, runInRollback+full `tx`, 100% coverage, `run-test.ts` runner |
| R2-9 | LOW | Inbox GraphQL documents never defined in frontend tasks | Task 12.2 creates `whatsapp-inbox.documents.ts` (`*QueryDocument` naming, `id` on every object) |
| R2-10 | LOW | Task 1.4 said "Create `backend/enum/whatsapp/`" though the subdir/barrel exist (holding a deprecated shared-constants shim) | Reworded: add `<entity>.enum.ts` files under the existing subdir, shim untouched |
| R2-11 | LOW | specs optin tab role "staff" vs impl `staff_default`; task 1.6 missing concrete permission strings | Normalized to `staff_default`; added `whatsapp.inbox_view` / `whatsapp.inbox_manage` |

## Round 2 — re-scan (after fixes)

- Grep across all four docs for stale patterns (`whatsapp-graph.version`, `ctx.t("`, two-arg `getServerTranslations`, `Translation enum`, `syncRequestId`, `syncRequestedAt`, `coexistence-journey`, "six enums", `Create \`backend/enum/whatsapp`): **clean**.
- REQ↔task traceability: REQ-0→0/14; REQ-0.5→10; REQ-1→1/2/11; REQ-2→2/3/5; REQ-3→4; REQ-4→8; REQ-5→3/6; REQ-6→1/2/3/7; REQ-7→7.5; REQ-8→2/9/10/12; J1–J3→13. No orphans either direction.
- Permission matrix consistent across specs UX table, impl Routes/Role/Permission-Mapping tables, and tasks (inbox=`WHATSAPP_INBOX_VIEW`; purpose/ES mutations=`WHATSAPP_CONFIG_MANAGE`; grants limited to super_admin/academy_admin/staff_default/supervisor_default).
- Path anchors re-verified against disk (~20 checks): payload map `:87`, dispatch `:139`, adapter v20.0 `:494`, `findFirstActiveForCredentials`, `stripInboundMessages` (`route.ts:166,323`), `TAB_IDS/LABELS/PERMISSIONS` + `WhatsappConfigTab` union, page `withPageAuth([WHATSAPP_VIEW])`, `navigationConfig.ts:709`, `WhatsappAccountFields` fragment (+`id`), `createPgEnumFromEnum`, test dirs, migration precedents, instruction files.

## Verdict

**Plan passes all AGENTS.md rules for affected layers after two rounds.** Files edited: `specs.md`, `implementation.md`, `trackable-tasks.md`. `deferred-items.md` and outcome research files untouched (no Meta-fact changes needed).

## Carry-Over Notes for Executors

- `permission.enum.ts` line numbers drift — resolve anchors by symbol, not line number (from R1).
- **AGENTS.md staleness (docs-only issue, NOT a plan defect):** root `AGENTS.md`, `shared/AGENTS.md`, and `backend/graphql/AGENTS.md` still document the legacy i18n API surface (`getTranslations(locale, namespace)`, `ctx.t("<namespace>")`, `shared/locale` legacy file layout). The live code API is locale-only + property chains. Recommend a docs reconciliation pass outside this plan ( candidates for a follow-up docs task).
- Pre-existing (v1, out of scope): `WhatsappTabPanels.tsx` retains `Task 12/13` plan-tag comments in code (clean-comments rule); captured by deferred item D2 context — this plan does not fix it.
