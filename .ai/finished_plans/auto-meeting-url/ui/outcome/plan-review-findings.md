# Plan Review Findings — Compiled from 5 Parallel Subagents (Rounds 1-2) + 8 Verification Subagents (Round 3)

> **Round 3 Status**: All 8 verification subagents completed, all 3 fix subagents applied fixes. All findings below have been addressed.

## Round 3 Findings (8 Parallel Verification Subagents) — ALL FIXED

### R3-01: verify-paths-exist (10 path bugs found)
- ✅ FIXED: `dialog/` vs `dialogs/` (singular is correct) — fixed in all 3 files
- ✅ FIXED: `EntityFormDialogActions` path → `subjects/home/components/__shared__/` (feature-specific)
- ✅ FIXED: `BaseDeleteDialog` missing required `cancelLabel` prop in mapping
- ✅ FIXED: `MeetingJoinAction` path → `frontend/common/components/ui/display/meetingConfig/`
- ✅ FIXED: `frontend/theme/` doesn't exist → replaced with sx pattern note
- ✅ FIXED: Namespace directory casing `Ui/MeetingConfig/` → lowercase `ui/meetingConfig.namespace.ts`
- ✅ FIXED: `Dashboard/` capital → lowercase `dashboard/<segment>/`
- ✅ FIXED: `meeting-ui.types.ts` doesn't exist → references corrected
- ✅ NOTED: 4 AGENTS.md files don't exist (sharedDocuments/meeting/, types/, shared/locale/, settings/types/)
- ✅ FIXED: `DesktopAppDataGrid`/`MobileCardList` paths → correct tier-specific locations
- ✅ FIXED: `DesktopMetricCardGrid`/`MobileMetricCardGrid` paths → correct tier-specific locations

### R3-02: verify-i18n-namespaces (4 issues found)
- ✅ FIXED: `serverLegacy.ts` doesn't exist → replaced with `server.ts` + `server-graphql.ts`
- ✅ FIXED: `getTranslations(locale, namespace)` signature → `getTranslations(locale)` (single arg, returns full tree)
- ✅ FIXED: `message.ts` step added to namespace registration checklist
- ✅ FIXED: Namespace path casing corrected to lowercase

### R3-03: verify-graphql-accuracy (all correct, 2 notes)
- ✅ NOTED: `createClassMeetingConfig` mutations exist but plan doesn't mention them
- ✅ NOTED: Existing `classMeetingConfigsQueryDocument` uses hand-written `ClassOps` namespace

### R3-04: verify-component-props (3 issues found)
- ✅ FIXED: `<Stack direction="row">` prohibition removed — 100+ files use it, it's valid
- ✅ FIXED: `MeetingJoinAction` current props added alongside target props
- ✅ FIXED: Component paths in requirements.md corrected

### R3-05: verify-permissions-enums (3 issues found)
- ✅ FIXED: Role matrix "Create/edit own configs" — SUPER_ADMIN/ACADEMY_ADMIN changed ❌→✅
- ✅ FIXED: Role matrix SUPERVISOR/STAFF over-grant removed (✅→❌)
- ✅ NOTED: `SETTINGS_EDIT_MEETING_INTEGRATIONS` not yet seeded to any group

### R3-06: verify-existing-components (1 note)
- ✅ NOTED: `DisconnectConfirmDialog` already exists in profile dir — plan acknowledges it now

### R3-07: verify-three-tier-architecture (1 HIGH + 3 LOW)
- ✅ FIXED: Added dedicated Task 2b for MeetingIntegrationsTab container redesign
- ✅ FIXED: Added dedicated Task 18b for MeetingConfigsManager container enhancement
- ✅ FIXED: Breadcrumb labels via props (task 24b)
- ✅ FIXED: `createCredentialFormSchema` pinned to `schemas/` directory

