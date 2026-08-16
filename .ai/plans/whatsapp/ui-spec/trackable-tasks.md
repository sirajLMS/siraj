# WhatsApp UI/UX Improvement — Trackable Tasks

## Document Information

- **Feature Name**: WhatsApp UI/UX Improvements
- **Target Directory**: `.ai/plans/whatsapp/ui-spec`
- **Outcome Directory**: `.ai/plans/whatsapp/ui-spec/outcome`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Copilot CLI
- **Related Documents**:
  - Requirements: `.ai/plans/whatsapp/ui-spec/specs.md`
  - Design: `.ai/plans/whatsapp/ui-spec/implementation.md`
  - Parent plan: `.ai/plans/whatsapp/` (do NOT modify)

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read**: Before executing ANY task, read ALL existing files in `.ai/plans/whatsapp/ui-spec/outcome/` to absorb prior research.
2. **Per-File Quality Verification Loop**: After modifying any file, run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on that file BEFORE moving to another file. The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in strict progressive order, short-circuiting at the first failure.
3. **Global Health Check (Completion Gate)**: Before marking any subtask as complete, run `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with zero errors.
4. **Post-Execution Outcome File Creation**: Upon completing a task, write `.ai/plans/whatsapp/ui-spec/outcome/<task-id>-outcome.md`.
5. **Task Progress Tracking**: Update task checkbox `[ ]` -> `[x]` in this file upon completion.

## MANDATORY Subtasks for Every Implementation Task

### Quality Loop Subtask (X.Y.QL)
```markdown
- [ ] X.Y.QL **Quality Loop**: Per-file verification on modified files
  - Run: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file
  - The sub-loop runs tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in strict order, short-circuiting at first failure
  - Fix all errors before proceeding to the next file
```

### Instruction Verification Subtask (X.Y.IV)
```markdown
- [ ] X.Y.IV **Instruction Verification**: Validate modified files against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-whatsapp/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, ...
  - Instructions: `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`, ...
```

### Layer-to-Instructions Mapping (Reference)

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj-whatsapp/AGENTS.md` | — |
| App Router | `/home/ahmed/Projects/siraj-whatsapp/app/AGENTS.md` | `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md` |
| Frontend Common | `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/common/graphql/sharedDocuments/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md` |
| Frontend Desktop | `/home/ahmed/Projects/siraj-whatsapp/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/mobile-desktop.instructions.md` |
| Frontend Mobile | `/home/ahmed/Projects/siraj-whatsapp/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/mobile-desktop.instructions.md` |
| Shared Locale | `/home/ahmed/Projects/siraj-whatsapp/shared/AGENTS.md` | (none) |
| Test UI | `/home/ahmed/Projects/siraj-whatsapp/test/ui/AGENTS.md` | `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/tests.instructions.md` |
| Frontend Common Components UI | `/home/ahmed/Projects/siraj-whatsapp/frontend/common/components/ui/AGENTS.md` | `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md` |
| Frontend Common Stores | `/home/ahmed/Projects/siraj-whatsapp/frontend/common/stores/AGENTS.md` | `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md` | Note: No task directly modifies stores — included for layer awareness only. |

## Implementation Overview

### Implementation Strategy
- **Phase 1**: Foundation — i18n keys, GraphQL documents, form validation, URL tab helper, label helpers (no UI changes, no visual regressions)
- **Phase 2**: Core UI — ViewModel wiring (create/update), URL-synced tabs, route boundaries, shared component adoption, status badges
- **Phase 3**: Component Features — create/edit dialogs, template persistence/preview, delete confirm with name, per-row loading
- **Phase 4**: Opt-in Features — non-admin history table, admin consolidated view, filters, bulk actions, audit trail
- **Phase 5**: Mobile Parity — mobile CRUD (dialogs, delete confirm, action menu), mobile templates preview, mobile opt-in history
- **Phase 6**: Polish — animations, transitions, RTL, accessibility, permission denied UI
- **Phase 7**: Testing — ViewModel tests, component tests, mobile parity tests
- **Phase 8**: Knowledge Propagation

