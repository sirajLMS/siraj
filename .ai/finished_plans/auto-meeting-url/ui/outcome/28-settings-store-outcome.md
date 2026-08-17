# Task 28: Update `meetingIntegrationsSettingsStore` with new state fields

## Summary

Extended the Zustand store `frontend/common/stores/meetingIntegrationsSettingsStore.ts` with seven new state fields, their corresponding setters, and a permission-gated `canViewProfile` boolean for the `ProfileLinkCallout` component. Also added the `CredentialFormMode` UI-only type to `meeting-ui.types.ts`.

## Files Modified

### 1. `frontend/common/views/dashboard/settings/types/meeting-ui.types.ts`
- **Added** `CredentialFormMode` type (`"create" | "edit"`) after `OAuthConnectionStatus` (~line 38).
- This is a UI-only type (no codegen equivalent), consistent with the existing `TestConnectionState` and `OAuthConnectionStatus` pattern in that file.

### 2. `frontend/common/stores/meetingIntegrationsSettingsStore.ts`

#### New imports
- `AppPermission`, `MeetingIntegrationProviderSlug` from `@/frontend/common/graphql/generated/gql/graphql-types`
- `CredentialFormMode`, `TestConnectionResult` from `@/frontend/common/views/dashboard/settings/types/meeting-ui.types`
- `MeetingIntegrationConnectedAccount`, `MeetingIntegrationProviderSummary`, `TestMeetingConnectionResult` from `@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types`

#### New exported constant
- `MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION = AppPermission.SettingsEditMeetingIntegrations` — exported so the ViewModel (Task 29) can seed `canViewProfile` via `useUserStore(s => s.hasPermission(MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION))` without duplicating the enum value as a bare string literal.

#### New state fields (interface `MeetingIntegrationsSettingsUiState`)
| Field | Type | Default | Purpose |
|---|---|---|---|
| `testingProviderSlug` | `MeetingIntegrationProviderSlug \| null` | `null` | Provider slug currently being tested (canonical name for the new test-connection flow) |
| `revokingAccountId` | `string \| null` | `null` | Connected account id currently being revoked (decoupled from userId) |
| `connectingProviderSlug` | `MeetingIntegrationProviderSlug \| null` | `null` | Provider slug initiating the OAuth connect flow from the settings tab |
| `testConnectionResult` | `TestConnectionResult \| null` | `null` | Last test-connection result shared across the panel |
| `metadataDialogAccountId` | `string \| null` | `null` | Account id targeted by the TokenMetadataDialog (resolved to account object by ViewModel) |
| `credentialFormProvider` | `MeetingIntegrationProviderSummary \| null` | `null` | Provider summary loaded into the credential form dialog (create/edit) |
| `credentialFormMode` | `CredentialFormMode` | `"create"` | Whether the credential form dialog is creating or editing credentials |
| `canViewProfile` | `boolean` | `false` | Permission-gated visibility flag for `ProfileLinkCallout` (deny by default) |

#### New setters
- `setTestingProviderSlug(slug: MeetingIntegrationProviderSlug | null) => void`
- `setRevokingAccountId(accountId: string | null) => void`
- `setConnectingProviderSlug(slug: MeetingIntegrationProviderSlug | null) => void`
- `setTestConnectionResult(result: TestConnectionResult | null) => void`
- `setMetadataDialogAccountId(accountId: string | null) => void`
- `setCredentialFormProvider(provider: MeetingIntegrationProviderSummary | null) => void`
- `setCredentialFormMode(mode: CredentialFormMode) => void`
- `setCanViewProfile(value: boolean) => void`

#### `ProfileLinkCallout` visibility check
- The `canViewProfile` boolean is gated via `AppPermission.SettingsEditMeetingIntegrations` (not a bare string literal).
- The `MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION` constant is exported so the ViewModel (Task 29) can compute the permission without duplicating the enum value.
- Default is `false` (deny by default), re-checked whenever the user/session changes.

## Pre-existing fields preserved
All pre-existing fields and setters (`expandedSlug`, `loadingAccountsFor`, `connectedAccountsByProvider`, `testingFor`, `lastTestResultByProvider`, `revokingFor`, `metadataDialogAccount`, `metadataDialogProviderSlug`, `reset`) remain unchanged.

## Quality Verification
Both modified files passed the `sub-loop.ts --lifecycle lint` verification (tsgo → oxlint → biome → lint:type-aware) with exit code 0:
- `frontend/common/stores/meetingIntegrationsSettingsStore.ts` ✅
- `frontend/common/views/dashboard/settings/types/meeting-ui.types.ts` ✅

## Dependencies on prior tasks
- Task 10 (`ProfileLinkCallout.tsx`) — established the `RequirePermission` pattern using `AppPermission.SettingsEditMeetingIntegrations`; Task 28's `canViewProfile` is the store-level complement.
- Task 1–2 (type definitions) — `MeetingIntegrationProviderSummary`, `TestConnectionResult` types pre-exist in the types layer.

## Downstream consumers
- **Task 29** (`useMeetingIntegrationsViewModel`) — will consume `MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION` and seed `canViewProfile`.
- **Task 30+** (UI component updates) — will use `testingProviderSlug`, `connectingProviderSlug`, `credentialFormProvider`, `credentialFormMode`, etc. from the store.