### R3-08: verify-cross-ref-consistency (6 blocking + 3 minor)
- ✅ FIXED: Missing container tasks (Task 2b, 18b added)
- ✅ FIXED: `SettingsLinkCallout` phantom replaced with MeetingConfigsManager header button
- ✅ FIXED: 11 untraced ACs — AC-Level Traceability section added
- ✅ FIXED: AC-4.2 permission OR gate documented as functionally equivalent
- ✅ FIXED: i18n key conflicts (testConnectionSuccess, revokeTokenTitle/Warning removed)
- ✅ FIXED: Disconnect i18n key naming unified to §7 scheme (disconnectWarning*)
- ✅ FIXED: `connecting` key name aligned (not `connectingProvider`)
- ✅ FIXED: EndpointList verb "Enhance" → "Redesign" to match design tag
- ✅ FIXED: Server-side `AppPermission` import note added

---

## Rounds 1-2 Findings (from 5 parallel subagents) — ALL FIXED IN PRIOR ROUNDS

## CRITICAL Findings

### C1: Systematic Path Errors (from review-component-paths)
**Issue:** Plan references `components/` subfolder that doesn't exist for both settings and profile meeting configs.

**Settings tab paths (items 2-8):**
- ❌ Plan: `.../settings/tabs/meetingIntegrations/components/*.tsx`
- ✅ Actual: `.../settings/components/meetingIntegrations/*.tsx`

**Profile configs paths (items 10-15):**
- ❌ Plan: `.../profile/shared/meeting-configs/components/*.tsx`
- ✅ Actual: `.../profile/shared/meeting-configs/*.tsx`

**Files affected (settings):** MeetingIntegrationsHealthHeaders, ConnectedAccountsTable, MeetingProviderCredentialForm, TestConnectionResultPanel, RevokeTokenDialog, TokenMetadataDialog, EndpointList

**Files affected (profile):** MeetingConfigsManager, ConnectProviderAccount, AutoGenerationSupportCallout, ReauthNeededBanner, MeetingConfigFormDialog, ClassMeetingConfigsSection

### C2: `Dashboard.ProfileMeetingConfigs` Namespace Does NOT Exist (from review-i18n-graphql)
- ❌ requirements.md L141, L177 claim it exists
- ❌ design.md L1230 lists it under "Existing keys: (preserved)"
- ✅ Actual namespace is `Ui.MeetingConfig` (used at `useMeetingConfigsTabViewModel.ts:17`)
- **Fix:** Replace all references to `Dashboard.ProfileMeetingConfigs` with `Ui.MeetingConfig`, OR explicitly add it as a new namespace following the registration workflow

### C3: Local Types Created Instead of Using Codegen Types (from review-architecture-rules)
- ❌ Task 2 (tasks.md:91-109) creates `frontend/common/types/meeting-ui.types.ts` with locally-defined types
- Violates: `frontend/common/graphql/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md:111-112`
- **Fix:** Move to `frontend/common/views/dashboard/settings/types/meeting-ui.types.ts` (or domain-appropriate views `types/` folder), reduce to gap-only extensions over codegen types, add task to update GraphQL schema + run codegen

### C4: GraphQL Document Naming & Schema Mismatch (from review-i18n-graphql + review-architecture-rules)
- ❌ Document named `CLASS_MEETING_CONFIG_WITH_STATUS` (SCREAMING_SNAKE_CASE) — must be `classMeetingConfigsWithStatusQueryDocument`
- ❌ No `TypedDocumentNode<>` cast specified
- ❌ Uses `$classId` but schema arg is `classInstanceId`
- ❌ Queries `providerSlug` top-level which doesn't exist on `ClassMeetingConfig` (must be `provider { slug }`)
- ❌ Import source for `gql`/`TypedDocumentNode` not specified

## HIGH Findings

### H1: Missing `logger` Usage (from review-architecture-rules)
- Plan never references `logger` from `@/frontend/utils/logger` anywhere
- Error paths (OAuth failures, copy failures, generation failures) only route to toasts
- **Fix:** Add `logger.error` to error paths in ViewModels (tasks 29, 30) and OAuthCallbackHandler (task 11)

### H2: New Namespace Registration Steps Missing (from review-i18n-graphql)
- Three new namespaces (`Dashboard.MeetingUrlStatus`, `Dashboard.OAuthFlow`, `Dashboard.MeetingGeneration`) don't exist
- Plan only lists keys, omits the 7-step registration workflow mandated by `shared/AGENTS.md`
- **Fix:** Task 1 must enumerate all registration files: namespace file, type file, type re-export, EN impl, AR impl, `translation.ts` import + Translation map, `serverLegacy.ts` path, optional `LocaleProvider`