### Development Approach
- **Testing Strategy**: TDD for validation functions. Component tests after implementation. ViewModel tests for new mutation flows.
- **Integration Strategy**: Phase-by-phase — each phase produces independently testable code.
- **Deployment Strategy**: No backend changes. All changes are frontend-only. Deploy with existing CI pipeline.

## Implementation Plan

### Phase 1: Foundation (No Visual Changes)

- [x] 1. **i18n Key Additions & Label Helpers**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Add new i18n keys to `shared/locale/types/whatsapp/index.ts`: form labels, validation messages, delete confirm interpolation, permission denied, retry, error boundary, template preview labels
  - Implement new keys in `shared/locale/en/whatsapp/index.ts`
  - Implement new keys in `shared/locale/ar/whatsapp/index.ts`
  - Add missing i18n keys: `tier100K`, `tier250K`, `tier1M`, and `qualityOrange` (no keys exist for these enum values — add to type schema + EN + AR locale files; per `implementation.md:577-599`)
  - Create `frontend/common/views/dashboard/settings/whatsapp/whatsappQualityLabel.ts` — maps quality enum → i18n key
  - Create `frontend/common/views/dashboard/settings/whatsapp/whatsappTierLabel.ts` — maps tier enum → i18n key
  - Create `frontend/common/views/dashboard/settings/whatsapp/whatsappTemplateStatusLabels.ts` — maps template status → i18n key
  - Verify: `grep -E "tier100K|tier250K|tier1M|qualityOrange" shared/locale/en/whatsapp/index.ts shared/locale/ar/whatsapp/index.ts shared/locale/types/whatsapp/index.ts` returns matches for all 4 keys in each file
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/shared/AGENTS.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/1-i18n-foundations-outcome.md`
  - Update progress: Mark task 1 as `[x]`
  - _Requirements: UI-REQ-3_

- [x] 2. **Form Validation Functions & Types Activation**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Create `frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation.ts` — validates displayName, phoneNumberId, wabaId, accessToken, twoStepPin
  - Activate dead types in `types/whatsappSettingsTypes.ts` — wire `WhatsappAccountFormValues`, `ApiFormValues`, `CredentialFormValues` to actual form usage
  - Create unit tests for validation functions in `test/ui/components/whatsappFormValidation.test.ts`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/tests.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`, `bun run test:ui:components`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/2-form-validation-outcome.md`
  - Update progress: Mark task 2 as `[x]`
  - _Requirements: UI-REQ-5_

- [x] 3. **GraphQL Document Additions & URL Tab Helper**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Add `whatsappTemplatesQueryDocument` to `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts` (query persisted templates). Note: The exported constant is camelCase (`whatsappTemplatesQueryDocument`); the PascalCase `WhatsappTemplatesQueryDocument` refers to the generated Operations **type**, not the exported constant (matching existing convention in `whatsapp.documents.ts`).
  - Add `whatsappOptInAuditQueryDocument` to `whatsapp.documents.ts` (query opt-in audit trail). Note: The exported constant is camelCase (`whatsappOptInAuditQueryDocument`); the PascalCase `WhatsappOptInAuditQueryDocument` refers to the generated Operations **type**, not the exported constant (matching existing convention in `whatsapp.documents.ts`).
  - Both new query documents MUST include `id` field on each object type selection for Apollo cache normalization (per `frontend/common/graphql/AGENTS.md` convention).
  - Run `bun run generate:gqlSchema` and `bun codegen` to generate types
  - Create `frontend/common/views/dashboard/settings/whatsapp/whatsappTabUrl.ts` — `useWhatsappTab` hook resolving tab from URL searchParams, with allowlist validation and router.replace
  - Add `TAB_PERMISSIONS` mapping to `whatsappConfig.constants.ts` — maps each tab ID to required permission
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/graphql/sharedDocuments/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/3-graphql-tab-url-outcome.md`
  - Update progress: Mark task 3 as `[x]`
  - _Requirements: UI-REQ-2, UI-REQ-4, UI-REQ-6_

