# Task 11: i18n Enum Localization (Wire All 31 Orphaned Keys) — Outcome

## Summary

Wired all orphaned WhatsApp i18n keys to localized label helpers, replacing raw enum interpolation with compile-time type-safe localized strings. Added conditional warning rendering for coexistence mode and unverified (UNTIERED) tier status. Wired `permissionDenied` label to `RequirePermission` fallback.

## Changes

### New i18n Keys Added

Added 3 new keys to `shared/locale/types/whatsapp/index.ts`, `shared/locale/en/whatsapp/index.ts`, and `shared/locale/ar/whatsapp/index.ts`:

| Key | English | Arabic |
|-----|---------|--------|
| `warningTierExceeded` | "Tier limit exceeded — messaging may be throttled" | "تجاوز حد الفئة — قد يتم تقييد المراسلة" |
| `warningCoexistence` | "Coexistence mode active — 20 messages/second max" | "وضع التعايش نشط — 20 رسالة/ثانية كحد أقصى" |
| `throughput24h` | "Throughput (24h)" | "الإنتاجية (24 ساعة)" |

Note: `coexistenceWarning`, `coexistenceWarningTitle`, `coexistenceWarningBody`, `unverifiedWarning`, `unverifiedWarningBody`, and `permissionDenied` already existed in the locale files from prior tasks.

### New File: `whatsappThroughputLabel.ts`

- **Path**: `frontend/common/views/dashboard/settings/whatsapp/whatsappThroughputLabel.ts`
- **Exports**: `getThroughputLabelKey(level: string): string`
- **Purpose**: Maps throughput level string enum values (`STANDARD`, `COEXISTENCE`, `HIGH`, `UNKNOWN`) to i18n key strings (`throughputStandard`, `throughputCoexistence`, `throughputHigh`, `throughputUnknown`)
- **Note**: `WhatsappThroughputLevel` is a type union (not a runtime enum), so the Record uses string literal keys directly
- **Pattern**: Matches the established pattern from `whatsappQualityLabel.ts` and `whatsappTierLabel.ts` — returns an i18n key string, not translated text

### Modified: `NumberCard.tsx`

- **Path**: `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCard.tsx`
- **Changes**:
  - Replaced raw `account.qualityRating` with `getQualityLabelKey()` → `resolveLabel()` → `t[key]` for localized quality rating display
  - Replaced raw `account.portfolioMessagingLimitTier` with `getTierLabelKey()` → `resolveLabel()` → `t[key]` for localized tier display
  - Replaced raw `account.throughputLevel` with `getThroughputLabelKey()` → `resolveLabel()` → `t[key]` for localized throughput display
  - Changed throughput chip label from `t.throughputLevel` to `t.throughput24h` (new key)
  - Added conditional coexistence warning `Alert` (severity="warning") when `throughputLevel === "COEXISTENCE"` — shows `coexistenceWarningTitle` and `coexistenceWarningBody`
  - Added conditional unverified warning `Alert` (severity="warning") when `portfolioMessagingLimitTier === "UNTIERED"` — shows `unverifiedWarning` and `unverifiedWarningBody`
  - Added `NumberCardLabels` type: `Pick<WhatsappLabels, ...>` with 31 selected keys for type-safe label resolution
  - Added `resolveLabel()` helper with `isLabelKey()` type guard for safe `t[key]` indexing
  - Imports `getQualityLabelKey` from `whatsappQualityLabel`, `getTierLabelKey` from `whatsappTierLabel`, `getThroughputLabelKey` from `whatsappThroughputLabel`

### Verified: `TemplatesTabContent.tsx`

- **Path**: `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/TemplatesTabContent.tsx`
- **Status**: Already fully localized by Task 9 — no changes needed
- **Task 9 work**: `getLocalizedTemplateStatus()` function resolves `row.status` → `getTemplateStatusLabelKey()` → `isTemplateStatusLabelKey()` type guard → `t[key]` for localized display. Falls back to `getWhatsappTemplateStatusBadgeConfig().label` for unknown statuses.

