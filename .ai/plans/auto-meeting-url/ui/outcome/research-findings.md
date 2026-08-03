# Research Findings — UI/UX Improvement Plan for Auto Meeting URL

## Research Phase: 3 Parallel Explore Subagents

### 1. Backend GraphQL Capabilities (research-backend-graphql)

#### Available Queries
- `meetingProviders` — list all providers in catalog
- `meetingProvider(id)` — single provider
- `userMeetingConfigs` — teacher's personal configs
- `userMeetingConfig(id)` — single config
- `classMeetingConfigs` — class-level meeting configs
- `recurringMeetingConfigs` — recurring meeting configs
- `meetingIntegrationProviders` — admin: list providers with health/credentials
- `meetingIntegrationConnectedAccounts` — admin: list connected OAuth accounts
- `myConnectedMeetingProviders` — teacher: list own connected providers

#### Available Mutations
- `createMeetingProvider` — admin: add provider to catalog
- `updateMeetingProvider` — admin: update provider config
- `deleteMeetingProvider` — admin: remove provider
- `createUserMeetingConfig` — teacher: create personal config
- `updateUserMeetingConfig` — teacher: update config
- `deleteUserMeetingConfig` — teacher: delete config
- `setDefaultMeetingConfig` — teacher: set default config
- `createClassMeetingConfig` — teacher: create class-level config
- `updateClassMeetingConfig` — teacher: update class config
- `deleteClassMeetingConfig` — teacher: delete class config
- `setDefaultClassMeetingConfig` — teacher: set default class config
- `generateMeetingUrl` — preview-only, non-persisting URL generation
- `testMeetingProviderConnection` — admin: test provider health
- `adminRevokeMeetingProviderToken` — admin: revoke OAuth token
- `connectMeetingProviderOAuth` — returns authorizeUrl + state for browser redirect
- `disconnectMeetingProviderOAuth` — disconnect provider