### H3: Permission String Pattern Mismatch (from review-architecture-rules)
- Plan uses raw string literals like `"SETTINGS_EDIT_MEETING_INTEGRATIONS"` instead of `AppPermission.X` enum
- Missing `requirePermissionForPage` (server) / `<RequirePermission>` (client) patterns
- `MEETING_CONFIGS_MANAGE_OTHER` inconsistency (cited in requirements but omitted in design permission mapping)
- **Fix:** Replace bare strings with `AppPermission.X`, add page-level and client-level permission check patterns

### H4: Tier-View Components Incorrectly Use `useAppTranslation` (from review-architecture-rules)
- Many task bodies say "All strings via `useAppTranslation`" for tier views (.mobile.tsx, .desktop.tsx) and components/
- Violates `frontend/common/views/AGENTS.md` Rule 7: tier views receive `labels` via props, must NOT call `useAppTranslation`
- Only ViewModels and `frontend/common/components/ui/` self-contained primitives may call it
- **Fix:** Reword tier-view tasks to "All strings passed as `labels` prop from ViewModel"

## MEDIUM Findings

### M1: `createMeetingConfig` Operation Name Incorrect (from review-i18n-graphql)
- requirements.md L174 lists `createMeetingConfig` — actual name is `createUserMeetingConfig`
- Also: `updateMeetingConfig` → `updateUserMeetingConfig`, `deleteMeetingConfig` → `deleteUserMeetingConfig`
- **Fix:** Correct all operation names in requirements.md and design.md

### M2: Settings Tab Registration Imprecise (from review-permissions-state)
- Plan says `label: "Meeting Integrations"` — actual field is `labelKey: "meetingIntegrations"` (i18n key)
- Plan says `permission: "..."` (singular) — actual is `permissions: [SettingsEditMeetingIntegrations, SettingsView]` (plural array)
- **Fix:** Update design.md to use correct field names

### M3: Profile Tab Registration Imprecise (from review-permissions-state)
- Plan says `label: "Meeting Configs"` — actual field is `i18nKey: "shell.tabs.meeting"`
- Tab has no inline `permission` field — visibility computed via `isMeetingTabVisible` using `PROFILE_MEETING_CONFIGS_VIEW_*` OR `MEETING_CONFIGS_MANAGE_OWN/OTHER`
- requirements.md:506 only cites `MEETING_CONFIGS_MANAGE_OWN` but actual is broader
- **Fix:** Update to use correct field names and complete permission list

### M4: MUI v9 `<Stack direction="row">` Prose (from review-architecture-rules)
- design.md:903 and tasks.md:451 describe `<Stack direction="row">` as direct prop
- Must use `sx={{ direction: "row" }}` per frontend.instructions.md
- **Fix:** Rewrite prose examples

### M5: Duplicate i18n Keys (from review-i18n-graphql)
- Several proposed new keys duplicate existing keys under new names
- `testConnectionSuccess` ≈ existing `testSuccess`
- `revokeTokenTitle` ≈ existing `actions.revokeConfirmTitle`
- `revokeTokenWarning` ≈ existing `actions.revokeConfirm`
- **Fix:** Either reuse existing keys or explicitly state renaming intent

## LOW Findings

### L1: `EntityFormDialogActions` is Feature-Specific (from review-component-paths)
- Exists but at `frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions.tsx`
- Not a generic design-system component under `components/ui/`
- **Fix:** Add note that this is feature-specific, confirm reusability

### L2: `useNotifications` Hook Call Not Shown (from review-architecture-rules)
- design.md:1349 references undefined `notifications` variable
- Should show `const notifications = useNotifications()` in ViewModel samples
- **Fix:** Add hook call to sample code

### L3: Instruction Verification Could Be Broader (from review-architecture-rules)
- Some component tasks only validate against `frontend/AGENTS.md` + `frontend.instructions.md`
- Should also include `frontend/common/views/AGENTS.md` and `frontend/common/graphql/AGENTS.md` where relevant
- **Fix:** Broaden instruction verification sets for applicable tasks

## Additional Findings (from review-existing-patterns)

