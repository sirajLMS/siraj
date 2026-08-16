# Research: ViewModel and GraphQL Layer Analysis

## Source
Subagent: research-viewmodel-graphql
Elapsed: 2515s, 40 tool calls

## Key Findings

### ViewModel: useWhatsappSettingsViewModel.ts
**Location**: `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts`

**Queries wired (2)**:
- `whatsappAccounts` → fetch all WhatsApp accounts for the business
- `isUserWhatsappOptIn` → fetch opt-in state for current non-admin user

**Mutations wired (5)**:
- `deleteWhatsappAccount` → Delete account by id (with confirmation)
- `setWhatsappAccessToken` → Update access token credential
- `setWhatsappTwoStepPin` → Update two-step PIN credential
- `syncFromMeta` → Sync templates and phone number quality from Meta
- `setUserWhatsappOptIn` → Toggle non-admin user opt-in

**Mutations NOT wired (2)**:
- `createWhatsappAccount` → Create a new WhatsApp Business account (NEVER called in UI)
- `updateWhatsappAccount` → Update account display name or config (NEVER called in UI)

**State managed**:
- `accounts` (from query)
- `optInState` (from query)
- `snackbar` (success/error message + severity)
- `syncingId` (NEW — which account is currently syncing; current ViewModel only has boolean 'syncing', not per-id)
- `dialogOpen` state for credential dialogs (editToken/editPin) + deleteConfirm
- `selectedAccountId` (for dialog context)

**Handlers**:
- `handleDelete`, `handleEditToken`, `handleEditPin`, `handleSync`, `handleToggleOptIn`
- `handleCloseDialog`, `handleSubmitToken`, `handleSubmitPin`
- `handleDialogSubmitting` (tracks submitting state)

### GraphQL Documents: whatsapp.documents.ts
**Location**: `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts`

**Queries (2)**:
- `WhatsappAccountsQueryDocument` (id, displayName, status, qualityRating, tier, phoneNumberId, wabaId, lastSyncedAt, lastWebhookAt, createdAt)
- `IsUserWhatsappOptInQueryDocument` (optedIn, optedInAt)

**Mutations (7)**:
- `CreateWhatsappAccountMutationDocument` (input: displayName, phoneNumberId, wabaId) — UNUSED
- `UpdateWhatsappAccountMutationDocument` (input: id, displayName) — UNUSED
- `DeleteWhatsappAccountMutationDocument` (id)
- `SetWhatsappAccessTokenMutationDocument` (id, accessToken)
- `SetWhatsappTwoStepPinMutationDocument` (id, twoStepPin)
- `SyncFromMetaMutationDocument` (id) → returns templates
- `SetUserWhatsappOptInMutationDocument` (optedIn) — non-admin toggle

### Missing Documents
- **No persisted templates query**: `WhatsappTemplatesQueryDocument` does not exist (exported as camelCase `whatsappTemplatesQueryDocument` per existing convention). Templates vanish on remount because there's no query to refetch them. Only available from sync mutation result.
- **No audit trail query**: For opt-in audit trail (Task 26.6), need `WhatsappOptInAuditQueryDocument`.

### Architectural Dependencies
- ViewModel reads `currentUser` (from `useCurrentUser` hook) to determine if user is admin vs non-admin
- Admin sees accounts list + credential management; non-admin sees opt-in toggle
- GraphQL permissions enforced at resolver level (WHATSAPP_MANAGE, WHATSAPP_OPT_IN_MANAGE)
- Apollo cache normalization: all queries/mutations include `id` field for cache updates

### Missing Exposed State
1. **Mutation loading not directly exposed**: ViewModel doesn't expose individual mutation loading states (only boolean `syncing` for sync (no per-row `syncingId` exists yet)). No `deletingId`, `updatingId`, etc.
2. **No error state per mutation**: Errors caught at snackbar level only. No way for UI to show inline error on specific dialog/row.
3. **No accounts pagination**: Loads all accounts at once. Acceptable for MVP (low count), but not future-proof.
4. **No optimistic updates**: All mutations wait for server response. No optimistic UI for delete/sync/credential update.
5. **No refetch trigger on create**: Create mutation not wired, so no refetch flow defined.

### Test Coverage Gaps
**Location**: `test/ui/components/useWhatsappSettingsViewModel.test.tsx`

**Existing tests (6)**:
1. renders accounts on load
2. shows empty state when no accounts
3. calls delete mutation on handleDelete
4. calls sync mutation on handleSync
5. handles opt-in toggle for non-admin user
6. renders opt-in state

**Missing tests**:
1. Create account mutation flow (not tested — mutation not wired)
2. Update account mutation flow (not tested — mutation not wired)
3. Set access token mutation with invalid input (no validation test)
4. Set two-step PIN mutation with invalid input (no validation test)
5. Delete confirm dialog rendering + cancellation
6. Sync loading state + feedback
7. Error handling per mutation (snackbar severity)
8. Opt-in toggle loading state
9. Credential dialog submission + close
10. Accounts refetch after mutation

### Recommendations for UI Plan

1. **Wire create/update mutations**: 
   - Add `handleCreate` and `handleUpdateAccount` to ViewModel
   - Expose `creating` and `updatingId` loading states
   - Add form validation before calling mutations

2. **Add persisted templates query**:
   - Create `WhatsappTemplatesQueryDocument` in whatsapp.documents.ts (exported as camelCase `whatsappTemplatesQueryDocument` per existing convention)
   - Add to ViewModel as a separate query
   - Templates persist across remounts

3. **Expose per-mutation loading states**:
   - `deletingId: string | null`
   - `creating: boolean`
   - `updatingId: string | null`
   - `syncingId` (NEW — must be added)
   - Enable per-row loading indicators

4. **Add form validation**:
   - Access token: minLength check (Meta tokens are ~100+ chars)
   - Two-step PIN: exactly 6 digits
   - Display name: 1-100 chars, no special chars
   - Phone number ID: numeric string
   - WABA ID: numeric string

5. **Add error state exposure**:
   - `mutationError: Error | null` (for inline error display)
   - Allow UI to show error on specific dialog/row, not just snackbar

6. **Add account name to delete confirm**:
   - Pass `displayName` to DeleteConfirmDialog (DeleteConfirmDialog already exists in NumbersTab.desktop.tsx:48-85, wired at :290-296, but is buggy — it doesn't render the account name. Must be repaired.)
   - Show "Delete '{displayName}'?" instead of generic message