#### OAuth Flow
1. UI calls `connectMeetingProviderOAuth(providerSlug)` → returns `{ authorizeUrl, state }`
2. Browser redirects to `authorizeUrl` (provider's OAuth page)
3. User authorizes → provider redirects to `/api/oauth/{provider}/callback?code=xxx&state=xxx`
4. Callback route stores token, redirects to `returnPath`
5. **Gap**: No auto-refresh in UI — user must manually refresh

#### Missing Backend Operations (Design Constraints)
- No generation status query for class instances
- No manual re-generate mutation for class instances
- No `expiresAt` populated in GenerateMeetingUrlResult
- No class-instance field exposing generation error
- No subscription for async generation progress

#### Permissions
- `SETTINGS_EDIT_MEETING_INTEGRATIONS` — admin settings tab
- `SETTINGS_VIEW` — view-only settings
- `MEETING_CONFIGS_MANAGE_OWN` — teacher self-service
- `MEETING_CONFIGS_MANAGE_OTHER` — manage others' configs
- `MEETING_CONFIGS_MANAGE_CLASS` — class-level configs
- `MEETING_PROVIDERS_MANAGE_CATALOG` — provider catalog

---

### 2. Current UI State (research-ui-views)

#### Settings Tab Components
- `MeetingIntegrationsTab.tsx` — lazy-loader → desktop/mobile variants
- `useMeetingIntegrationsViewModel.ts` — providers, connected accounts, test, revoke
- `MeetingIntegrationsHealthHeaders` — provider health cards (raw Card+Grid)
- `ConnectedAccountsTable` — connected accounts (raw DataGrid)
- `MeetingProviderCredentialForm` — provider credential form (no zod)
- `TestConnectionResultPanel` — test result display
- `RevokeTokenDialog` — raw Dialog (not BaseDeleteDialog)
- `TokenMetadataDialog` — token metadata viewer
- `EndpointList` — endpoint URL list

#### Profile Meeting Configs Components
- `MeetingConfigsManager.tsx` — main container
- `useMeetingConfigsManagerViewModel.ts` — generationStatus, connectingSlugs, reauthProviderSlugs
- `ConnectProviderAccount.tsx` — OAuth connect button
- `AutoGenerationSupportCallout.tsx` — static info card
- `ReauthNeededBanner.tsx` — reauth prompt
- `MeetingConfigFormDialog.tsx` + Content — config CRUD form
- `MeetingConfigDeleteDialog.tsx` — delete config
- `ClassMeetingConfigsSection.tsx` — class-level configs
- `DisconnectConfirmDialog.tsx` — disconnect confirmation
- `LinkedClassInstancesList.tsx` — class instances using config
- `ViewBookingsLink.tsx` — link to bookings

#### MeetingJoinAction Component
- Three variants: "action" (primary button), "button" (with OpenInNew), "icon" (IconButton)
- States: join URL ready, URL pending chip, setup link alert, disabled+tooltip
- Used in: teacher dashboard schedule grid, student next class card

#### Navigation
- Settings tab registered: `meetingIntegrations` id, `VideocamOutlined` icon
- Profile tab: `meeting` id
- No dedicated sidebar for meeting-providers (redirects to payment-catalogs)

#### UI Gaps Identified
1. No "Connect Provider" in Settings tab (admin tab is diagnostic only)
2. No auto-generation onboarding wizard (just static info card)
3. No URL display in data tables (only button/tooltip)
4. No copy URL for non-admin users
5. No URL-pending status indicators in tables (except MeetingJoinAction chip)
6. No "reconnect all" batch action
7. No bulk-test connections
8. No URL generation from schedule grid
9. No URL expiration display
10. ConnectedAccountsTable uses raw DataGrid (not DesktopAppDataGrid)
11. Health headers use raw Card+Grid (not MetricCardGrid)
12. MeetingProviderCredentialForm lacks zod validation
13. Accordion-based providers (inconsistent with DataGrid pattern)
14. No cross-linking between settings and profile
15. RevokeTokenDialog uses raw Dialog (not BaseDeleteDialog)

---

### 3. Design System Patterns (research-design-system)

#### Architecture
- Three-tier: `frontend/common/` → `frontend/desktop/` → `frontend/mobile/`
- Server page → PageContainer → ViewModel → ResponsiveViewSwitch

#### Tab Navigation
- URL-param-based (`?tab=xxx`)
- `settingsTabs.config.ts` defines tab id, label, icon, permission, lazy import
- Tabs filtered by permissions in ViewModel

#### Dialog Patterns
- Delete: `BaseDeleteDialog` with `useBaseDeleteDialog(params)` hook
- Form: `EntityFormDialogActions` for footer (submit/cancel buttons)
- Confirmation: MUI Dialog with Alert

#### Form Patterns
- `react-hook-form` + `@hookform/resolvers/zod` + zod schema
- Translated labels via `useAppTranslation`
- `EntityFormDialogActions` for submit/cancel footer

#### Notification Pattern
- `useNotifications()` from `@toolpad/core`
- Called in ViewModel hooks, NOT in view components
- `notifications.show(message, { severity: 'success' | 'error' })`

#### Loading Pattern
- `CircularProgress` + Typography with translated "Loading..." label
- Lazy load fallbacks use `CircularProgress`

#### Error Pattern
- `<Alert severity="error">` with translated error label
- Error boundary wraps lazy-loaded components

#### Empty State Pattern
- Typography with `text.secondary` color and translated message
- Icon + message for visual clarity

#### Metrics Pattern
- `DesktopMetricCardGrid` / `MobileMetricCardGrid` with `MetricCard` items
- Items: `{ label, value, icon, color }`
- NEVER raw Card+Grid for metrics

#### Data Table Pattern
- `DesktopAppDataGrid` with MUI DataGrid (column defs, slots, pagination)
- `MobileCardList` with card-based layout for mobile
- NEVER raw MUI DataGrid

#### Reference Tab: Session Config
- Gold standard for settings tab implementation
- Zustand store for state
- Form dialog with zod validation
- Delete dialog with BaseDeleteDialog
- DesktopAppDataGrid for main data
- MobileCardList for mobile
- MetricCardGrid for summary stats

#### MUI v9 Rules
- No style props on Typography/Stack/Box/Grid (use `sx` prop)
- Icons: `*Outlined` suffix (NOT `*Outline`)
- No hardcoded colors — all from `theme.palette`
- Use `theme.palette.onPrimary` etc. for contrast

#### i18n Pattern
- `useAppTranslation(Translation.Dashboard.SettingsMeetingIntegrations)`
- Namespace: `shared/locale/namespaces/dashboard/settings/meetingIntegrations.namespace.ts`
- Types: `shared/locale/types/dashboard/settings/meeting-integrations.ts`
- Server: `getTranslations(locale, "namespace")`
- Never hardcode strings

---

## Summary

The research phase identified 15+ UI gaps across settings tab, profile meeting configs, and meeting URL display components. The design system has clear patterns (DesktopAppDataGrid, MetricCardGrid, BaseDeleteDialog, zod validation) that the meeting integrations UI currently violates. The backend has all necessary GraphQL operations for the UI improvements, with some missing operations documented as design constraints.

**Key takeaway**: The meeting integrations UI needs to be aligned with the project's established component patterns, with full mobile-desktop parity, proper form validation, and enhanced UX for OAuth flows and URL generation feedback.
