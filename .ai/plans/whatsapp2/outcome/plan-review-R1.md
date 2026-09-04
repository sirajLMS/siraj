# Plan Review R1 — whatsapp2 (Phase 1.5 Gate)

**Date:** 2026-09-04 · **Reviewer:** plan-review skill pass · **Scope:** `specs.md`, `implementation.md`, `trackable-tasks.md`, `deferred-items.md`

## Method

1. Mapped every plan-cited path to its layer and verified existence on disk — all 14 anchor files exist.
2. Verified line anchors: `NOTIFICATION_TEMPLATE_MAP` (`notification-payloads.builders.ts:87`), `dispatchWhatsapp` (`communication.service.ts:139`), hardcoded `v20.0` (`MetaCloudApiAdapter.ts:494`), `stripInboundMessages` (`route.ts:166,323`), `findFirstActiveForCredentials` (`whatsapp-account.repository.ts:127`), `navigationConfig.ts:709` (`whatsapp-settings`), placeholder opt-in arrays in `WhatsappTabPanels.tsx`. All confirmed accurate.
3. Read layer rule files (`backend/db/repo/AGENTS.md`, `backend/db/schema/AGENTS.md`, `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md`, `shared/locale/AGENTS.md`, `test/workflows/AGENTS.md`) and cross-checked plan tasks against their mandates.

## Findings & Resolutions

| # | Severity | Finding | Resolution |
|---|---|---|---|
| F1 | HIGH | Repo tasks (3.x) omitted the CRITICAL `queryDb(tx)` Neon-HTTP rule for non-transactional reads and the `inArray` + prepared-statement prohibition; no DataLoader batch-method guidance for GraphQL-driven repos | Fixed — added task 3.8 codifying all three mandates |
| F2 | HIGH | Task 9.2 specified manual `PermissionsService.hasPermission(...)` without the mandatory `UserPermissionContext` propagation from `ctx` (cold-start rule requires the caller to pass the pre-computed context, eliminating 3 DB queries per call); resolver error type not pinned to DomainError subclasses; Pothos enum backing not stated | Fixed — task 9.2 now mandates `UserPermissionContext` from ctx, DomainError subclasses, and real-enum-backed Pothos enum types |
| F3 | LOW | Permission enum line anchor drift: plan said 273–275, code is 276–278 | Fixed — task 1.6 anchor corrected |

## Checks That Passed (no change needed)

- **Type canonicalization**: all types live in `backend/types/whatsapp/`; no Pothos-local type definitions (Task 2 explicitly).
- **i18n dual-surface**: plan mandates leaf modules in `en/`+`ar/` AND `namespaces/whatsappInbox/whatsappInbox.namespace.ts` loader — matches `shared/locale/AGENTS.md`; verified existing namespace layout (`namespaces/whatsapp/whatsapp.namespace.ts`) matches plan's filename convention.
- **Enum registration**: two-step enum registration (`backend/enum/whatsapp/` + `createPgEnumFromEnum` in `backend/db/schema/enums.ts` + `enum.pothos.ts`) per GraphQL AGENTS "no literal arrays" rule.
- **AppPermission two-phase migration**: Task 1.6 splits `ALTER TYPE ... ADD VALUE` from grants — matches the TS-enum-must-match-DB-enum gotcha.
- **Test conventions**: repo tests `runInRollback` + `tx` everywhere; journey (`Task 13`) uses committed fixtures, honest permissions, no `runInRollback`, mermaid DIAGRAMS.md — matches `test/workflows/AGENTS.md`.
- **Service tests never hit network** — Meta fetch/Redis mocked (Tasks 4–8 TE subtasks).
- **Drizzle push vs migrate**: schema via `db push`; permission seeds via SQL migration — matches schema AGENTS.
- **GraphQL documents**: fragment extension (`WhatsappAccountFields`) is additive; naming/id-field conventions preserved.
- **Deferred items ledger**: exists with only 📋 (explicitly out-of-scope) entries + one in-plan doc-reconciliation item (D10 → Task 15.2).
- **Traceability**: every task carries `_Requirements: REQ-x_` links; all ACs REQ-0…REQ-8 + J1–J3 have owning tasks; Phase 14/15 provide quality gate + knowledge propagation.

## Verdict

Plan passes all AGENTS.md rules for affected layers after F1–F3 fixes. No second round needed.

## Carry-Over Notes for Executors

- `permission.enum.ts` line numbers will drift as permissions are added — resolve anchors by symbol, not line number.
- The migration directory for custom SQL must follow the existing `backend/db/migration/` two-phase pattern (enum-add phase must be its own migration file).
- `shared/locale/namespaces/<scope>/` uses `<scope>.namespace.ts` filename convention (verified against whatsapp).
