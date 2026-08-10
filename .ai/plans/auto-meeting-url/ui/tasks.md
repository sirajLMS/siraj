# Tasks: Auto-Meeting-URL UI/UX Improvement Plan

**Feature Name**: Auto-Meeting-URL UI Enhancement  
**Target Directory**: `.ai/plans/auto-meeting-url/ui`  
**Outcome Directory**: `.ai/plans/auto-meeting-url/ui/outcome`  
**Version**: 1.0  
**Date**: 2026-08-02  
**Related Documents**:
- Requirements: [requirements.md](./requirements.md)
- Design: [design.md](./design.md)

---

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read**: Read ALL files in `.ai/plans/auto-meeting-url/ui/outcome/` before starting.
2. **Per-File Quality Verification Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` for each modified/created file after each edit. The script runs tsgo → biome → oxlint → lint → check:duplicates → codescene progressively, short-circuiting at the first failure — fix and re-run until it exits 0.
3. **Global Health Check**: After all per-file sub-loop runs pass, run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified/created file as a final sweep (adds check:duplicates + codescene on top of lint stage). Alternatively run `bun quality-gate` for full-repo sequential verification.
4. **Post-Execution Outcome File Creation**: Write `.ai/plans/auto-meeting-url/ui/outcome/<task-id>-outcome.md`.
5. **Task Progress Tracking**: Update `[ ]` → `[x]` in this file.

### Layer-to-Instructions Mapping (for all frontend tasks)

| Layer | AGENTS.md Files | Instruction Files |
|-------|-----------------|-------------------|
| Frontend Common | `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/common/graphql/AGENTS.md` | `/home/ahmed/Projects/siraj-meetings/.agents/instructions/frontend.instructions.md` |
| Frontend Desktop | `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/desktop/AGENTS.md` | `/home/ahmed/Projects/siraj-meetings/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj-meetings/.agents/instructions/mobile-desktop.instructions.md` |
| Frontend Mobile | `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/mobile/AGENTS.md` | `/home/ahmed/Projects/siraj-meetings/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj-meetings/.agents/instructions/mobile-desktop.instructions.md` |
| Shared Locale | `/home/ahmed/Projects/siraj-meetings/shared/AGENTS.md` | (none) |
| Test UI | `/home/ahmed/Projects/siraj-meetings/test/ui/AGENTS.md` | `/home/ahmed/Projects/siraj-meetings/.agents/instructions/tests.instructions.md` |

---

## Implementation Overview

### Implementation Strategy
- **Foundation-first**: Start with i18n namespaces and shared types, then build leaf components, then integrate into views
- **Component-by-component**: Each component is independently testable with Storybook and unit tests
- **Desktop-first, mobile-second**: Build desktop variant, then mirror to mobile using `ResponsiveViewSwitch`
- **Backend-agnostic**: All components handle missing backend fields gracefully (null checks for `expiresAt`, `meetingUrlStatus`)

### Development Approach
- **Testing Strategy**: Component tests (Happy DOM + mocked Apollo) for each component, E2E for critical paths (OAuth, config CRUD), Storybook stories for all states
- **Integration Strategy**: Components integrate via ViewModel hooks, never direct GraphQL calls in view components
- **Deployment Strategy**: Frontend-focused with prerequisite GraphQL schema field additions (Pothos) only — no new resolvers, services, or backend business logic. See task 2 prerequisite note and design.md §1.

---

## Phase 1: i18n Foundation & Shared Types

- [ ] 1. **Create i18n translation namespaces**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read `/home/ahmed/Projects/siraj-meetings/shared/AGENTS.md`
  - Read `/home/ahmed/Projects/siraj-meetings/shared/locale/namespaces/dashboard/settings/meetingIntegrations.namespace.ts` (existing namespace)
  - **NOTE:** There is currently NO `Dashboard.ProfileMeetingConfigs` namespace in the codebase. The actual namespace used by profile meeting configs is `Ui.MeetingConfig` (registered in `shared/locale/namespaces/translation.ts` as `Translation.Ui.MeetingConfig`, used at `useMeetingConfigsTabViewModel.ts:17` as `useAppTranslation(Translation.Ui.MeetingConfig)`). Extend the existing `Ui.MeetingConfig` namespace with the profile-side meeting-config keys below. The registration steps below apply ONLY to brand-new namespaces (e.g. `Dashboard.MeetingUrlStatus`, `Dashboard.OAuthFlow`, `Dashboard.MeetingGeneration`) — NOT to `Ui.MeetingConfig` which already exists.
  - **Complete registration file checklist for each new namespace** (per `shared/AGENTS.md` — ALL seven/eight files MUST be touched or the locale system will not compile):
    1. Namespace file: `shared/locale/namespaces/dashboard/<area>/<name>.namespace.ts` — `defineNamespace<T>("dashboard.<area>.<name>", { load: { en, ar } })` with `const Dashboard<Area><Name> = ...`.
    2. Type file: `shared/locale/types/dashboard/<area>/<name>.ts` — `export interface <Area><Name>Labels { readonly ... }`.
    3. Type re-export: append to `shared/locale/types/dashboard/<area>/index.ts` — `export type { <Area><Name>Labels } from "./<name>";`.
    4. EN impl: `shared/locale/en/dashboard/<area>/<name>.ts` — `export const dashboard<Area><Name>En: <Area><Name>Labels = { ... };`.
    5. AR impl: `shared/locale/ar/dashboard/<area>/<name>.ts` — `export const dashboard<Area><Name>Ar: <Area><Name>Labels = { ... };`.
    6. Registration: edit `shared/locale/namespaces/translation.ts` — import the new namespace class and add it to the `Translation.Dashboard` map (use the same key name as the `<Name>` in the PascalCase map, e.g. `MeetingUrlStatus: DashboardMeetingUrlStatus`).
    7. (Optional) `shared/locale/server.ts` path mapping if referenced by Server Components (`getTranslations`) — skip if not needed for compile. For API Routes / Scripts / Tests, use `shared/locale/server-graphql.ts` (`getServerTranslations`) instead. Do NOT reference a non-existent `serverLegacy.ts` file.
    8. (Optional) Wire the namespace via the `LocaleProvider` in `app/layout.tsx` (most namespaces are resolved via the type map automatically; verify it compiles without manual wiring — see existing namespaces as reference).
    9. **Add the namespace type to `shared/locale/types/message.ts`** — this is required per `shared/AGENTS.md` step 3 and was previously omitted. The `message.ts` file aggregates all locale type modules so the compile-time translation system can resolve namespaces type-safely.
  - For keys added to an EXISTING namespace, you must update only that namespace's TYPE file (`shared/locale/types/dashboard/<area>/<name>.ts`), EN impl, AR impl, AND any `index.ts` re-export / `translation.ts` map entry already present — do not introduce a duplicate namespace class.
  - Add new keys to existing `meetingIntegrations` namespace (en + ar):
    - `totalProviders`, `connectedProviders`, `providersWithIssues`, `disconnectedProviders`
    - `connectProvider`, `connecting`, `connectProviderSuccess`, `connectProviderError`
    - `viewProfileMeetingConfigs`, `adminProviderSettings`
    - `clientIdRequired`, `clientSecretRequired`, `scopesRequired`
    - `credentialFormCreateTitle`, `credentialFormEditTitle`, `credentialsSaved`
    - `testConnectionIdle`, `testConnectionTesting`, `testConnectionFailure`, `retryTest`
    - NOTE: Reuse existing keys — do NOT add `testConnectionSuccess`, `revokeTokenTitle`, or `revokeTokenWarning`. Reuse `testSuccess` (NOT `testConnectionSuccess`), and `actions.revokeConfirmTitle` / `actions.revokeConfirm` (NOT `revokeTokenTitle` / `revokeTokenWarning`). See design.md §7.
    - `revoke`, `tokenRevoked`
    - `tokenMetadata`, `tokenIssuedAt`, `tokenExpiresAt`, `tokenScopes`, `tokenType`
    - `copyEndpointUrl`, `endpointCopied`
  - Add new keys to existing `Ui.MeetingConfig` namespace (en + ar):
    - `oauthCallbackSuccess`, `oauthCallbackError`, `reconnectAll`, `reconnecting`, `reconnectAllSuccess`, `reconnectAllError`
    - `expiresInDays`, `expiresInHours`, `expired`, `reconnect`
    - `copyMeetingUrl`, `urlCopied`, `urlCopyFailed`
    - `generationPending`, `generationSuccess`, `generationFailed`, `retryGeneration`, `generationPreviewCallout`, `testConfig`, `previewUrlGenerated`
    - `connectFirstProvider`, `connectFirstProviderDescription`
    - `disconnectWarningTitle`, `disconnectWarningMessage`, `disconnectWarningImpact`
  - Create new namespace `Dashboard.MeetingUrlStatus` (en + ar):
    - `urlPending`, `urlReady`, `urlFailed`, `urlExpired`, `joinMeeting`, `copyUrl`, `retryUrlGeneration`, `urlNotGenerated`, `setupMeetingConfig`
  - Create new namespace `Dashboard.OAuthFlow` (en + ar):
    - `connectingTo`, `redirectingToProvider`, `connectionSuccessful`, `connectionFailed`, `tokenExpired`, `tokenExpiringSoon`, `reconnectNow`, `remindMeLater`
  - Create new namespace `Dashboard.MeetingGeneration` (en + ar):
    - `autoGenerateEnabled`, `autoGenerateDescription`, `generationPreview`, `generationStatusPending`, `generationStatusSuccess`, `generationStatusFailed`, `generationRetry`, `generationSuccessRate`, `generationAvgTime`
  - Update type files in `shared/locale/types/dashboard/`:
    - `settings/meeting-integrations.ts` — add new keys to interface
    - `profile/meeting-configs.ts` — add new keys to interface
    - Create `meeting-url-status.ts` — new type file
    - Create `oauth-flow.ts` — new type file
    - Create `meeting-generation.ts` — new type file
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` for each modified/created file (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `shared/AGENTS.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/1-i18n-foundation-outcome.md`
  - Update progress: Mark task 1 as `[x]`
  - _Requirements: AC-8.1, AC-8.2 (i18n completeness)_

- [ ] 2. **Create shared meeting UI types (gap-only extensions over codegen types)**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read `/home/ahmed/Projects/siraj-meetings/frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents.ts` and `meeting/meeting.documents.ts` (existing GraphQL documents for reference types)
  - **Prerequisite task note (CRITICAL):** Before authoring any local UI type here, update the GraphQL schema (Pothos) to expose the fields the UI needs — `meetingUrlStatus`, `meetingUrlExpiresAt`, `meetingUrlError` on the relevant meeting/class-meeting-config objects (and any other new fields downstream tasks query) — then run `bun run generate:gqlSchema && bun codegen` so the canonical types come from codegen (`@/frontend/common/graphql/generated/gql/graphql-types`). Do NOT redefine here types that already exist or can be codegen-derived.
  - Create the type file at **`frontend/common/views/dashboard/settings/types/meeting-ui.types.ts`** (NOT `frontend/common/types/meeting-ui.types.ts` — that previous path was wrong; types live alongside the consuming views). Mirror the layout of the existing settings types files under `frontend/common/views/dashboard/settings/types/`.
  - Types must be **gap-only extensions over codegen types**: define ViewModels/derived shapes using `Pick`/`Omit`/intersection over the codegen types from `@/frontend/common/graphql/generated/gql/graphql-types` rather than re-declaring duplicate string-literal unions. Only declare genuinely-UI-only unions (e.g. `TestConnectionState`, `GenerationStatus`) that have no codegen equivalent. Linked `UseSubscription`/`Mutation` types must reference the codegen document types.
  - Sketch (adapt to whatever codegen exposes after the prerequisite codegen run):
    ```typescript
    // e.g. UI-only status unions with no backend/codegen equivalent:
    export type TestConnectionState = "idle" | "testing" | "success" | "failure";
    // Prefer: export type MeetingUrlStatus = NonNullable<GetClassMeetingConfigQuery['classMeetingConfigs'][number]['meetingUrlStatus']>;
    // gap-only structures:
    export interface TestConnectionResult { success: boolean; latency?: number; endpoint?: string; authStatus?: string; error?: string; }
    export interface ProviderEndpoint { name: string; url: string; method: "GET" | "POST"; }
    export interface TokenMetadata { issuedAt: string; expiresAt: string | null; scopes: string[]; tokenType: string; }
    ```
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` for the new file (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/views/AGENTS.md` (paths), `backend/types/AGENTS.md` rules for `Pick`/`Omit` extension shapes (cross-reference), `backend/graphql/AGENTS.md` if schema additions were made there
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/2-shared-types-outcome.md`
  - Update progress: Mark task 2 as `[x]`
  - _Requirements: All (type foundation)_

---

## Phase 2: Settings Tab Component Redesign

- [ ] 3. **Redesign `MeetingIntegrationsHealthHeaders` with MetricCardGrid**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md`
  - Read `/home/ahmed/Projects/siraj-meetings/frontend/common/views/dashboard/settings/components/meetingIntegrations/` (existing components)
  - Read `/home/ahmed/Projects/siraj-meetings/frontend/common/components/ui/` (find MetricCardGrid components)
  - Replace raw `Card` + `Grid` with `DesktopMetricCardGrid` (desktop) / `MobileMetricCardGrid` (mobile)
  - Define 4 metric cards: Total Providers, Connected, Issues, Disconnected
  - Each `MetricItem` (from `@/frontend/common/types/shared.types`) must use the actual shape: `{ key: string, count: number|string, labelKey: string, icon: SvgIconComponent, label?: string, subLabel?: string, variant?: "default"|"error"|"highlight"|"danger" }` — NOT the old `{ label, value, icon, color }` shape. Use `count` for the numeric value, `labelKey` (or `label`) for the human label, and `variant` (e.g. `"error"` for the disconnected card) instead of a `color` field. Wire colors via `variant` + theme palette (no hardcoded).
  - Icons: `DnsOutlined`, `CheckCircleOutlined`, `WarningOutlined`, `CloudOffOutlined`
  - Loading state: Skeleton placeholder cards
  - Empty state: All metrics show 0 with `text.secondary`
  - Error state: Red metric card (`variant: "error"`)
  - Accessibility: `aria-label` per card with full description
  - Create desktop variant: `meetingIntegrationsHealthHeaders.desktop.tsx` (under `frontend/desktop/views/dashboard/settings/components/meetingIntegrations/`)
  - Create mobile variant: `meetingIntegrationsHealthHeaders.mobile.tsx` (under `frontend/mobile/views/dashboard/settings/components/meetingIntegrations/`)
  - Use `ResponsiveViewSwitch` to switch between variants
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component) — the ViewModel (`useMeetingIntegrationsViewModel`, task 29) resolves strings via `useAppTranslation(Translation.Dashboard.SettingsMeetingIntegrations)` and passes them down. See `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` on all modified/created files (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/3-health-headers-outcome.md`
  - Update progress: Mark task 3 as `[x]`
  - _Requirements: AC-1.1 (MetricCardGrid for health cards)_

- [ ] 4. **Redesign `ConnectedAccountsTable` with DesktopAppDataGrid/MobileCardList**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md`
  - Read existing `frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.tsx` component
  - Read existing `DesktopAppDataGrid` and `MobileCardList` component APIs (check existing usage in Session Config tab as reference)
  - Replace raw MUI `DataGrid` with `DesktopAppDataGrid` (desktop variant) — columns are standard `GridColDef[]` and `paginationOptions: ListPaginationOptions` is a REQUIRED prop (not optional). Pass `paginationOptions` from the ViewModel (client-side or server-side per existing Session Config tab pattern).
  - Create `MobileCardList` variant for mobile — likewise requires `paginationOptions` (passed from ViewModel).
  - Define columns: Provider (icon+name), User Email, Connected Date, Token Expiry, Status Badge, Actions
  - Add status badge: `OAuthConnectionStatusBadge` (will be built in Phase 4)
  - Permission-gate action column: hide if `!canEdit` (use `AppPermission.SettingsEditMeetingIntegrations` enum, not a bare string literal — see Fix on permissions)
  - Actions: Test connection, View metadata, Revoke token
  - Filters: search input + status filter dropdown
  - Column sort: By provider name, connected date, token expiry
  - Loading: Table skeleton with shimmer rows
  - Empty: Typography `text.secondary` "No connected accounts"
  - Error: Alert with error message + retry
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7, tier views receive `labels` via props from the ViewModel, which owns all `useAppTranslation` calls.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`, `frontend/common/graphql/AGENTS.md` (documents for queries), `.agents/instructions/mobile-desktop.instructions.md` (desktop/mobile variants)
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/4-connected-accounts-table-outcome.md`
  - Update progress: Mark task 4 as `[x]`
  - _Requirements: AC-1.2 (DesktopAppDataGrid for connected accounts)_

- [ ] 5. **Redesign `MeetingProviderCredentialForm` with zod validation**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.tsx` component
  - Read existing form patterns (Session Config form dialog as reference)
  - Import `react-hook-form`, `@hookform/resolvers/zod`, `zod`
  - Define zod schema using the **factory pattern** `createCredentialFormSchema(labels)` that injects pre-resolved label strings into the schema (NOT a `t` function). See existing form patterns (Session Config form dialog) for the `createXxxFormSchema(labels)` convention. Pin the schema to a `schemas/` subdirectory: `frontend/common/views/dashboard/settings/schemas/credentialForm.schema.ts` (mirroring the existing `sessionConfigForm.schema.ts` / `systemSettingForm.schema.ts` siblings). Schema fields: `clientId` (required), `clientSecret` (required), `tenantId` (optional), `scopes` (array, min 1), `webhookSecret` (optional).
  - Validation messages use the injected label strings (resolved in the ViewModel and passed in)
  - Add `EntityFormDialogActions` for footer (submit/cancel) — note `EntityFormDialogActions` props are `formId`, `cancelLabel`, `saveLabel` (NOT `confirmLabel`), `onClose`, `isLoading` (NOT `loading`). Pass already-translated `saveLabel`/`cancelLabel`.
  - Password fields with show/hide toggle for secrets (`IconButton` with `VisibilityOutlined` / `VisibilityOffOutlined`)
  - Scopes: Multi-select chips (add/remove)
  - Create config form fields specific to provider type (Zoom: accountId, MS Teams: tenantId)
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/5-credential-form-outcome.md`
  - Update progress: Mark task 5 as `[x]`
  - _Requirements: AC-1.3 (zod validation for credential forms)_

- [ ] 6. **Redesign `RevokeTokenDialog` with BaseDeleteDialog**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog.tsx` component
  - Read existing `BaseDeleteDialog` component API at `frontend/common/components/ui/dialog/BaseDeleteDialog.tsx` (check existing usage in Session Config tab)
  - Replace raw `Dialog` with `BaseDeleteDialog` — wrap `BaseDeleteDialog` directly in this per-entity wrapper component (there is **NO `useBaseDeleteDialog(params)` hook** — do not reference it; the real pattern is a thin wrapper component passing props straight to `BaseDeleteDialog`)
  - `BaseDeleteDialog` props (verify against actual API): `open`, `onClose`, `onConfirm`, `title`, `body` (NOT `message`), `cancelLabel`, `confirmLabel`, `isLoading` (NOT `loading`), optional `confirmSx`
  - Title: translated "Revoke Token"
  - Body: translated warning about impact on meeting configs (pass as `body` prop)
  - Confirm: translated "Revoke" button
  - Loading state: confirm button shows `CircularProgress` (pass `isLoading`)
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/6-revoke-dialog-outcome.md`
  - Update progress: Mark task 6 as `[x]`
  - _Requirements: AC-1.4 (BaseDeleteDialog for revoke)_

- [ ] 7. **Redesign `TestConnectionResultPanel` with proper states**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.tsx` component
  - Add states: idle (empty Typography `text.secondary`), testing (`CircularProgress`), success (`Alert severity="success"`), failure (`Alert severity="error"` + retry button)
  - Show: latency, endpoint reached, authentication status
  - `aria-live="polite"` for status updates
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/7-test-connection-panel-outcome.md`
  - Update progress: Mark task 7 as `[x]`
  - _Requirements: AC-1.1 (test connection states)_

- [ ] 8. **Redesign `EndpointList` and Enhance `TokenMetadataDialog`**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/settings/components/meetingIntegrations/TokenMetadataDialog.tsx` and `.../EndpointList.tsx`
  - `TokenMetadataDialog`: Add copy token ID button, show scopes as chips, loading state
  - `EndpointList`: Add copy URL button per endpoint with toast notification
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/8-metadata-endpoints-outcome.md`
  - Update progress: Mark task 8 as `[x]`
  - _Requirements: AC-1.1 (admin diagnostic improvements)_

- [ ] 9. **Create `ConnectProviderAction` component (settings tab)**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction.tsx`
  - "Connect" button for unconnected providers in connected accounts table
  - Call `connectMeetingProviderOAuth` mutation → redirect to `authorizeUrl`
  - Loading state: `CircularProgress` (button size), disabled, "Connecting..."
  - Error state: Alert with translated error + retry
  - `aria-label="Connect {providerName} OAuth"`
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/9-connect-provider-action-outcome.md`
  - Update progress: Mark task 9 as `[x]`
  - _Requirements: AC-1.5 (Connect Provider button in settings)_

- [ ] 10. **Create `ProfileLinkCallout` cross-navigation component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/views/dashboard/settings/components/meetingIntegrations/ProfileLinkCallout.tsx`
  - "View Teacher Meeting Configs" button → `/profile?tab=meeting`
  - Note: the canonical settings-tab config lives at `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts` (includes the `config/` directory — full path is `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts`, NOT `frontend/common/views/dashboard/settings/settingsTabs.config.ts`). Reference it for the `meetingIntegrations` tab id/permissions if needed.
  - Visible only to users with `AppPermission.SettingsEditMeetingIntegrations` (use the enum from `@/frontend/common/graphql/generated/gql/graphql-types`, NOT a bare string literal). Use `<RequirePermission>` (client component guard) for in-component gating and `requirePermissionForPage` for server-side page gating.
  - NOTE: Server-side code (`page.tsx` files) must import `AppPermission` from `@/backend/enum/permission.enum.ts`, NOT from `@/frontend/common/graphql/generated/gql/graphql-types` (which is for client-side only).
  - Same-tab navigation (`router.push`)
  - Subtle styling (outline button, not primary)
  - `aria-label="Navigate to teacher meeting configs"`
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/10-profile-link-callout-outcome.md`
  - Update progress: Mark task 10 as `[x]`
  - _Requirements: AC-1.6, AC-4.1 (cross-navigation settings → profile)_

- [ ] 2b. **Redesign `MeetingIntegrationsTab` container**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read design.md §3.1 (`MeetingIntegrationsTab` container spec)
  - Read existing `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/MeetingIntegrationsTab.tsx` and `useMeetingIntegrationsViewModel.ts`
  - Read `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md` (for `ResponsiveViewSwitch` / `createLazyView` patterns)
  - Redesign the tab as a thin container that switches between lazy-loaded desktop/mobile tier-split variant views:
    - `MeetingIntegrationsTabDesktop` (under `frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/`)
    - `MeetingIntegrationsTabMobile` (under `frontend/mobile/views/dashboard/settings/tabs/meetingIntegrations/`)
  - Use `ResponsiveViewSwitch` with `createLazyView` so each variant is a separate chunk (code-split). This is what enables the lazy-load + code-split behavior of AC-1.7.
  - The tab does NOT own any layout logic itself — it only renders the active variant. All layout, MetricCardGrid, AppDataGrid, dialogs, etc. live in the desktop/mobile variants (built in tasks 3-10) — the tab just wires them together via the shared ViewModel (`useMeetingIntegrationsViewModel`, task 29).
  - The ViewModel already passes `labels` down to tier views (per `frontend/common/views/AGENTS.md` Rule 7); the tab itself must NOT call `useAppTranslation`.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` on the redesigned tab and both new variants (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/2b-tab-container-outcome.md`
  - Update progress: Mark task 2b as `[x]`
  - _Requirements: AC-1.7 (lazy-load + code-split desktop/mobile variants)_

---

## Phase 3: Profile Meeting Configs Enhancement

- [ ] 11. **Create `OAuthCallbackHandler` component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler.tsx`
  - Check URL params on mount: `?oauth_status=success&provider=zoom`
  - If detected: trigger Apollo cache refetch for `myConnectedMeetingProviders`
  - Show success toast: "Successfully connected {Provider}"
  - Show error toast if `oauth_status=error`: "Failed to connect {Provider}: {error}"
  - Clean URL params after handling (`window.history.replaceState`)
  - Listen for `window` `focus` event (popup OAuth fallback)
  - `aria-live="polite"` region for screen reader announcements
  - All strings passed as `labels` prop from the manager ViewModel (`useMeetingConfigsManagerViewModel`, task 30) — no `useAppTranslation` in this view component itself. Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Log errors via `logger.error` from `@/frontend/utils/logger`** in addition to toast notifications (per Fix 9 — log the OAuth error details for diagnostics; the toast is the user-facing surface, the logger.error is the developer-facing surface). Never use `console.*`.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/11-oauth-callback-handler-outcome.md`
  - Update progress: Mark task 11 as `[x]`
  - _Requirements: AC-2.1, AC-5.2 (OAuth callback auto-detection)_

- [ ] 12. **Enhance `ConnectProviderAccount` with loading and status badge**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount.tsx` component
  - Add states: disconnected (Connect button), connected (badge + Disconnect), expiring (amber badge + Reconnect), expired (red badge + Reconnect), connecting (disabled + CircularProgressIndicator)
  - Add `OAuthConnectionStatusBadge` (will be built in Phase 4)
  - Loading overlay during OAuth redirect
  - "Reconnect" button separate from "Connect" (same mutation, preserves configs)
  - `aria-label` per state
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/12-connect-provider-account-outcome.md`
  - Update progress: Mark task 12 as `[x]`
  - _Requirements: AC-5.1, AC-5.3, AC-5.4 (OAuth connection UX)_

- [ ] 13. **Create `ReconnectAllAction` batch reconnect component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction.tsx`
  - Show "Reconnect All ({count})" button when ≥2 providers need reauth
  - Sequentially initiate OAuth flow for each provider (one at a time)
  - Progress: "Reconnecting 1 of 3..." with `CircularProgress`
  - Toast on completion: "Reconnected {n} providers" or "{n} failed to reconnect"
  - `aria-label="Reconnect all expiring providers"`, progress announced via live region
  - Toasts: use `const notifications = useNotifications()` (import via subpath `@toolpad/core/useNotifications`) called in the owning ViewModel — NOT in this view component. The view dispatches via ViewModel callbacks.
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/13-reconnect-all-action-outcome.md`
  - Update progress: Mark task 13 as `[x]`
  - _Requirements: AC-2.2 (Reconnect All batch action)_

- [ ] 14. **Enhance `ReauthNeededBanner` with per-provider reconnect**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/profile/shared/meeting-configs/ReauthNeededBanner.tsx` component
  - Add per-provider "Reconnect" button inline
  - Color-coded: amber (<7 days) `severity="warning"`, red (expired) `severity="error"`
  - Add "Remind me later" dismiss (shows again on next session)
  - "Reconnect All" button when ≥2 providers need reauth
  - Alert slide-down animation on mount
  - `role="alert"`, `aria-live` per severity
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/14-reauth-banner-outcome.md`
  - Update progress: Mark task 14 as `[x]`
  - _Requirements: AC-2.5, AC-5.3 (proactive reauth banner)_

- [ ] 14b. **Create `DisconnectConfirmDialog` component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read design.md §3.13 (DisconnectConfirmDialog design spec)
  - Read existing `BaseDeleteDialog` at `@/frontend/common/components/ui/dialog/BaseDeleteDialog.tsx` (singular `dialog/`) — verify its actual props (`open`, `onClose`, `title`, `body`, `cancelLabel`, `confirmLabel`, `isLoading`, `onConfirm`)
  - Create new component: `frontend/common/views/dashboard/settings/components/meetingIntegrations/DisconnectConfirmDialog.tsx`
  - Wrap `BaseDeleteDialog` — do NOT create a raw MUI `Dialog` (per design.md §10 Design Decision 1)
  - Props: `open`, `providerName` (string), `providerSlug` (string), `isLoading` (boolean), `onConfirm(providerSlug)`, `onClose`
  - Dialog `title` sourced from i18n key `disconnectWarningTitle` (reuse existing key if present in `Ui.MeetingConfig` namespace — do NOT duplicate). This is the canonical §7 naming scheme (NOT `actions.disconnectConfirmTitle`).
  - Dialog `body` sourced from i18n key `disconnectWarningMessage` with `providerName` interpolation (typed function: `(provider: string) => string`). Additionally surface `disconnectWarningImpact` for the impact-on-meeting-configs line. These follow the §7 naming scheme (NOT `actions.disconnectConfirmBody`).
  - Confirm button label from i18n key `actions.disconnect`
  - Confirm button shows `CircularProgress` when `isLoading` is true
  - If mutation errors, show `Alert severity="error"` inside dialog body; ViewModel logs via `logger.error` from `@/frontend/utils/logger`
  - Accessibility: `aria-describedby` on confirm button pointing to body text
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/14b-disconnect-confirm-dialog-outcome.md`
  - Update progress: Mark task 14b as `[x]`
  - _Requirements: AC-5.1, AC-5.4 (OAuth disconnect UX)_

- [ ] 15. **Enhance `MeetingConfigFormDialog` with zod and test config**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog.tsx` and `MeetingConfigFormDialogContent.tsx`
  - Ensure `EntityFormDialogActions` for footer — props are `formId`, `cancelLabel`, `saveLabel` (NOT `confirmLabel`), `onClose`, `isLoading` (NOT `loading`). Pass already-translated `saveLabel`/`cancelLabel` from labels.
  - Add zod validation using the **factory pattern** `createMeetingConfigFormSchema(labels)` that injects pre-resolved label strings into the schema (NOT a `t` function). See `useMeetingConfigFormDialog.ts` for existing hook; schema fields: `name` (required), `providerSlug` (required), `isDefault` (boolean), `autoGenerate` (boolean), `settings` (record).
  - Add "Test Config" button → calls `generateMeetingUrl` for preview
  - The submit handler wires the existing mutations. Verify the canonical document/operation names: `createUserMeetingConfig`, `updateUserMeetingConfig`, `deleteUserMeetingConfig` (the const exports are `createUserMeetingConfigMutationDocument`, `updateUserMeetingConfigMutationDocument`, `deleteUserMeetingConfigMutationDocument` at `meeting.documents.ts`). Do NOT use the non-existent `createMeetingConfig`/`updateMeetingConfig`/`deleteMeetingConfig` names.
  - Show preview URL in dialog with copy button
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/15-config-form-dialog-outcome.md`
  - Update progress: Mark task 15 as `[x]`
  - _Requirements: AC-2.6, AC-6.3 (config form with zod + test preview)_

- [ ] 16. **Enhance `ClassMeetingConfigsSection` with generation status**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.tsx` component
  - Add generation status badge per class instance: `MeetingGenerationStatusIndicator` (pending/success/failed)
  - The ViewModel (task 30) issues the class meeting config query with status. If a new GraphQL document is needed, follow the convention: name it `classMeetingConfigsWithStatusQueryDocument` (NOT the SCREAMING_SNAKE `CLASS_MEETING_CONFIG_WITH_STATUS`). Cast via `TypedDocumentNode<Operations.ClassMeetingConfigsWithStatusQuery, Types.QueryClassMeetingConfigsWithStatusArgs>` imported from `@apollo/client`. The query variable MUST be `$classInstanceId` (NOT `$classId`; the schema arg is `classInstanceId`, matching `meeting.documents.ts:223`). Read the provider slug ONLY as the nested `provider { slug }` field — do NOT reference a top-level `providerSlug` field on `ClassMeetingConfig` (it does not exist). Define the document in the appropriate `frontend/common/graphql/sharedDocuments/<domain>.documents.ts` file.
  - "Retry Generation" button for failed instances (calls mutation if available — note the mutation names are `createUserMeetingConfig`/`updateUserMeetingConfig`/`deleteUserMeetingConfig` for user-owned configs, NOT `createMeetingConfig`/`updateMeetingConfig`/`deleteMeetingConfig`)
  - Copy URL button for generated URLs
  - URL expiration display (if `expiresAt` available, null-safe) — `expiresAt` is a new backend field; verify codegen exposes it and that the plan-review finding it might be missing is resolved by the prerequisite schema update in task 2 / backend task canonicalization
  - Handle null backend fields gracefully
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/16-class-configs-section-outcome.md`
  - Update progress: Mark task 16 as `[x]`
  - _Requirements: AC-2.7, AC-6.1, AC-6.2 (class meeting config generation status)_

- [ ] 17. **Create `TokenExpiryWarning` component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning.tsx`
  - States: safe (>14d, not rendered), warning (<7d, amber), critical (<24h, red), expired (red)
  - Countdown text: "Expires in X days" / "Expires in X hours" / "Expired"
  - "Reconnect" button inline
  - `role="status"`, `aria-live="polite"`
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/17-token-expiry-warning-outcome.md`
  - Update progress: Mark task 17 as `[x]`
  - _Requirements: AC-2.3, AC-5.3 (token expiry display)_

- [ ] 18. **Enhance `AutoGenerationSupportCallout` as interactive guide**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout.tsx` component
  - Add "Learn More" expandable section with step-by-step guide
  - Add visual illustration (icon-based: `VideocamOutlined` + `AutoModeOutlined`)
  - Add "Create Config" action button (opens form dialog)
  - Collapsed: Summary + "Learn More" toggle
  - Expanded: Step-by-step guide (Connect → Create Config → Auto-generate at booking)
  - `aria-expanded` on toggle, `aria-controls` linking to content
  - All strings passed as `labels` prop from ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/18-auto-generation-callout-outcome.md`
  - Update progress: Mark task 18 as `[x]`
  - _Requirements: AC-6.3 (generation preview callout)_

- [ ] 18b. **Enhance `MeetingConfigsManager` container**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read design.md §3.11 (`MeetingConfigsManager` enhanced container spec)
  - Read existing `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.tsx` and `useMeetingConfigsManagerViewModel.ts`
  - Read `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md` (for `ResponsiveViewSwitch` / `createLazyView` patterns)
  - Enhance the existing `MeetingConfigsManager.tsx` to orchestrate ALL profile-side meeting config components built in this plan:
    - Cross-link to the settings tab (the "Admin Provider Settings" button that task 31 wires) — register the handler from the ViewModel's `navigateToSettings` action.
    - Integrate `ReconnectAllAction` (task 13) when `requiresReconnect` is true AND `reauthProviders.length >= 2` (use the ViewModel-exposed fields — NOT internal state).
    - Integrate `TokenExpiryWarning` (task 17) per provider.
    - Integrate the profile-side `DisconnectConfirmDialog` (task 14b) — wire its `open`/`onConfirm`/`onClose` to ViewModel state.
  - The manager is the ORCHESTRATION layer — it owns no visual styling itself, only composition. It delegates all labels to the per-component `labels` props sourced from `useMeetingConfigsManagerViewModel` (task 30) which resolves UI strings via `useAppTranslation(Translation.Ui.MeetingConfig)` (NOT `Dashboard.ProfileMeetingConfigs` which does not exist — see design.md §7). The manager view component must NOT call `useAppTranslation` (per `frontend/common/views/AGENTS.md` Rule 7).
  - If a desktop/mobile tier split is warranted for the manager layout itself, apply `ResponsiveViewSwitch` + `createLazyView` (consistent with task 2b's tab pattern) — otherwise keep it as a single shared composition component. Decide based on whether the layout diverges meaningfully between desktop and mobile.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/18b-configs-manager-outcome.md`
  - Update progress: Mark task 18b as `[x]`
  - _Requirements: AC-2.2, AC-2.3, AC-4.2, AC-5.4 (profile meeting-configs orchestration)_

---

## Phase 4: Shared/New Components

- [ ] 19. **Create `MeetingUrlStatusBadge` component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge.tsx`
  - States: pending (CircularProgress + "Pending"), generated (CheckCircleOutlined + "Ready"), failed (ErrorOutlined + "Failed"), expired (ScheduleOutlined + "Expired")
  - Colors: `theme.palette.info/success/error/warning.main`
  - Optional tooltip with details
  - `role="status"`, `aria-label` with full status text, `title` for tooltip
  - Size variants: small (16px icon), medium (24px icon)
  - All strings via `useAppTranslation(Translation.Dashboard.MeetingUrlStatus)` (self-contained UI primitive in `frontend/common/components/ui/` may own its translations — see `frontend/common/components/ui/AGENTS.md`)
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/19-url-status-badge-outcome.md`
  - Update progress: Mark task 19 as `[x]`
  - _Requirements: AC-3.1, AC-3.5, AC-3.6 (URL status badges)_

- [ ] 20. **Create `CopyMeetingUrlButton` component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton.tsx`
  - Copy URL to clipboard via `navigator.clipboard.writeText()`
  - Handle clipboard API fallback for older browsers
  - States: default (`ContentCopyOutlined` icon), copied (`CheckOutlined` green for 2s), error (toast)
  - Toast: "URL copied to clipboard"
  - Variants: icon, button, text
  - `aria-label="Copy meeting URL"`, `aria-pressed` for copied state
  - All strings via `useAppTranslation` (self-contained UI primitive — see `frontend/common/components/ui/AGENTS.md`)
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/20-copy-url-button-outcome.md`
  - Update progress: Mark task 20 as `[x]`
  - _Requirements: AC-2.4, AC-3.2, AC-3.3 (copy URL for teachers/students/parents)_

- [ ] 21. **Create `OAuthConnectionStatusBadge` component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge.tsx`
  - States: connected (green dot + "Connected"), expiring (amber dot + "Expires in X days"), expired (red dot + "Expired"), disconnected (grey dot + "Not connected")
  - Optional expiry countdown text
  - `role="status"`, `aria-label`
  - Colors from theme palette (no hardcoded)
  - All strings via `useAppTranslation(Translation.Dashboard.OAuthFlow)` (self-contained UI primitive — see `frontend/common/components/ui/AGENTS.md`)
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/21-oauth-status-badge-outcome.md`
  - Update progress: Mark task 21 as `[x]`
  - _Requirements: AC-5.7 (connection status badge)_

- [ ] 22. **Create `MeetingUrlCell` for data tables**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/components/ui/display/meetingConfig/MeetingUrlCell.tsx`
  - Compact layout for data table columns
  - Combines: `MeetingUrlStatusBadge` + join button + `CopyMeetingUrlButton` (if applicable)
  - Handle null URLs gracefully (show "Not generated" with setup link)
  - Desktop: Inline `Stack` with `direction="row"` (standard MUI Stack prop — widely used in this codebase in 100+ components)
  - Mobile: Card section (badge top, buttons below)
  - `aria-label` describing full state
  - All strings via `useAppTranslation` (self-contained UI primitive — see `frontend/common/components/ui/AGENTS.md`)
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/22-url-cell-outcome.md`
  - Update progress: Mark task 22 as `[x]`
  - _Requirements: AC-3.1, AC-3.2, AC-3.5 (URL display in data tables)_

- [ ] 23. **Create `MeetingGenerationStatusIndicator` component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/components/ui/display/meetingConfig/MeetingGenerationStatusIndicator.tsx`
  - States: pending (CircularProgress + pulsing animation), success (green check + URL + copy + expiresAt), failed (red error + expandable details + retry)
  - `aria-live="polite"` for status changes
  - All strings via `useAppTranslation(Translation.Dashboard.MeetingGeneration)` (self-contained UI primitive — see `frontend/common/components/ui/AGENTS.md`)
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/23-generation-indicator-outcome.md`
  - Update progress: Mark task 23 as `[x]`
  - _Requirements: AC-6.1, AC-6.4 (generation status with URL display)_

- [ ] 24. **Create `MeetingProviderLogo` component**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create new component: `frontend/common/components/ui/display/meetingConfig/MeetingProviderLogo.tsx`
  - Provider-specific logos for: Zoom, Google Meet, MS Teams, custom
  - Fallback: `VideocamOutlined` for unknown providers
  - Size variants: small (20px), medium (32px), large (48px)
  - Use provider slug to determine logo
  - `alt` text "{Provider Name} logo", `role="img"`
  - Colors from theme palette (no hardcoded)
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/24-provider-logo-outcome.md`
  - Update progress: Mark task 24 as `[x]`
  - _Requirements: UX (provider visual identification)_

- [ ] 24b. **Create `MeetingIntegrationsBreadcrumb` and `MeetingConfigsBreadcrumb` components**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read design.md §3.28 (MeetingBreadcrumb spec)
  - Read existing `Breadcrumbs` from `@mui/material/Breadcrumbs`
  - Create two components:
    - `frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsBreadcrumb.tsx` — renders "Settings > Meeting Integrations"
    - `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsBreadcrumb.tsx` — renders "Profile > Meeting Configs"
  - Both use `Breadcrumbs` with `aria-label="breadcrumb"`, `aria-current="page"` on last item
  - All strings via `labels` prop from ViewModel (no `useAppTranslation` in view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - All breadcrumb label strings must be passed via props from the parent ViewModel — do NOT call `useAppTranslation` directly inside the breadcrumb view components (per `frontend/common/views/AGENTS.md` Rule 7).
  - RTL: separator flips automatically via MUI `dir` context — no manual handling
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/24b-breadcrumb-outcome.md`
  - Update progress: Mark task 24b as `[x]`
  - _Requirements: AC-4.5 (breadcrumb shows current location)_

- [ ] 24c. **Implement animation specification (prefers-reduced-motion)**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read design.md §3.A (Animation Specification)
  - Add `prefers-reduced-motion` check to components with custom animations:
    - `ReauthNeededBanner`: Slide-down on mount (300ms easeOut), instant appear when reduced-motion
    - `MeetingUrlStatusBadge`: Fade color change on status transition (200ms)
    - `CopyMeetingUrlButton`: Icon swap Link → Check (150ms)
    - `MeetingGenerationStatusIndicator`: Spinner → CheckCircle fade (200ms)
    - `TokenExpiryWarning`: Amber pulse on mount if ≤1 day (1s × 2 pulses), skip pulse when reduced-motion
    - `OAuthConnectionStatusBadge`: Dot color transition (200ms)
    - `ProfileLinkCallout` / `MeetingConfigsManager header cross-link button`: Fade in on mount (200ms)
  - Use MUI built-in transitions (`Fade`, `Slide`, `Collapse`, `Grow`) — NO external animation library
  - For TokenExpiryWarning pulse only: `@keyframes` via `sx` prop (scoped to component)
  - Verify all animations check `useMediaQuery('(prefers-reduced-motion: reduce)')`
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` on each modified component (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/24c-animation-spec-outcome.md`
  - Update progress: Mark task 24c as `[x]`
  - _Requirements: UX-NFR-1 (smooth transitions), Accessibility (reduced motion)_

---

## Phase 5: MeetingJoinAction Enhancement & Integration

- [ ] 25. **Enhance `MeetingJoinAction` with copy, status, retry**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/components/ui/display/meetingConfig/MeetingJoinAction.tsx` component (plus `.desktop.tsx` / `.mobile.tsx` variants)
  - Add `showCopyButton` prop for non-admin users
  - Add URL status badge integration: pending/generated/failed/expired
  - Add retry action for failed generations (optional `onRetry` callback)
  - Add `expiresAt` display (null-safe)
  - States: pending (CircularProgress + chip), generated (join + copy), failed (error + retry), expired (warning chip)
  - All strings via `useAppTranslation(Translation.Dashboard.MeetingUrlStatus)` (self-contained UI primitive — see `frontend/common/components/ui/AGENTS.md`)
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/25-join-action-enhanced-outcome.md`
  - Update progress: Mark task 25 as `[x]`
  - _Requirements: AC-3.1-3.6 (MeetingJoinAction enhancement)_

- [ ] 26. **Integrate meeting URL status into teacher schedule grid**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing teacher schedule grid (DesktopAppDataGrid columns + MobileCardList cards) — both require `paginationOptions: ListPaginationOptions` (required prop, non-optional). Verify how the existing grid passes `paginationOptions` and reuse the pattern. Columns are standard `GridColDef[]`.
  - Add `MeetingUrlCell` as a new column in DesktopAppDataGrid (standard `GridColDef[]`)
  - Add `MeetingUrlCell` to MobileCardList cards
  - URL status badge per class instance
  - Copy URL button visible to teachers with `AppPermission.MeetingConfigsManageOwn` or `AppPermission.MeetingConfigsManageClass` (use the enums from `@/frontend/common/graphql/generated/gql/graphql-types`, NOT bare string literals). Use `<RequirePermission>` (client) for in-component gating.
  - Join button for all authenticated users
  - Null-safe handling for pending/failed/missing URLs
  - All strings passed as `labels` prop from the teacher schedule ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7. The shared `MeetingUrlCell`/`MeetingUrlStatusBadge` primitives may own their own `useAppTranslation` as noted in their respective tasks.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/26-schedule-grid-integration-outcome.md`
  - Update progress: Mark task 26 as `[x]`
  - _Requirements: AC-3.1, AC-3.2 (URL status in teacher schedule)_

- [ ] 27. **Integrate meeting URL display into student and parent dashboards**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing student next class card component
  - Read existing parent dashboard component
  - Student: Add `CopyMeetingUrlButton` to next class card alongside join button
  - Parent: Add `MeetingUrlCell` to student dashboard data table / card list (ensure `paginationOptions` is passed where DesktopAppDataGrid/MobileCardList is used — required prop)
  - All authenticated users can copy URL
  - Join button for all
  - Null-safe handling
  - All strings passed as `labels` prop from the student/parent dashboard ViewModel (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/27-student-parent-integration-outcome.md`
  - Update progress: Mark task 27 as `[x]`
  - _Requirements: AC-3.3, AC-3.4 (URL display for students and parents)_

---

## Phase 6: ViewModel Updates & Store Enhancement

- [ ] 28. **Update `meetingIntegrationsSettingsStore` with new state fields**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `meetingIntegrationsSettingsStore.ts` (locate under `frontend/common/stores/` or `frontend/common/views/dashboard/settings/` — confirm exact path before editing)
  - Add new fields: `testingProviderSlug`, `revokingAccountId`, `connectingProviderSlug`, `testConnectionResult`, `metadataDialogAccountId`, `credentialFormProvider`, `credentialFormMode`
  - Add corresponding actions/setters
  - Add `ProfileLinkCallout` visibility check (permission-based) — gate via the `AppPermission.SettingsEditMeetingIntegrations` enum (resolved from `@/frontend/common/graphql/generated/gql/graphql-types`), NOT a bare string literal.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/28-settings-store-outcome.md`
  - Update progress: Mark task 28 as `[x]`
  - _Requirements: AC-1.8, AC-1.6 (settings store enhancement)_

- [ ] 29. **Update `useMeetingIntegrationsViewModel` with new actions**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `useMeetingIntegrationsViewModel.ts` (locate under `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/`)
  - Add: `connectProvider(slug)` action (calls `connectMeetingProviderOAuth`, redirects)
  - Add: `navigateToProfile()` action (router.push to `/profile?tab=meeting`)
  - Add: `canViewProfile` check using `AppPermission.SettingsEditMeetingIntegrations` enum (NOT a bare string literal). Use `<RequirePermission>` (client) / `requirePermissionForPage` (server) where appropriate per root `AGENTS.md` permission guidance.
  - Resolve all UI strings via `useAppTranslation(Translation.Dashboard.SettingsMeetingIntegrations)` here in the ViewModel and pass them down to tier views as `labels` props (per `frontend/common/views/AGENTS.md` Rule 7).
  - Ensure notification calls in ViewModel (not in view components) — use `const notifications = useNotifications()` imported via the SUBPATH `@toolpad/core/useNotifications` (NOT `@toolpad/core`).
  - **Log errors via `logger.error` from `@/frontend/utils/logger`** in addition to toast notifications (per Fix 9 — log mutation/network error details for diagnostics; the toast is the user-facing surface, `logger.error` is the developer-facing surface). Never use `console.*`.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/29-settings-viewmodel-outcome.md`
  - Update progress: Mark task 29 as `[x]`
  - _Requirements: AC-1.5, AC-1.6, AC-1.8 (settings ViewModel)_

- [ ] 30. **Update `useMeetingConfigsManagerViewModel` with OAuth callback and reconnect all**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerViewModel.ts`
  - Add: `handleOAuthCallback(status, provider, error?)` action (triggers refetch + toast)
  - Add: `reconnectAll(providerSlugs)` action (sequential OAuth for each)
  - Add: `reconnectAllProgress` state: `{ current, total, providerSlug } | null`
  - Add: `copyUrl(url)` action with toast notification
  - Add: `canViewSettings` check using `AppPermission.SettingsView` enum (NOT a bare string literal) for cross-link
  - Note: task 31's condition (`SettingsView` OR `SettingsEditMeetingIntegrations`) is functionally equivalent to `SettingsView` alone since `SettingsEditMeetingIntegrations` implies settings access. Either implementation is correct.
  - Add: `navigateToSettings()` action (router.push to `/dashboard/settings?tab=meetingIntegrations`)
  - **ViewModel exposed fields (Fix 15):** the existing ViewModel already returns `reauthProviders` and `requiresReconnect` (NOT `reauthProviderSlugs` or `connectingSlugs`, which are internal state). If the manager/header needs the raw slugs for `ReconnectAllAction`, add a new task step to expose `reauthProviderSlugs` (or expose a `reconnectAllTargetSlugs: readonly string[]` derived value) from the ViewModel return value — do NOT assume those internal state names are exposed.
  - Ensure notification calls in ViewModel (not in view components) — use `const notifications = useNotifications()` imported via the SUBPATH `@toolpad/core/useNotifications` (NOT `@toolpad/core`).
  - Resolve all UI strings via `useAppTranslation(Translation.Ui.MeetingConfig)` here in the ViewModel and pass them down to tier views as `labels` props (per `frontend/common/views/AGENTS.md` Rule 7). NOTE: the namespace is `Ui.MeetingConfig` (NOT `Dashboard.ProfileMeetingConfigs` which does NOT exist — see design.md §7).
  - **Log errors via `logger.error` from `@/frontend/utils/logger`** in addition to toast notifications (per Fix 9 — log OAuth callback errors, mutation/network errors for diagnostics; the toast is the user-facing surface, `logger.error` is the developer-facing surface). Never use `console.*`.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/30-profile-viewmodel-outcome.md`
  - Update progress: Mark task 30 as `[x]`
  - _Requirements: AC-2.1, AC-2.2, AC-2.4, AC-4.2 (profile ViewModel)_

- [ ] 31. **Update profile meeting configs header with settings cross-link**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.tsx` header section
  - Add "Admin Provider Settings" button linking to `/dashboard/settings?tab=meetingIntegrations`
  - Visible only to users with `AppPermission.SettingsView` or `AppPermission.SettingsEditMeetingIntegrations` (use the enums from `@/frontend/common/graphql/generated/gql/graphql-types`, NOT bare string literals). Use `<RequirePermission>` (client) for in-component gating.
  - Same-tab navigation
  - Integrate `OAuthCallbackHandler` into the manager
  - Integrate `ReconnectAllAction` when `requiresReconnect` is true AND `reauthProviders.length >= 2` (use the ViewModel-exposed `requiresReconnect` / `reauthProviders` fields — NOT internal `reauthProviderSlugs`/`connectingSlugs`)
  - All strings passed as `labels` prop from the `useMeetingConfigsManagerViewModel` (no `useAppTranslation` in this view component). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/31-profile-cross-link-outcome.md`
  - Update progress: Mark task 31 as `[x]`
  - _Requirements: AC-4.2 (profile → settings cross-link)_

---

## Phase 7: Mobile-Desktop Parity & Responsive

- [ ] 32. **Ensure all settings tab variants have mobile equivalents**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing `meetingIntegrationsTab.mobile.tsx`
  - Verify: `MobileMetricCardGrid` for health headers
  - Verify: `MobileCardList` for connected accounts
  - Verify: Full-screen dialogs for credential form
  - Verify: `BaseDeleteDialog` responsive (full-screen on mobile)
  - Ensure all touch targets ≥48dp
  - No horizontal scrolling — content stacks vertically
  - All strings passed as `labels` prop from the ViewModel (mobile variants must NOT call `useAppTranslation`). Per `frontend/common/views/AGENTS.md` Rule 7. Verify that the desktop AND mobile variants both source labels from the same ViewModel.
  - Verify any `MobileCardList` / `DesktopAppDataGrid` usage passes the REQUIRED `paginationOptions: ListPaginationOptions` prop (non-optional). If the parity check reveals a missing `paginationOptions` on mobile, file it as a defect in the outcome doc.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/mobile/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/32-settings-mobile-parity-outcome.md`
  - Update progress: Mark task 32 as `[x]`
  - _Requirements: AC-7.1, AC-7.5, AC-7.6 (settings mobile parity)_

- [ ] 33. **Ensure all profile meeting configs variants have mobile equivalents**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read existing profile meeting configs mobile variants
  - Verify: ALL dialogs work on mobile (full-screen)
  - Verify: ALL forms touch-friendly (touch targets ≥48dp)
  - Verify: Provider cards use `MobileMetricCardGrid`
  - Verify: Meeting configs list uses `MobileCardList`
  - Verify: OAuth redirect optimized for mobile (full-screen redirect)
  - Verify: `ReauthNeededBanner` touch-friendly
  - Verify: `ReconnectAllAction` button accessible on mobile
  - No horizontal scrolling
  - All strings passed as `labels` prop from the ViewModel (mobile variants must NOT call `useAppTranslation`). Per `frontend/common/views/AGENTS.md` Rule 7.
  - Verify any `MobileCardList` / `MobileMetricCardGrid` / `DesktopAppDataGrid` usage passes the REQUIRED `paginationOptions: ListPaginationOptions` prop (non-optional for the data grid / card list). Flag missing props in the outcome doc.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/mobile/AGENTS.md`, `frontend/common/views/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/33-profile-mobile-parity-outcome.md`
  - Update progress: Mark task 33 as `[x]`
  - _Requirements: AC-7.2, AC-7.4, AC-7.5 (profile mobile parity)_

- [ ] 34. **Verify schedule grid and dashboards have mobile variants**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Verify: Teacher schedule `MobileCardList` shows meeting URL status with `MeetingUrlCell`
  - Verify: Student next class card is vertical/stacked on mobile
  - Verify: Parent dashboard `MobileCardList` shows student meeting URLs
  - Verify: All touch targets ≥48dp, no horizontal scrolling
  - Verify any `MobileCardList` / `DesktopAppDataGrid` usage passes the REQUIRED `paginationOptions: ListPaginationOptions` prop (non-optional). Flag missing props in the outcome doc.
  - All strings passed as `labels` prop from the ViewModel (mobile variants must NOT call `useAppTranslation`). Per `frontend/common/views/AGENTS.md` Rule 7.
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `frontend/mobile/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/34-dashboard-mobile-parity-outcome.md`
  - Update progress: Mark task 34 as `[x]`
  - _Requirements: AC-7.3, AC-7.5, AC-7.6 (dashboards mobile parity)_

---

## Phase 8: Testing

- [ ] 35. **Write component tests for all new/redesigned components**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read `/home/ahmed/Projects/siraj-meetings/test/ui/AGENTS.md`
  - Read `/home/ahmed/Projects/siraj-meetings/.agents/instructions/tests.instructions.md`
  - Write tests for:
    - `MeetingIntegrationsHealthHeaders`: 4 metrics, loading, empty, error
    - `ConnectedAccountsTable`: rows, sort, filter, actions, permission-gate, empty
    - `MeetingProviderCredentialForm`: fields, zod validation, submit, error
    - `TestConnectionResultPanel`: all 4 states, retry
    - `RevokeTokenDialog`: confirm, cancel, loading
    - `ConnectProviderAction`: click, loading, error
    - `ProfileLinkCallout`: render, navigate
    - `OAuthCallbackHandler`: success params, error params, URL clean, focus event
    - `ConnectProviderAccount`: all 5 states, actions
    - `ReconnectAllAction`: shows when ≥2, progress, completion
    - `ReauthNeededBanner`: warning, error, per-provider, reconnect all, dismiss
    - `MeetingConfigFormDialog`: validation, test config, submit
    - `ClassMeetingConfigsSection`: list, status badges, retry, copy
    - `TokenExpiryWarning`: safe, warning, critical, expired
    - `CopyMeetingUrlButton`: copy success, error, feedback
    - `MeetingJoinAction`: all variants, all states, copy, retry
    - `MeetingUrlStatusBadge`: all 4 states, tooltip, accessibility
    - `MeetingUrlCell`: with URL, without URL, join + copy, retry
    - `MeetingGenerationStatusIndicator`: pending, success, failed
    - `MeetingProviderLogo`: all providers, fallback, sizes
    - `OAuthConnectionStatusBadge`: all 4 states, countdown
  - Use Happy DOM + mocked Apollo Client
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` on test files (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `test/ui/AGENTS.md`, `.agents/instructions/tests.instructions.md`
  - Run: `bun run test:ui:components`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/35-component-tests-outcome.md`
  - Update progress: Mark task 35 as `[x]`
  - _Requirements: NFR-20 (test coverage ≥80%)_

- [ ] 35b. **Create Storybook stories for all new and enhanced components**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create `.stories.tsx` files for every component created or enhanced in this plan (tasks 3-18, 19-27, 14b)
  - Each story file sits next to its component (`.tsx` → `.stories.tsx` in the same directory)
  - Stories MUST cover ALL states documented in design.md:
    - `MeetingUrlStatusBadge`: pending, generated, failed, expired + size variants (small, medium)
    - `OAuthConnectionStatusBadge`: connected, disconnected, expiring, expired, connecting
    - `ConnectProviderAccount`: all 5 states (connected, disconnected, expiring, expired, connecting)
    - `MeetingConfigFormDialog`: open/closed, validation errors, test config preview
    - `ReauthNeededBanner`: warning, error, per-provider, reconnect-all, dismiss
    - `RevokeTokenDialog`: open, loading, error
    - `TokenExpiryWarning`: warning (7 days), critical (1 day), expired
    - `CopyMeetingUrlButton`: idle, copied, copy-failed
    - `MeetingGenerationStatusIndicator`: pending, generating, generated, failed
    - `DisconnectConfirmDialog`: open, loading, error
    - All other components per their design.md state lists
  - Use Vitest (Storybook's test runner) — story test files use `*.stories.tsx` convention
  - Mock Apollo via `MockedProvider` from `@apollo/client/testing` for GraphQL-dependent stories
  - Mock `useNotifications` via a simple stub (show/showPromise)
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
  - Run: `bun run test:ui:components` (Storybook stories run through Vitest)
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/35b-storybook-stories-outcome.md`
  - Update progress: Mark task 35b as `[x]`
  - _Requirements: NFR-20 (all states covered for visual regression)_

- [ ] 36. **Write E2E tests for OAuth flow and config CRUD**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Read `/home/ahmed/Projects/siraj-meetings/test/ui/AGENTS.md`
  - Read `/home/ahmed/Projects/siraj-meetings/.agents/instructions/tests.instructions.md`
  - Before running E2E: `bun run build:test` (REQUIRED)
  - Write E2E tests:
    - Admin settings:navigate, health metrics, connected accounts, test connection, revoke
    - Teacher OAuth: connect, callback auto-refresh, config CRUD, copy URL
    - Teacher schedule: URL status, copy, join
    - Student: next class card, copy, join
    - Parent: student URLs, copy, join
    - Mobile: settings tab, profile tab (375px viewport)
    - RTL: Arabic layout for all meeting views
  - Run: `bun run test:ui:e2e`
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` on test files (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `test/ui/AGENTS.md`, `.agents/instructions/tests.instructions.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/36-e2e-tests-outcome.md`
  - Update progress: Mark task 36 as `[x]`
  - _Requirements: NFR-20 (100% for critical paths)_

---

## Phase 9: Accessibility & i18n Verification

- [ ] 37. **Accessibility audit and Arabic RTL verification**
  - Read all files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Verify keyboard navigation: All dialogs (Tab, Enter, Escape), tables, forms
  - Verify focus management: Dialogs trap focus, restore on close
  - Verify ARIA labels on all interactive elements
  - Verify `aria-live` regions for status announcements
  - Verify color contrast: Status badges meet WCAG 2.1 AA (4.5:1 text, 3:1 UI)
  - Verify no hardcoded colors — all from `theme.palette`
  - Switch to Arabic locale (`/ar/`) and verify:
    - RTL layout for all meeting views
    - Tab navigation works in RTL
    - Dialogs align right
    - Data tables reverse column order
    - All strings translated (no English hardcoded)
  - Run accessibility audit (axe-core or similar)
  - Fix any issues found
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` on fixed files (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - **Instruction Verification**: Validate against `frontend/AGENTS.md`, `shared/AGENTS.md`
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/37-accessibility-i18n-outcome.md`
  - Update progress: Mark task 37 as `[x]`
  - _Requirements: AC-8.1 through AC-8.10 (accessibility and i18n)_

---

## Phase 10: Knowledge Propagation & Documentation

- [ ] 38. **Create canonical reference doc and update AGENTS.md**
  - Read ALL outcome files in `.ai/plans/auto-meeting-url/ui/outcome/`
  - Create `docs/frontend/meeting-integrations-ui.md` consolidating:
    - Component patterns used (MetricCardGrid, AppDataGrid, BaseDeleteDialog, EntityFormDialogActions)
    - OAuth callback handling pattern (URL param detection + Apollo refetch)
    - Reconnect all batch action pattern
    - Meeting URL status badge patterns
    - Copy URL clipboard pattern
    - i18n namespace structure for meeting features
    - Mobile-desktop responsive patterns for meeting views
  - Update `frontend/AGENTS.md` with reference to new doc
  - Update `frontend/views/AGENTS.md` if applicable
  - Update `.agents/instructions/frontend.instructions.md` if conventions changed
  - Update root `AGENTS.md` Important References section
  - **Quality Loop**: Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` on all modified doc files (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; fix and re-run until exit 0)
  - Run global check: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` on each modified file as a final sweep, or `bun quality-gate` for full-repo sequential verification (tsgo → biome → lint → codescene → sonar; 0 errors, 0 warnings)
  - Write outcome: `.ai/plans/auto-meeting-url/ui/outcome/38-knowledge-propagation-outcome.md`
  - Update progress: Mark task 38 as `[x]`
  - _Requirements: All (knowledge transfer)_

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | 1-2 | i18n Foundation & Shared Types |
| Phase 2 | 2b, 3-10 | Settings Tab Component Redesign (8 components + MeetingIntegrationsTab container) |
| Phase 3 | 11-18, 14b, 18b | Profile Meeting Configs Enhancement (9 components incl. DisconnectConfirmDialog + MeetingConfigsManager container) |
| Phase 4 | 19-24, 24b, 24c | Shared/New Components + Breadcrumb + Animation Spec (9 tasks) |
| Phase 5 | 25-27 | MeetingJoinAction Enhancement & Integration (3 tasks) |
| Phase 6 | 28-31 | ViewModel Updates & Store Enhancement (4 tasks) |
| Phase 7 | 32-34 | Mobile-Desktop Parity (3 tasks) |
| Phase 8 | 35-36, 35b | Testing + Storybook Stories (3 tasks) |
| Phase 9 | 37 | Accessibility & i18n Verification |
| Phase 10 | 38 | Knowledge Propagation & Documentation |
| **Total** | **44 tasks** | |

### Requirements Traceability

| Requirement | Tasks |
|-------------|-------|
| Req 0 (Outcome Protocol) | All tasks (outcome files) |
| Req 1 (Settings Tab Compliance) | 2b, 3, 4, 5, 6, 7, 8, 9, 28, 29 |
| Req 2 (Profile Configs Enhancement) | 11, 12, 13, 14, 15, 16, 17, 18b, 30, 31 |
| Req 3 (URL Display in Tables) | 19, 20, 22, 25, 26, 27 |
| Req 4 (Cross-Navigation) | 10, 24b, 31 |
| Req 5 (OAuth Connection UX) | 11, 12, 14, 14b, 17, 21 |
| Req 6 (Generation Feedback) | 15, 16, 18, 23 |
| Req 7 (Mobile-Desktop Parity) | 32, 33, 34 |
| Req 8 (Accessibility & i18n) | 1, 37 |
| NFR (Testing) | 35, 36 |
| NFR (Documentation) | 38 |

#### AC-Level Traceability (per-AC coverage for previously untraced ACs)

The following ACs were not explicitly traced in the Req-level table above. They are covered here at the AC level:

| AC | Traced task(s) | Notes |
|----|----------------|-------|
| AC-1.7 (lazy-load + code-split) | 2b | Container tab uses `ResponsiveViewSwitch` + `createLazyView` to code-split desktop/mobile variants |
| AC-2.8 (forms use Ui.MeetingConfig translations) | 15 | `MeetingConfigFormDialog` resolves all strings via the `Ui.MeetingConfig` namespace (see design.md §7) |
| AC-3.7 (theme colors + translated labels for badges) | 19 | `MeetingUrlStatusBadge` — colors from `theme.palette` (no hardcoded), labels via i18n |
| AC-4.3 (same-tab navigation, preserve history) | 24b | Breadcrumb + `router.push` same-tab navigation preserves tab history |
| AC-4.4 (active tab state preserved) | 24b | Breadcrumb reflects the active tab so navigation preserves tab state across cross-links |
| AC-5.5 (OAuth error translated + retry) | 11 | `OAuthCallbackHandler` shows translated error toast and triggers retry/refetch |
| AC-5.6 (Disconnect uses BaseDeleteDialog warning) | 14b | `DisconnectConfirmDialog` wraps `BaseDeleteDialog` with the `disconnectWarning*` i18n keys (per §7) |
| AC-6.5 (admin provider-level generation health metrics) | (none) | **Out of scope — backend dependency.** Backend would need to expose provider-level generation success-rate/avg-time fields; UI only surfaces them if present. |
| AC-6.6 (real-time Apollo cache/subscription updates) | (none) | **Out of scope — requires backend subscription.** Would need a GraphQL subscription for real-time URL generation status changes; current plan uses Apollo cache refetch (task 11) instead. |
| AC-6.7 (all status messages translated via i18n) | 19, 23 | `MeetingUrlStatusBadge` (19) and `MeetingGenerationStatusIndicator` (23) own their i18n translations for all status strings |
| AC-7.7 (viewport testing 375/768/1440) | 37 | Accessibility & i18n verification task runs QA across 375px / 768px / 1440px viewports (see Verification Checklist) |

---

## Verification Checklist

Each task must pass:
- [ ] Per-file quality loop passes: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (runs tsgo → biome → oxlint → lint → check:duplicates → codescene; short-circuits at first failure; exit 0)
- [ ] Unit tests pass for component
- [ ] Manual QA on mobile (375px), tablet (768px), desktop (1440px)
- [ ] Arabic RTL layout verified
- [ ] All user-facing strings translated
- [ ] No hardcoded colors — all from theme palette
- [ ] Touch targets ≥48dp on mobile
- [ ] ARIA labels on all interactive elements