### Phase 2: Core UI Infrastructure

- [x] 4. **Route Boundaries (loading.tsx & error.tsx)**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Create `app/(dashboard)/settings/whatsapp/loading.tsx` — skeleton loader using PageContainer + tab skeleton
  - Create `app/(dashboard)/settings/whatsapp/error.tsx` — "use client" error boundary with retry button, theme palette, i18n labels
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/app/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/4-route-boundaries-outcome.md`
  - Update progress: Mark task 4 as `[x]`
  - _Requirements: UI-REQ-7_

- [x] 5. **URL-Synced Tab Navigation Migration**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Modify `WhatsappConfigView.tsx`: Replace `useState<TabId>` with `useWhatsappTab()` hook, drop `ssr: false` from lazy loading
  - Create `WhatsappTabNav.tsx` — generic tab navigation using `GenericTabNav` via `ResponsiveViewSwitch`, reads activeTab from URL
  - Create `WhatsappTabPanels.tsx` — per-tab Suspense + RequirePermission wrapper, lazy-loads each tab content
  - Modify `WhatsappConfigLayout.tsx` — delegate tab rendering to WhatsappTabPanels (or repurpose as skeleton provider)
  - Remove or repurpose `whatsappConfig.desktop.tsx` and `whatsappConfig.mobile.tsx` (platform views replaced by client-side tab URL sync architecture)
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/5-url-synced-tabs-outcome.md`
  - Update progress: Mark task 5 as `[x]`
  - _Requirements: UI-REQ-4_

- [x] 6. **ViewModel Enhancement (Create/Update/Validation/Loading States)**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Wire `createWhatsappAccount` mutation → `handleCreate` with form validation
  - Wire `updateWhatsappAccount` mutation → `handleEditName` with validation
  - Add `whatsappTemplates` query → `templates` state (persisted templates) ⚠️ NOTE: As of this plan's writing, NO backend query resolver exists for persisted templates — templates currently come only as part of the `syncWhatsappAccountsFromMeta` mutation snapshot. A backend resolver must be created first, or use the sync mutation's template snapshot data as the source.
  - Add per-row loading states: `creating`, `deletingId`, `updatingId`, `syncingId`, `editingTokenForId`, `editingPinForId`
  - Refactor dialog state to consolidated `dialogState` object (create, editName, editToken, editPin, deleteConfirm)
  - Add validation function exposure to ViewModel contract
  - Add `mutationError` state for inline error display
  - Refactor snackbar to use `{ message, severity }` pattern (compatible with FormSuccessSnackbar/FormErrorSnackbar)
  - Expose `refetchTemplates` for manual refresh
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/6-viewmodel-enhancement-outcome.md`
  - Update progress: Mark task 6 as `[x]`
  - _Requirements: UI-REQ-1, UI-REQ-2, UI-REQ-5, UI-REQ-7_

- [x] 7. **Shared Component Adoption (Snackbars & StatusBadges)**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Create `whatsappStatusBadge.tsx` — WhatsApp status badge config mapping template statuses and account statuses to StatusBadge categories
  - Replace `tabs/components/NumbersSnackbar.tsx` with `FormSuccessSnackbar` + `FormErrorSnackbar` in `WhatsappSettingsContainer.tsx` (or `WhatsappConfigView.tsx`)
  - Replace inline `Chip` + `statusChipColor` in `tabs/shared/NumberCard.tsx` with `StatusBadge` + `whatsappStatusBadge` config
  - Replace inline `Chip` + `statusChipColor` in `tabs/shared/TemplatesTabContent.tsx` with `StatusBadge`
  - Update `tabs/shared/statusChipColor.ts` to add PAUSED, PENDING_DELETION, DISABLED cases (currently only handles template statuses: APPROVED/PENDING/REJECTED — these additional statuses are also template-level) (or deprecate in favor of whatsappStatusBadge config)
  - Note: Label wiring (replacing raw enum values with `t` property access) happens in Task 11 (Phase 3). Until then, Badge components will render with raw enum values — this is a known transient state between Phase 2 and Phase 3.
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/7-shared-components-outcome.md`
  - Update progress: Mark task 7 as `[x]`
  - _Requirements: UI-REQ-9, UI-REQ-10_

