# Workflow / Journey Test Layer Rules

This directory contains **cross-actor journey tests**: sequential, multi-actor workflows executed
through the real service layer against the real test database.

## Hard rules

1. **NO `runInRollback` — ever.** Services use the global `db` and spawn their own top-level
   transactions; an outer rollback wrapper would deadlock or miss committed rows. This layer is
   the documented exception to the db/test rollback rule: use committed `beforeAll` fixtures
   plus `afterAll` hard delete.
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
11. **Every journey has a Mermaid diagram.** Each `<workflow>.test.ts` has a matching section in
    the domain's diagram file (`test/workflows/<domain>/DIAGRAMS.md`): heading named after the
    test file, a 1-2 sentence intro, then a single ```mermaid block (`sequenceDiagram` for actor
    flows, `stateDiagram-v2` for state machines, `flowchart` for decision logic). Actor and step
    names must match the real service calls. Creating or updating a journey means creating or
    updating its diagram in the same change — never let them drift. Validate before considering
    the task done: `bun run validate:mermaid test/workflows/<domain>/DIAGRAMS.md` — every block
    must report `OK`.

## Running

```bash
bun run test:workflows
```
