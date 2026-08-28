# Workflow / Journey Test Layer Rules

This directory contains **cross-actor journey tests**: sequential, multi-actor workflows executed
through the real service layer against the real test database. Canonical reference:
`docs/testing/workflow-journey-tests.md`.

## Hard rules

1. **NO `runInRollback` — ever.** Services use the global `db` and spawn their own top-level
   transactions; an outer rollback wrapper would deadlock or miss committed rows. This layer is
   the documented exception to the db/test rollback rule. Precedents:
   `backend/db/test/logic/lms/accounting-payment-workflow.test.ts` (~lines 40–44, committed
   `beforeAll` fixtures + `afterAll` hard delete) and
   `backend/db/test/logic/permissions/permission-management.service.test.ts` (~lines 120–124).
2. **Committed fixtures + tracked cleanup.** Create the full actor cast in `beforeAll` inside a
   committing `db.transaction(...)`. Track every created row id (including side-effect rows the
   services create: lesson reports, teacher dues, credit transactions, idempotency-keyed rows) and
   hard-delete all of them in `afterAll`, in FK-safe order, via the cast helper's cleanup function.
3. **Unique UUID prefixes.** Every suite derives a per-run prefix
   (`const prefix = \`jrn_<domain>_${randomUUID().slice(0, 8)}\``) used in names/notes so repeated
   or parallel runs never collide.
4. **Honest permissions only.** Actors hold real `user_permission_groups` membership rows (via
   `assignSystemGroup` in `helpers/permissions.ts`). Never monkey-patch
   `PermissionsService.getUserContext` / `hasPermission` in a journey — negative steps must fail
   through the real permission/ownership checks.
5. **External effects always intercepted.** Nothing may reach real email/SMS/push/meeting/FX/Redis
   providers. Spy `dispatchWithPreferences` from
   `@/backend/services/notification/notification-dispatch.helpers` (namespace import + `spyOn`;
   if interception empirically fails, fall back to `mock.module` and restore in `afterAll`).
   Assert both that a dispatch happened and **which userIds it targeted**.
6. **Never `expect(...).rejects.toThrow()`.** Use a try/catch helper and assert translated
   substrings from `getServerTranslations("en").errorsTranslations` — no hardcoded English strings.
7. **Use `bun:test` imports only.** No Jest/Vitest imports, no `console.*`, no `any` casts.
8. **`@/` import aliases** (e.g. `@/test/workflows/helpers`), never relative parent paths.
9. **Never use demo/seeded rows as fixtures.** Always create your own entities via
   `backend/db/test/entity-setup.ts` helpers (verify signatures first — they vary). System
   permission *definitions* (catalog rows + `teacher_default` / `supervisor_default` groups created
   by migrations) are not demo data and may be referenced via `assignSystemGroup`.
10. **Organization**: one journey file per cross-actor workflow, grouped by domain subdirectory
    (`test/workflows/<domain>/<workflow>.test.ts`). Shared scaffolding lives in
    `test/workflows/helpers/` with a pure `export *` barrel (`./` paths only, one `/` max per
    export path).

## Running

```bash
bun run test:workflows
```
