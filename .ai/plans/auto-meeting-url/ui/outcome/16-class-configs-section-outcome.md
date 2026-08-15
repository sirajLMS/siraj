# Task 16 Outcome: Enhance `ClassMeetingConfigsSection` with generation status

## Date
Completed successfully.

## Summary

Enhanced `ClassMeetingConfigsSection` to display per-class-instance meeting URL generation status, with retry and copy-url capabilities, plus URL expiration display.

## Files Modified

### 1. `frontend/common/graphql/sharedDocuments/meeting/meeting.documents.ts`
- Added `classMeetingConfigsWithStatusQueryDocument` — a new GraphQL query that fetches class meeting configs with status-related fields:
  - `meetingUrlStatus` (string | null) — pending/generated/failed
  - `meetingUrlExpiresAt` (string | null) — ISO timestamp for URL expiration (new backend field from Task 2)
  - `meetingUrlError` (string | null) — error message if generation failed
  - Nested `provider { id slug name providerKind isActive fieldSchema { ... } }` — provider info including `slug` (NOT a top-level `providerSlug` field)
- Document naming convention: `classMeetingConfigsWithStatusQueryDocument` (camelCase, not SCREAMING_SNAKE)
- Query variable: `$classInstanceId` (NOT `$classId`)
- Typed via `TypedDocumentNode<Operations.ClassMeetingConfigsWithStatusQuery, Types.QueryClassMeetingConfigsArgs>` (reuses same args type as the base `classMeetingConfigs` query — `QueryClassMeetingConfigsWithStatusArgs` does NOT exist since the query uses the same root field)

### 2. `frontend/common/views/dashboard/profile/shared/types/meetingConfigProfile.types.ts`
- Added `MeetingConfigEnhancementLabels` import and `enhancements` field to `MeetingConfigProfileLabels` type
- This allows the ViewModel labels hook to pass enhancement labels (generation status, retry, copy URL, expiration) to the view component

### 3. `frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigProfileLabels.ts`
- Added `enhancements: meetingConfig.enhancements` to the returned labels object
- This wires the `MeetingConfigEnhancementLabels` from the locale system into the ViewModel labels

### 4. `frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.tsx`
Enhanced with the following new features:

#### New sub-components and helpers:
- **`MeetingGenerationStatusIndicator`** (placeholder): A `Chip` component showing generation status (pending/success/failed). Uses `// Placeholder:` comment (NOT `// TODO`) since the dedicated component will be built in Phase 4.
  - `pending` → default-colored outlined Chip with `labels.generationPending`
  - `generated` (success) → success-colored outlined Chip with `labels.generationSuccess`
  - `failed` → error-colored outlined Chip with `labels.generationFailed`
- **`resolveGenerationStatus`**: Maps the string status from backend (`"pending" | "generated" | "failed"`) to the union type, defaulting to `"pending"` for null/unrecognized values.
- **`formatExpiry`**: Null-safe helper that formats `meetingUrlExpiresAt` into a human-readable expiration message:
  - Returns `null` for null/invalid dates
  - Returns `labels.expired` if the expiry date has passed
  - Returns `labels.expiresInHours(hours)` if < 24 hours remaining
  - Returns `labels.expiresInDays(days)` if ≥ 24 hours remaining
- **`StatusExtra`**: Renders per-config status UI via `MeetingConfigList`'s `renderRowExtra` slot:
  - Generation status indicator (placeholder Chip)
  - "Retry Generation" IconButton (with `RefreshOutlinedIcon`) — shown only for failed configs
  - "Copy Meeting URL" IconButton (with `ContentCopyOutlinedIcon`) — shown only when `meetingUrl` is non-empty
  - URL expiration display (Typography with formatted expiry text)
  - All hooks called unconditionally (Rules of Hooks compliance — no hooks after early returns)

#### Hook changes:
- **`useScopeQueries`**: Added a secondary `useQuery` for `classMeetingConfigsWithStatusQueryDocument` (class scope only). Builds a `StatusMap` (ReadonlyMap keyed by config ID) from the status query data. Returns `statusMap` alongside existing `loading`, `error`, `refetch`, `configs`.

#### Main component changes:
- Added retry handler (`handleRetry`) that calls `updateClassMeetingConfigMutationDocument` with empty input to trigger URL regeneration for failed configs
- Passes `enhancements` (labels), `statusMap`, and `onRetry` to `ConfigsContent`
- `ConfigsContent` passes `renderRowExtra` to `MeetingConfigList` which renders `StatusExtra` per config card

## Key Implementation Decisions

1. **Status query approach**: Instead of modifying the existing `classMeetingConfigsQueryDocument`, a separate `classMeetingConfigsWithStatusQueryDocument` was created to avoid breaking existing consumers and to clearly separate the enhanced status query from the base config list query.

2. **`statusMap` pattern**: The status data is fetched from a separate query and joined by config ID via a `ReadonlyMap`. This allows the existing `MeetingConfigList` component to render configs from the original query while overlaying status information from the status query.

3. **Retry mechanism**: The retry button calls `updateClassMeetingConfig` mutation with empty input `{}` (all fields in `ClassMeetingConfigUpdateInput` are optional `InputMaybe`). The backend re-saves the config which triggers URL regeneration. This is a reasonable approach until a dedicated "regenerate URL" mutation is available.

4. **Labels from ViewModel**: All user-facing strings (generation status, retry, copy URL, expiration) are passed via `labels.enhancements` from the `useMeetingConfigProfileLabels` hook. No `useAppTranslation` is called directly in the view component (per Rule 7).

5. **Null-safe handling**: All backend fields (`meetingUrlStatus`, `meetingUrlExpiresAt`, `meetingUrlError`, `details.meetingUrl`, `provider.slug`, `config.id`) are nullable and handled gracefully throughout.

6. **Provider slug**: Read as nested `provider { slug }` — there is NO top-level `providerSlug` field on `ClassMeetingConfig`.

## Verification

All modified files passed `sub-loop.ts --lifecycle lint` (tsgo → oxlint → biome → lint:type-aware):

| File | tsgo | oxlint | biome | lint:type-aware | Result |
|------|------|--------|-------|-----------------|--------|
| `meeting.documents.ts` | ✅ | ✅ | ✅ | ✅ | All passed |
| `meetingConfigProfile.types.ts` | ✅ | ✅ | ✅ | ✅ | All passed |
| `useMeetingConfigProfileLabels.ts` | ✅ | ✅ | ✅ | ✅ | All passed |
| `ClassMeetingConfigsSection.tsx` | ✅ | ✅ | ✅ | ✅ | All passed |

## Requirements Met
- AC-2.7: Class meeting config generation status display
- AC-6.1: Generation status badge per class instance (pending/success/failed)
- AC-6.2: Retry generation and copy URL actions for class configs
