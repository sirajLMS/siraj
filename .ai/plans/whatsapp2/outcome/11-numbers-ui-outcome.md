# 11 — Numbers Tab Extensions (purpose + coexistence surfaces)

- **Plan**: `.ai/plans/whatsapp2/` Phase 11
- **Date**: 2026-09-06
- **Requirements**: REQ-1 (purpose chips, purpose select in create/edit, sync status/progress on coexistence numbers)

## Deliverables

| Task | File(s) | State |
|---|---|---|
| 11.1 backend | `backend/graphql/pothos/whatsapp/whatsapp-account.pothos.ts` | exposes `purpose`, `onboardingMode`, `syncStatus`, `syncPhase`, `syncProgress` on `WhatsappAccount` (created enums via `shared/enum.pothos` registrations); `purpose` added **only** to `WhatsappAccountCreateInput` (initial assignment) — NOT to the shared update input (reassignment stays behind the gated `updateWhatsappAccountPurpose`, which now returns the account incl. `purpose` by construction) |
| 11.1 backend | `backend/graphql/mutation/whatsapp/whatsapp-account.mutation.ts` | create resolver maps `purpose: args.input.purpose ?? undefined` (no behavior change otherwise) |
| 11.1 codegen | schema + `frontend/common/graphql/generated/gql/graphql.ts` | `generate:gqlSchema` + `codegen` rerun (twice: after schema, after documents). `WhatsappAccountFields` fragment now carries purpose/onboardingMode/syncStatus/syncPhase/syncProgress; `updateWhatsappAccountPurposeMutationDocument` selects `purpose` |
| 11.1 docs | `sharedDocuments/whatsapp/whatsapp.documents.ts`, `whatsapp-inbox.documents.ts` | fragment extended; purpose-mutation selection gains `purpose` |
| 11.2 i18n | `shared/locale/{types,en,ar}/whatsapp/index.ts` | new `validationPurposeRequired` / `validationPurposeInvalid` keys (en+ar); `locale:snapshots` rerun (2 written, hash `01e10bb8165b7ae0`) |
| 11.2 | `whatsappFormValidation.ts` | `validatePurpose` (REQUIRED on empty, INVALID on non-member); `AccountCreateFormValues.purpose` (raw string form value) + `validateAccountCreateForm` now covers purpose |
| 11.2 | `whatsappPurposeOptions.ts` (new), `whatsappPurposeSelect.tsx` (new) | shared select + options/`resolvePurposeValue` guard (no enum casts) |
| 11.2 | `createAccountDialog/CreateAccountDialog.tsx` | purpose select (default GENERAL), validated on change + submit |
| 11.2 | `editNameDialog/EditNameDialog.tsx` | purpose select pre-seeded from `dialogState.purpose`; submit is now `(accountId, displayName, purpose)` |
| 11.3 | `whatsappStatusBadge.tsx` | `getWhatsappSyncStatusBadgeConfig` (NOT_STARTED→unknown, REQUESTED/SYNCING→running, COMPLETE→success, FAILED→failed) + `getWhatsappPurposeBadgeConfig` (GENERAL→unknown, STUDENTS→partial, ADVERTISING→success) on the `syncStatus` category |
| 11.3 | `whatsappSyncStatusLabel.ts` (new), `getPurposeLabelKey` | Record-lookup label-key helpers (no enum-comparison lints) |
| 11.3 | `tabs/shared/NumberCardPurposeSync.tsx` (new) + `NumberCardContent.tsx` | purpose chip + onboarding-mode chip with `coexistenceRestrictionsHint` tooltip (MUI `titleAccess` for a11y); coexistence-only sync badge + determinate `LinearProgress` + `syncProgress(percent)` while REQUESTED/SYNCING; `NumberCardLabels` Pick extended |
| 11.4 | `whatsappTabSharedProps.ts`, `types/whatsappSettingsTypes.ts`, `WhatsappTabPanels.tsx`, `useWhatsappSettingsViewModel.ts`, `tabs/__shared__/NumbersCreateEditDialogs.tsx`, both `NumbersTab.{desktop,mobile}.tsx` | VM gains `handleUpdatePurpose` (dedicated mutation, snackbars `purposeUpdated`/`purposeUpdateFailed`) and `validatePurpose`; `openEditNameDialog(id, name, purpose)`; dialogState carries `purpose`; edit submit = name update, then purpose mutation only when changed |
| 11.TE | `test/ui/components/whatsapp/whatsappNumberCardPurposeSync.test.tsx` (new, 9 tests), `whatsappNumbersCreateEditDialogs.test.tsx` (new, 2 tests), updates to `whatsappFormValidation.test.ts`, `whatsappCreateAccountDialog.test.tsx`, `whatsappEditNameDialog.test.tsx`, `whatsappMobileParity.test.tsx`, `whatsappCredentialDialogs.test.tsx`, `whatsappDeleteConfirmDialog.test.tsx`, `useWhatsappSettingsViewModel.test.tsx`, `helpers/whatsappTestHelpers.ts` | **written, NOT executed** (user constraint) |

## 11.QL

Every touched file passes `scripts/health/sub-loop.ts --lifecycle codescene` (exit 0), incl. cycle fixes:
`role="img"` → MUI `titleAccess`; `=== "COEXISTENCE"/"REQUESTED"` → generated-enum member comparisons; CodeScene test-body duplication → `renderCoexistenceCard` helper extraction.
Tests were used for tsgo-caught prop drift only; no UI test suite was executed.

Repo-wide tsgo still shows foreign in-flight errors (classDetails fixtures, `test/workflows/whatsapp/coexistence-routing.test.ts` skeleton — other agents), none on files touched here.

Regression: `frontend/common/graphql/test/whatsapp/whatsapp-inbox.test.ts` `purpose: null` added to the create input (codegen non-optional key); this test was not re-run from this phase (server test layer owned by Phase 9; its lifecycle already covered the mutation surface).

## 11.SEC

- Purpose reassignment only via the permission-gated mutation (`WHATSAPP_CONFIG_MANAGE`, active-only server rule) — the shared update input deliberately excludes `purpose`.
- Create input accepts `purpose` as initial assignment (service passes through; DB default GENERAL otherwise).
- No credential/token fields exposed; card reads only the fragment fields. Purpose select value validated against the enum set before submit.

## 11.SR

- No `...input` spread added by this phase (create resolver maps `purpose` explicitly).
- Record-based label/badge lookups; no switch-on-enum; badge configs keep the `syncStatus` category per the canonical whatsapp-ui-patterns doc.
- Zero prototype data in code; all values flow from the fragment.
- i18n keys consumed from the Phase-10 namespace only (plus the two new validation keys); interpolation uses `syncProgress(percent)`.

## 11.IV

Read/applied: root `AGENTS.md`; `frontend/AGENTS.md`; `frontend/common/views/AGENTS.md`; `frontend/{desktop,mobile}/AGENTS.md`; `frontend/common/graphql/sharedDocuments/AGENTS.md` (`id` on every selection, codegen rerun); `backend/graphql/pothos/AGENTS.md` (registered enums via `shared/enum.pothos`, no literal arrays); `test/ui/components/AGENTS.md` (whatsapp domain dir, TestWrapper guards); `.agents/instructions/frontend.instructions.md`; `docs/frontend/whatsapp-ui-patterns.md`.

## Follow-ups for Phase 12

- `WhatsappAccountRow` already carries all sync fields — the inbox tab can consume the same fragment.
- `whatsappSyncStatus` per-account query (Phase 9) is available if the Numbers card later wants live polling beyond the account row's snapshot fields.
