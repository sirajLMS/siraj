# Plan Review R1 — Student & Parent Portal Enhancements

Reviewed `specs.md`, `design.md`, `tasks.md` against root AGENTS.md + layer rules: backend/{services,types,db/repo,graphql}, frontend/{views,common/graphql}, shared, app.

## Violations Found & Fixed

1. **[frontend/views] design.md + tasks 4.2–4.4**: used deprecated `frontend/views/dashboard/...` paths.
   → Fixed: all views under `frontend/common/views/dashboard/<domain>/` + tier views in `frontend/desktop/` / `frontend/mobile/`; explicit note that `frontend/views/` is deprecated. Added: `useQuery` via `@apollo/client/react`, no `useLazyQuery`, TypedDocumentNode naming, `<RequirePermission>` UX-only (server guard via `requirePermissionForPage` in page.tsx per app/AGENTS.md), CodeScene 150-line tier limit, AppDataGrid/MobileCardList with `paginationOptions`, StatusBadge, theme-palette-only colors.

2. **[backend/types + db/repo] design F1:type/repo paths** used `backend/types/reports/` and a bespoke repo dir.
   → Fixed: mirror existing `report/` types subdir (verify in 0.2); repo must be `export namespace <Entity>Repository` in a domain-mirroring subdir with barrel wiring; added Neon `queryDb(tx)` rule for bare reads and prepared-statement constraints (TCP-only, never with `inArray`).

3. **[GraphQL enum registration] F2 enum change** added STUDENT to `LeaveRequesterType` without specifying canonical location or Pothos registration.
   → Fixed: canonical enum in `shared/constants/` (verify in 0.2), register once in `shared/enum.pothos.ts` if exposed, rerun schema gen + codegen.

4. **[Cold-start / permission propagation] services** did not state `UserPermissionContext` propagation.
   → Fixed: resolvers MUST pass `UserPermissionContext` from ctx; no re-query of `PermissionsService.getUserContext`; DomainError subclasses + `ctx.t("<namespace>")` / `getServerTranslations` for errors.

5. **[i18n] task 4.1** namespace creation lacked full registration chain.
   → Fixed: types interface + en/ar impls + `MessageSchema` + `serverLegacy.ts` `namespacePaths` + stable `defineNamespace` id.

6. **[AGENTS/instruction references]** tasks lacked layer file references for app/ and instructions for mobile-desktop.
   → Fixed per task.

## Still-to-verify during 0.2 analysis (intentionally left as analysis task)

- Exact `leave_requests` delay-target columns
- Canonical `LeaveRequesterType` location
- Package-name derivation path from invoices ↔ payments
- Existing reschedule/tracking UI role gating

No unresolved cross-file violations remain. **Plan passes all AGENTS.md rules for affected layers (round 1, patched).**