### Phase 3: Component Features

- [x] 8. **Create/Edit Account Dialogs**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Create `CreateAccountDialog.tsx` (shared common component): displayName, phoneNumberId, wabaId fields with inline validation, submit/cancel buttons, loading state
  - Create `EditNameDialog.tsx` (shared common component): displayName field pre-filled, validation, submit/cancel buttons, loading state
  - Wire "Add Account" button to `tabs/NumbersTab.desktop.tsx` and `tabs/NumbersTab.mobile.tsx`
  - Wire "Edit Name" menu item to both desktop and mobile NumbersTab variants
  - On success: close dialog + success snackbar + refetch accounts
  - On error: keep dialog open + error snackbar + inline mutationError
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/8-create-edit-dialogs-outcome.md`
  - Update progress: Mark task 8 as `[x]`
  - _Requirements: UI-REQ-1_

- [x] 9. **Template Persistence & Body Preview**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Wire `whatsappTemplates` query to `tabs/shared/TemplatesTabContent.tsx` — show persisted templates on mount ⚠️ NOTE: Backend resolver for a standalone templates query does not exist yet — either create it first (backend task) or use template snapshots from the `syncWhatsappAccountsFromMeta` mutation result
  - Add template body preview: expand row (desktop AppDataGrid) / expand card (mobile MobileCardList) to show body content, language, category, buttons
  - Replace raw status enum with localized label via `whatsappTemplateStatusLabels` helper
  - Add "Sync Templates" call-to-action button in empty state (when no templates exist)
  - Add error state with retry button when templates query fails
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/9-templates-persistence-outcome.md`
  - Update progress: Mark task 9 as `[x]`
  - _Requirements: UI-REQ-2, UI-REQ-3_

- [x] 10. **Delete Confirm with Account Name & Per-Row Loading**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Repair existing `DeleteConfirmDialog` in `tabs/NumbersTab.desktop.tsx:48-85` — fix it to render account name (`accountLabel`). Currently buggy: component ignores the `state` prop and shows generic text without the account name. Use `deleteConfirmMessage` interpolation key for "Delete '{displayName}'?".
  - Wire per-row `LinearProgress` (desktop) or skeleton overlay (mobile) using `deletingId` from ViewModel
  - Wire per-row sync icon spinner using `syncingId` from ViewModel (NEW state — current ViewModel only has boolean `syncing`)
  - Pass `displayName` from ViewModel `dialogState` to `DeleteConfirmDialog`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/10-delete-confirm-loading-outcome.md`
  - Update progress: Mark task 10 as `[x]`
  - _Requirements: UI-REQ-7, UI-REQ-8_

- [x] 11. **i18n Enum Localization (Wire All 31 Orphaned Keys)**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Modify `tabs/shared/NumberCard.tsx`: Replace raw enum interpolation of `quality` with `t.qualityGreen` helper (current code renders `{account.qualityRating}` directly — no toUpperCase, just raw enum value)
  - Modify `tabs/shared/NumberCard.tsx`: Replace raw enum interpolation of `tier` with `t.tier1K` helper (current code renders `{account.portfolioMessagingLimitTier}` directly)
  - Modify `tabs/shared/TemplatesTabContent.tsx`: Replace raw enum interpolation of `template.status` with `t.templateStatusApproved` helper (same pattern — raw value, not toUpperCase)
  - Add conditional rendering for warning labels (verify `coexistenceWarning` and `unverifiedWarning` keys exist in locale — if not, add them as new keys) in `tabs/shared/NumberCard.tsx` (when `verified=false` or coexistence mode)
  - Add conditional rendering for `warningTierExceeded` and `warningCoexistence` labels
  - Wire `throughput24h` label as throughput metric label
  - Wire delivery failure keys to notification error display (if applicable in UI)
  - Wire `permissionDenied` label to RequirePermission fallback
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/shared/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Verify: `grep -rE "\{.*\.(qualityRating|portfolioMessagingLimitTier|throughputLevel|status)\}" --include="*.tsx" frontend/common/views/dashboard/settings/whatsapp/` returns 0 results (audit for raw enum interpolation leaks)
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/11-i18n-localization-outcome.md`
  - Update progress: Mark task 11 as `[x]`
  - _Requirements: UI-REQ-3_

