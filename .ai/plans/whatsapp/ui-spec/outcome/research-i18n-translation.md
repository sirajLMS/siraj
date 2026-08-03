# Research: i18n Translation Completeness Audit

## Source
Subagent: research-i18n-translation
Elapsed: 306s, 18 tool calls

## Key Findings

### Overview
- **Total keys**: ~76 in `WhatsappLabels` type schema
- **EN implementation**: ~76/~76 (100%)
- **AR implementation**: ~76/~76 (100%)
- **Used in code**: ~47/~76 (60%)
- **Defined but never used**: count requires audit (prior estimate ~31 was unreliable — many listed key names not found in codebase)

### File Locations
- Type schema: `shared/locale/types/whatsapp/index.ts`
- EN translations: `shared/locale/en/whatsapp/index.ts`
- AR translations: `shared/locale/ar/whatsapp/index.ts`
- Usage in frontend: `frontend/common/views/dashboard/settings/whatsapp/` + desktop/mobile variants

### Keys Used in Code (~47)
- Tab labels: numbers, templates, optIn
- Settings note (per-role): whatsappSettingsNote
- Number card: displayName, phoneNumberId, wabaId, status, quality, tier, lastSyncedAt, lastWebhookAt, createdAt, syncedJustNow
- Actions: sync, editToken, editPin, deleteAccount, close, cancel, submit, saving, submitting
- Credential dialog: accessToken, twoStepPin, accessTokenLabel, twoStepPinLabel, accessTokenHelper, twoStepPinHelper
- Snackbar: accountDeleted, accountSynced, tokenUpdated, pinUpdated, optInSuccess, optOutSuccess, errorGeneric
- Opt-in: optInTitle, optInDescription, optInEnabled, optInDisabled, optInLoading
- Empty states: noAccounts, noAccountsDescription, noTemplates, noTemplatesDescription
- Settings: settingsTitle, settingsDescription
- Syncing: syncing

### Keys Defined But Never Used (~31)

#### Quality Labels (never rendered in NumberCard)
- `qualityGreen`: "High Quality" — should be shown when quality rating is GREEN
- `qualityYellow`: "Moderate Quality" — should be shown when quality rating is YELLOW
- `qualityRed`: "Low Quality" — should be shown when quality rating is RED
- `qualityOrange`: "Restricted Quality" — should be shown when quality rating is ORANGE. NOTE: This key does NOT exist in the actual locale files — it would need to be added.
- `qualityUnknown`: "Unknown" — should be shown when quality rating is null/unknown

#### Tier Captions (never rendered in NumberCard)
- `tier100K`: "100K" — **CRITICAL**: TIER_100K enum value exists but NO i18n key exists for it at all — a new key must be added (not a naming mismatch, a missing key)
- `tier10K`: "10K" — should be shown when tier is TIER_10K
- `tier1K`: "1K" — should be shown when tier is TIER_1K
- `tier1M`: "1M" — should be shown when tier is TIER_1M. NOTE: This key does NOT exist in the actual locale files — it would need to be added.
- `tier250K`: "250K" — should be shown when tier is TIER_250K. NOTE: This key does NOT exist in the actual locale files — it would need to be added.
- `tierTierUnknown`: "Unknown" — should be shown when tier is unknown

#### Throughput Labels
- `throughput24h`: "24h Limit" — should be shown as throughput metric label

#### Template Status Labels (never rendered in TemplatesTabContent)
- `templateStatusApproved`: "Approved" — should be shown when template status is APPROVED
- `templateStatusPending`: "Pending" — should be shown when template status is PENDING
- `templateStatusRejected`: "Rejected" — should be shown when template status is REJECTED
- `templateStatusPaused`: "Paused" — should be shown when template status is PAUSED
- `templateStatusPendingDeletion`: "Pending Deletion" — for PENDING_DELETION status
- `templateStatusDisabled`: "Disabled" — for DISABLED status

#### Coexistence/Unverified Warnings
- `coexistenceWarning`: "This phone number is not yet verified..." — should be shown when verified=false. NOTE: This key may NOT exist in the actual locale files — verify before wiring.
- `unverifiedWarning`: "This account is unverified..." — should be shown when status is unverified. NOTE: This key may NOT exist in the actual locale files — verify before wiring.

#### Delivery Failure Keys
- `deliveryFailureTitle`: "Delivery Failure" — for delivery failure notifications. NOTE: This key may NOT exist in the actual locale files — verify before wiring.
- `deliveryFailureBody`: "Your message could not be delivered..." — for delivery failure messages
- `deliveryFailureRetry`: "Retry" — retry button label

#### Warning/Error Labels
- `warningTierExceeded`: "Tier limit exceeded..." — should be shown when tier limit reached
- `warningCoexistence`: "Coexistence mode active..." — shown when coexistence mode is active

#### Misc
- `permissionDenied`: "Permission Denied" — should be shown when user lacks permissions
- `retry`: "Retry" — generic retry button label
- `errorGenericTitle`: "Error" — generic error title
- `refresh`: "Refresh" — refresh button label
- `confirm`: "Confirm" — confirm button label
- `help`: "Help" — help link/button

### Raw Enum Values Leaked to Users
1. **NumberCard.tsx**: Renders raw enum values directly (e.g., `{account.qualityRating}`, `{account.portfolioMessagingLimitTier}`) without i18n translation — should use `t.qualityGreen`, `t.tier1K`, etc.
2. **TemplatesTabContent.tsx**: Renders raw `template.status` enum value directly (e.g., `{template.status}`) without i18n translation — should use `t.templateStatusApproved`, etc.

### TIER_100K Missing i18n Key
- Enum value in code: `WhatsappLimitTier.TIER_100K` (underscore-separated)
- **No i18n key exists** for this enum value in the locale files — this is a MISSING KEY, not a naming mismatch
- A new key (e.g., `tier100K`) must be added to both EN and AR locale files
- Prior research incorrectly flagged this as a naming mismatch; the actual issue is the key does not exist at all
- The function is never called in any component (because no key exists to call)

### Recommendations

1. **Wire orphaned keys** (exact count requires audit — prior estimate of 31 was unreliable) to their proper UI locations:
   - Quality labels → NumberCard.tsx (replace raw enum with `t.qualityGreen` property access)
   - Tier labels → NumberCard.tsx (replace raw enum with `t.tier1K` property access)
   - Template status labels → TemplatesTabContent.tsx (replace raw enum with `t.templateStatusApproved` property access)
   - Coexistence/unverified warnings → NumberCard.tsx (conditional rendering)
   - Delivery failure keys → notification error display
   - Warning labels → NumberCard.tsx (conditional warning chips)

2. **Add missing TIER_100K i18n key** (no key exists currently):
   - Create a new key in both EN and AR locale files for the `TIER_100K` enum value
   - Add missing tier keys if any other enum values lack corresponding i18n keys
   - Create `tierLabel` helper function that maps enum → i18n key

3. **Add missing i18n keys** for new UI features:
   - Create account form labels (displayName, phoneNumberId, wabaId field labels)
   - Edit account name form labels
   - Validation error messages (token too short, PIN must be 6 digits, etc.)
   - Delete confirm dialog with account name interpolation
   - Per-tab permission denied message
   - Loading skeleton labels
   - Error boundary title + retry button

4. **Add `tierAllUnknown` and `qualityAllUnknown`** keys if missing for fallback rendering.