### C5: BaseDeleteDialog Prop Names Wrong (CRITICAL for implementability)
- ❌ Plan uses `message={...}` and `loading={...}` (design.md:389-398)
- ✅ Actual props: `body` (not `message`), `isLoading` (not `loading`)
- Also has `confirmSx?: SxProps<Theme>` prop

### C6: `useBaseDeleteDialog` Hook Does NOT Exist (CRITICAL for implementability)
- ❌ Plan claims `useBaseDeleteDialog(params)` hook exists
- ✅ Reality: No such hook. Usage wraps `<BaseDeleteDialog>` directly in a per-entity wrapper component
- **Fix:** Remove all references to `useBaseDeleteDialog`, show direct wrapping pattern instead

### H5: DesktopMetricCardGrid MetricItem Shape Wrong (HIGH for implementability)
- ❌ Plan proposes `{ label, value, icon, color }` items
- ✅ Actual `MetricItem` (from `frontend/common/types/shared.types.ts`): `{ key: string, count: number|string, labelKey: string, icon: SvgIconComponent, label?, subLabel?, variant?: "default"|"error"|"highlight"|"danger" }`
- **Fix:** Update all MetricCardGrid usage examples to use correct item shape

### H6: DesktopAppDataGrid & MobileCardList Require `paginationOptions` (HIGH)
- `paginationOptions: ListPaginationOptions` is a REQUIRED prop on both components
- Plan doesn't mention this requirement
- Also: columns are standard `GridColDef[]`, not a custom "column definitions" object
- **Fix:** Add `paginationOptions` to component usage examples

### M6: EntityFormDialogActions Prop Names (MEDIUM)
- Plan may reference `confirmLabel` — actual prop is `saveLabel`
- Also `isLoading` (not `loading`)
- **Fix:** Update prop names in design examples

### M7: MeetingConfigsManager ViewModel Exposed Fields (MEDIUM)
- `generationStatus` IS returned from the hook ✅
- `connectingSlugs` and `reauthProviderSlugs` are INTERNAL only, NOT returned
- Exposed equivalents: `reauthProviders` and `requiresReconnect`
- **Fix:** Update plan to use `reauthProviders`/`requiresReconnect` OR add task to expose internal fields

### M8: `useNotifications` Import Path (MEDIUM)
- Plan references `@toolpad/core` — actual import is `@toolpad/core/useNotifications` (subpath)
- **Fix:** Update import path in all examples

### M9: Session Config Not a Reference for MetricCardGrid (MEDIUM)
- Session Config tab does NOT use `DesktopMetricCardGrid`
- It's only a reference for `DesktopAppDataGrid` + `MobileCardList` + `BaseDeleteDialog`
- **Fix:** Don't cite Session Config as MetricCardGrid reference

### M10: Zod Schema Factory Pattern (MEDIUM)
- Pattern uses `createXxxFormSchema(labels)` factory injecting translated label strings
- Not passing a `t` function to zod
- **Fix:** Update plan to use schema factory pattern with pre-resolved label strings

### L4: settingsTabs.config.ts Full Path
- Actual path includes `config/` directory: `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts`
- **Fix:** Update path references

## CONFIRMED CORRECT

- All 6 permission strings exist in `AppPermission` enum ✅
- All current-state technical claims (raw DataGrid, no zod, raw Dialog, no OAuth callback, incomplete mobile, no copy URL) ✅
- All 7 design system components exist (DesktopMetricCardGrid, MobileMetricCardGrid, DesktopAppDataGrid, MobileCardList, BaseDeleteDialog, ResponsiveViewSwitch, EntityFormDialogActions) ✅
- Both ViewModel hooks exist ✅
- `Dashboard.SettingsMeetingIntegrations` namespace exists with correct `Translation` enum registration ✅
- 10 of 11 GraphQL operations correctly identified (only `createMeetingConfig` name wrong) ✅
- Both GraphQL document file paths correct ✅
- Quality loop + instruction verification per task compliant ✅
- Three-tier architecture (common → desktop → mobile with ResponsiveViewSwitch) compliant ✅
- Service boundaries (Apollo hooks in ViewModels, not direct calls) compliant ✅
- Path aliases (`@/` prefix) compliant ✅