### Phase 4: Opt-in Features (Deferred from Parent Plan)

- [x] 12. **Non-Admin Opt-in History Table**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Wire `whatsappOptInAuditQuery` to `tabs/shared/OptInTabContent.tsx` for non-admin users
  - Add history table (desktop: AppDataGrid; mobile: MobileCardList) showing: date, action (opted in/out), changedBy
  - Add date range filter (desktop: FilterButton with date pickers; mobile: simple date filter)
  - Add CSV export for selected entries (desktop: ExportButton; mobile: export button)
  - Add empty state when no audit entries exist
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/12-optin-history-outcome.md`
  - Update progress: Mark task 12 as `[x]`
  - _Requirements: UI-REQ-6_

- [x] 13. **Admin Opt-in Consolidated View**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Add admin consolidated view to `tabs/shared/OptInTabContent.tsx`: table of all users' opt-in states with search/filter
  - Desktop: AppDataGrid with columns (userName, optedIn, optedInAt, actions)
  - Mobile: MobileCardList with cards per user
  - Add search filter (by user name)
  - Add admin bulk actions (if applicable per requirements)
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/13-admin-optin-view-outcome.md`
  - Update progress: Mark task 13 as `[x]`
  - _Requirements: UI-REQ-6_

### Phase 5: Mobile/Desktop Parity

- [x] 14. **Mobile Numbers Tab Full CRUD**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Modify `tabs/NumbersTab.mobile.tsx` to support full CRUD (reverses Q10 read-only decision)
  - Add action menu (Bottom Sheet or Speed Dial) per account card
  - Wire DeleteConfirmDialog to mobile (same shared component as desktop)
  - Wire credential dialogs (Edit Token, Edit Pin) to mobile (Dialog fullScreen on small viewports)
  - Wire CreateAccountDialog to mobile
  - Wire EditNameDialog to mobile
  - Add "Add Account" button on mobile
  - Add per-row loading: skeleton overlay on affected card
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/14-mobile-crud-outcome.md`
  - Update progress: Mark task 14 as `[x]`
  - _Requirements: UI-REQ-12_

- [x] 15. **Mobile Templates Preview & Opt-in History**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Modify `tabs/TemplatesTab.mobile.tsx`: use MobileCardList with expandable cards for template body preview
  - Replace raw status with localized labels (via `whatsappTemplateStatusLabels`)
  - Modify `tabs/OptInTab.mobile.tsx`: add non-admin history as MobileCardList with date filter
  - Modify `tabs/OptInTab.mobile.tsx`: add admin consolidated list view (MobileCardList)
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/15-mobile-templates-optin-outcome.md`
  - Update progress: Mark task 15 as `[x]`
  - _Requirements: UI-REQ-12_

### Phase 6: Polish (Animations, RTL, Accessibility)