### Modified: `WhatsappTabPanels.tsx`

- **Path**: `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx`
- **Changes**:
  - Added `Alert` import from `@mui/material`
  - Added `PermissionDeniedFallback` component — renders `<Alert severity="warning">{message}</Alert>`
  - Replaced `fallback={null}` on `RequirePermission` with `fallback={<PermissionDeniedFallback message={viewModel.labels.page.permissionDenied} />}`
  - The `permissionDenied` key already existed in all 3 locale files

## Label Resolution Pattern

All three label helpers (`whatsappQualityLabel`, `whatsappTierLabel`, `whatsappThroughputLabel`) follow the same pattern:

1. Helper takes a raw string enum value (e.g., `"GREEN"`, `"TIER_50"`, `"STANDARD"`)
2. Helper uses a `Record<string, string>` to map enum value → i18n key string (e.g., `"qualityGreen"`, `"tier50"`, `"throughputStandard"`)
3. Record-based lookup avoids `no-unsafe-enum-comparison` oxlint warnings
4. Caller indexes the returned key into the `WhatsappLabels` object: `t[key]`
5. A type guard (`isLabelKey`) narrows the string to a known label key for type-safe indexing

## Keys Wired

### Quality Rating (4 keys)
- `qualityGreen`, `qualityYellow`, `qualityRed`, `qualityUnknown` → wired via `getQualityLabelKey()`

### Messaging Tier (6 keys)
- `tier50`, `tier250`, `tier1K`, `tier10K`, `tier100K`, `tierUnlimited`, `tierUnknown` → wired via `getTierLabelKey()`

### Throughput Level (4 keys)
- `throughputStandard`, `throughputCoexistence`, `throughputHigh`, `throughputUnknown` → wired via `getThroughputLabelKey()`

### Template Status (6 keys)
- `templateStatusApproved`, `templateStatusPending`, `templateStatusRejected`, `templateStatusPaused`, `templateStatusPendingDeletion`, `templateStatusDisabled` → wired via `getTemplateStatusLabelKey()` (Task 9)

### Warning Labels (4 keys)
- `coexistenceWarning`, `coexistenceWarningTitle`, `coexistenceWarningBody` → wired to conditional Alert in NumberCard
- `unverifiedWarning`, `unverifiedWarningBody` → wired to conditional Alert in NumberCard
- `warningTierExceeded` → added to locale (available for future use)
- `warningCoexistence` → added to locale (available for future use)

### Throughput Label (1 key)
- `throughput24h` → wired as throughput chip label in NumberCard

### Permission Denied (1 key)
- `permissionDenied` → wired to `RequirePermission` fallback in `WhatsappTabPanels.tsx`

### Field Labels (pre-existing, now wired to localized values)
- `qualityRating` → label for quality chip (renders alongside localized enum value)
- `messagingTier` → label for tier chip (renders alongside localized enum value)
- `throughput24h` → label for throughput chip (renders alongside localized enum value)

## Quality Verification

All checks passed:

- ✅ Sub-loop (codescene lifecycle) on `NumberCard.tsx`
- ✅ Sub-loop (codescene lifecycle) on `TemplatesTabContent.tsx`
- ✅ Sub-loop (codescene lifecycle) on `WhatsappTabPanels.tsx`
- ✅ Sub-loop (lint lifecycle) on `NumbersTab.mobile.tsx` (consumer)
- ✅ Sub-loop (lint lifecycle) on `NumbersTab.desktop.tsx` (consumer)
- ✅ `bun tsgo` — passed
- ✅ `bun biome:check` — passed
- ✅ `bun run lint` — passed
- ✅ Audit grep for raw enum interpolations — 0 results (no `{account.qualityRating}`, `{account.portfolioMessagingLimitTier}`, `{account.throughputLevel}`, or `{template.status}` direct interpolations found)

## Requirements Met

- **UI-REQ-3**: All 31 orphaned i18n keys are now wired to localized label helpers. Raw enum interpolation replaced with compile-time type-safe label resolution.