- [x] 16. **Animations & Transitions**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Add tab fade-in transition: `@keyframes whatsappTabFadeIn` in WhatsappTabPanels (200ms ease-in-out, opacity + translateY)
  - Add row enter animation: MUI Fade + Grow on new account row (300ms)
  - Add row delete fade-out: MUI Fade out before removing (300ms)
  - Add sync icon pulse: `@keyframes whatsappSyncPulse` infinite loop (1s)
  - Verify opt-in toggle uses MUI Switch default transition
  - Verify dialogs use MUI Dialog default transition (fade + scale)
  - Verify snackbars use MUI Snackbar default slide transition
  - Ensure RTL: animations respect RTL direction (slide direction reversed for Arabic locale)
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/16-animations-outcome.md`
  - Update progress: Mark task 16 as `[x]`
  - _Requirements: UI-REQ-11_

- [x] 17. **Accessibility & Permission Denial UI**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Add `aria-invalid` to all form fields with validation errors
  - Add `aria-busy` to all loading containers (skeletons, per-row loaders)
  - Verify Dialog focus trap and Escape key close (MUI default)
  - Add `aria-label` to icon-only buttons (sync, delete, edit menu)
  - Replace `RequirePermission` `fallback={null}` with actual "Permission Denied" UI (Typography + icon)
  - Add `role="alert"` to error states and `role="status"` to loading skeletons
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/frontend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/17-accessibility-outcome.md`
  - Update progress: Mark task 17 as `[x]`
  - _Requirements: UI-REQ-7, UI-REQ-9_

### Phase 7: Testing

- [x] 18. **ViewModel Tests (Create/Update/Validation/Loading)**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Add tests to `test/ui/components/useWhatsappSettingsViewModel.test.tsx`:
    - Create account mutation flow (valid input → success snackbar)
    - Create account with invalid input (validation blocks mutation)
    - Update account name mutation flow
    - Edit name with invalid input
    - Delete confirm dialog cancellation (no mutation called)
    - Sync loading state (syncingId set during mutation) (NEW state — current ViewModel only has boolean `syncing`)
    - Credential dialog submission with validation (token too short, PIN wrong format)
    - Per-row loading states (deletingId, syncingId correctness)
    - Snackbar close behavior
    - Opt-in toggle loading state
  - Note: Since `renderHook` is unavailable in `bun:test`, use a consumer-component pattern (render a small component that calls the hook and returns results) for ViewModel hook tests.
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each test file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/test/ui/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/tests.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`, `bun run test:ui:components`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/18-viewmodel-tests-outcome.md`
  - Update progress: Mark task 18 as `[x]`
  - _Requirements: UI-REQ-1, UI-REQ-5, UI-REQ-7_

- [x] 19. **Component Tests (Dialogs, Tabs, Parity)**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/`
  - Create `test/ui/components/whatsappCreateAccountDialog.test.tsx`: fields render, validation errors, submit disabled, onSubmit called with valid data
  - Create `test/ui/components/whatsappEditNameDialog.test.tsx`: pre-filled name, validation, submit
  - Create `test/ui/components/whatsappDeleteConfirmDialog.test.tsx`: shows account name, cancel vs confirm
  - Create `test/ui/components/whatsappCredentialDialogs.test.tsx`: edit token dialog validation, edit pin dialog validation, submit flows (per `implementation.md:134`)
  - Create `test/ui/components/whatsappTemplatesTab.test.tsx`: renders persisted templates, empty state with CTA, body preview expands
  - Create `test/ui/components/whatsappOptInTab.test.tsx`: non-admin toggle, admin consolidated table, history entries
  - Create `test/ui/components/whatsappMobileParity.test.tsx`: mobile CRUD renders dialogs, mobile templates expandable, mobile opt-in history
  - Create `test/ui/components/whatsappUrlTabNav.test.tsx`: tab deep-linking, invalid tab fallback
  - **Note**: Use `renderWithWrapper` from `test/ui/components/TestWrapper.tsx` with mocked Apollo `MockLink` responses for all component tests (per `test/ui/AGENTS.md`).
  - **Note**: All tests use `bun:test` imports and Happy DOM environment (NOT Vitest). Run via `bun run test:ui:components`.
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each test file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - **Instruction Verification**: Validate against `/home/ahmed/Projects/siraj-whatsapp/test/ui/AGENTS.md`, `/home/ahmed/Projects/siraj-whatsapp/.agents/instructions/tests.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint`, `bun run test:ui:components`
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/19-component-tests-outcome.md`
  - Update progress: Mark task 19 as `[x]`
  - _Requirements: UI-REQ-1 through UI-REQ-12_

### Phase 8: Knowledge Propagation

- [x] 20. **Knowledge Propagation & Documentation**
  - Read all existing files in `.ai/plans/whatsapp/ui-spec/outcome/` to synthesize all learnings
  - Create canonical reference doc under `docs/frontend/whatsapp-ui-patterns.md` consolidating patterns, rules, and gotchas discovered during implementation
  - Update `frontend/common/views/AGENTS.md` with new rules/patterns and reference to the new doc
  - Update `frontend/views/AGENTS.md` if mobile/desktop parity patterns changed
  - Update `frontend/AGENTS.md` with any new MUI v9 or React 19 patterns discovered
  - Update `.agents/skills/frontend-patterns/SKILL.md` if new patterns affect the skill's domain
  - Update `.agents/instructions/frontend.instructions.md` if new conventions should be enforced
  - Update `.agents/instructions/mobile-desktop.instructions.md` if mobile/desktop patterns changed
  - Update root `AGENTS.md` Important References section with the new doc
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each modified file (handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command)
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - Write outcome file: `.ai/plans/whatsapp/ui-spec/outcome/20-knowledge-propagation-outcome.md`
  - Update progress: Mark task 20 as `[x]`
  - _Requirements: REQ-0_

## Task Summary

| Task | Title | Phase | Requirements |
|---|---|---|---|
| 1 | i18n Key Additions & Label Helpers | Foundation | UI-REQ-3 |
| 2 | Form Validation Functions & Types Activation | Foundation | UI-REQ-5 |
| 3 | GraphQL Document Additions & URL Tab Helper | Foundation | UI-REQ-2, 4, 6 |
| 4 | Route Boundaries (loading.tsx & error.tsx) | Core UI | UI-REQ-7 |
| 5 | URL-Synced Tab Navigation Migration | Core UI | UI-REQ-4 |
| 6 | ViewModel Enhancement | Core UI | UI-REQ-1, 2, 5, 7 |
| 7 | Shared Component Adoption | Core UI | UI-REQ-9, 10 |
| 8 | Create/Edit Account Dialogs | Component Features | UI-REQ-1 |
| 9 | Template Persistence & Body Preview | Component Features | UI-REQ-2, 3 |
| 10 | Delete Confirm & Per-Row Loading | Component Features | UI-REQ-7, 8 |
| 11 | i18n Enum Localization | Component Features | UI-REQ-3 |
| 12 | Non-Admin Opt-in History Table | Opt-in Features | UI-REQ-6 |
| 13 | Admin Opt-in Consolidated View | Opt-in Features | UI-REQ-6 |
| 14 | Mobile Numbers Tab Full CRUD | Mobile Parity | UI-REQ-12 |
| 15 | Mobile Templates Preview & Opt-in | Mobile Parity | UI-REQ-12 |
| 16 | Animations & Transitions | Polish | UI-REQ-11 |
| 17 | Accessibility & Permission Denial UI | Polish | UI-REQ-7, 9 |
| 18 | ViewModel Tests | Testing | UI-REQ-1, 5, 7 |
| 19 | Component Tests | Testing | All |
| 20 | Knowledge Propagation | Final | REQ-0 |

## Progress Summary

- **Total Tasks**: 20
- **Completed**: 0
- **Remaining**: 20
- **Estimated Effort**: ~60-80 hours (frontend-only changes)
- **No backend changes needed**: All backend resolvers already exist
