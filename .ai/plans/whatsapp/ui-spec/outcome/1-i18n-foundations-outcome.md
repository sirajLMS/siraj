# Task 1 Outcome: i18n Key Additions & Label Helpers

## Summary

Added missing i18n keys for WhatsApp configuration UI (form labels, validation messages, delete confirm with interpolation, state labels, template preview labels, error boundary) and created three label helper functions that map Meta enum values to localized i18n keys. Fixed the `no-unsafe-enum-comparison` oxlint rule by using record-based lookups instead of switch statements comparing enum values with string parameters.

## Files Modified (3)

### 1. `shared/locale/types/whatsapp/index.ts`
- Added `templateStatusPendingDeletion` and `templateStatusDisabled` to `WhatsappLabels` interface (were missing — enum values existed but no keys)
- Added `tier100K` key (was missing — `WhatsappLimitTier.TIER_100K` enum value had no corresponding key)
- Added 22 new keys: form labels (`createAccountTitle`, `editNameTitle`, `displayNameLabel`, `phoneNumberIdLabel`, `wabaIdLabel`, `displayNameHelper`, `phoneNumberIdHelper`, `wabaIdHelper`), validation messages (8 keys), delete confirm with interpolation (`deleteConfirmTitle` string, `deleteConfirmMessage` function), state labels (`loadingTitle`, `retry`, `refresh`, `permissionDenied`), account actions (`editName`, `addFirstNumber`), template preview (`templateBody`, `templateButtons`, `templateLastUpdated`), error boundary (`errorGenericTitle`)

### 2. `shared/locale/en/whatsapp/index.ts`
- Implemented all new keys with English strings
- Added missing `templateStatusPendingDeletion: "Pending Deletion"`, `templateStatusDisabled: "Disabled"`, `tier100K: "100,000 conversations / 24h"`
- `deleteConfirmMessage` implemented as `(displayName: string) => \`Are you sure you want to delete "${displayName}"? This action cannot be undone.\``

### 3. `shared/locale/ar/whatsapp/index.ts`
- Implemented all new keys with Arabic translations (RTL-friendly)
- Added missing `templateStatusPendingDeletion: "في انتظار الحذف"`, `templateStatusDisabled: "معطّل"`, `tier100K: "100,000 محادثة / 24 ساعة"`
- `deleteConfirmMessage` uses Arabic interpolation: `(displayName: string) => \`هل أنت متأكد من حذف "${displayName}"؟ لا يمكن التراجع عن هذا الإجراء.\``

## Files Created (3)

### 4. `frontend/common/views/dashboard/settings/whatsapp/whatsappQualityLabel.ts`
- Exports `getQualityLabelKey(quality: string): string`
- Maps `WhatsappQualityRating` enum values to i18n keys via a `Record<string, string>` lookup
- Handles: GREEN → `qualityGreen`, YELLOW → `qualityYellow`, RED → `qualityRed`, UNKNOWN → `qualityUnknown`, default → `qualityUnknown`
- Uses record-based lookup (not switch) to avoid `no-unsafe-enum-comparison` oxlint warning
- Imports from `@/shared/constants/whatsapp-templates.enum` (canonical source, not `@/backend/enum`)

### 5. `frontend/common/views/dashboard/settings/whatsapp/whatsappTierLabel.ts`
- Exports `getTierLabelKey(tier: string): string`
- Maps `WhatsappLimitTier` enum values to i18n keys via a `Record<string, string>` lookup
- Handles: TIER_50 → `tier50`, TIER_250 → `tier250`, TIER_1K → `tier1K`, TIER_10K → `tier10K`, TIER_100K → `tier100K`, TIER_UNLIMITED → `tierUnlimited`, UNTIERED/TIER_NOT_SET → `tierUnknown`, default → `tierUnknown`
- Uses record-based lookup (not switch) to avoid `no-unsafe-enum-comparison` oxlint warning

### 6. `frontend/common/views/dashboard/settings/whatsapp/whatsappTemplateStatusLabels.ts`
- Exports `getTemplateStatusLabelKey(status: string): string`
- Maps `WhatsappTemplateStatus` enum values to i18n keys via a `Record<string, string>` lookup
- Handles: APPROVED → `templateStatusApproved`, PENDING → `templateStatusPending`, REJECTED → `templateStatusRejected`, PAUSED → `templateStatusPaused`, PENDING_DELETION → `templateStatusPendingDeletion`, DISABLED → `templateStatusDisabled`, default → `templateStatusPending`
- Uses record-based lookup (not switch) to avoid `no-unsafe-enum-comparison` oxlint warning

## Files NOT Modified

- **`backend/enum/whatsapp/whatsapp.enum.ts`** — This is a re-export shim; canonical definitions live in `shared/constants/whatsapp-templates.enum.ts`. No changes needed.
- **`shared/constants/whatsapp-templates.enum.ts`** — Enum definitions are correct; no new enum values needed (all required values already exist).
- **`frontend/common/views/dashboard/settings/whatsapp/tabs/shared/statusChipColor.ts`** — Existing file uses switch on raw enum values (same enum for switch parameter and case labels, so no oxlint issue). Not in scope for this task.

## Key Differences From Task Description

The task description referenced enum values `TIER_250K`, `TIER_1M`, and `ORANGE` (for `WhatsappLimitTier` and `WhatsappQualityRating` respectively). These enum values **do not exist** in the actual codebase:

- `WhatsappLimitTier`: `UNTIERED`, `TIER_50`, `TIER_250`, `TIER_1K`, `TIER_10K`, `TIER_100K`, `TIER_UNLIMITED`, `TIER_NOT_SET` — NO `TIER_250K` or `TIER_1M`
- `WhatsappQualityRating`: `GREEN`, `YELLOW`, `RED`, `UNKNOWN` — NO `ORANGE`
- The research file (research-i18n-translation.md) incorrectly listed `tier250K`, `tier1M`, and `qualityOrange` as missing keys. These keys have no corresponding enum values, so they were **not added**.

Additionally, the task description used `tierTierUnknown` and `tierUnknown` interchangeably. The actual existing key in the locale schema is `tierUnknown` (not `tierTierUnknown`). The existing `tierUnknown` key is used for unknown/unset tiers.

The task description also referenced `syncTemplates` and `addAccount` as "new" keys, but these already existed in the type schema and both EN/AR implementations. They were not re-added.

## Verification Results

| File | Sub-loop Result |
|------|----------------|
| `shared/locale/types/whatsapp/index.ts` | tsgo ✅ oxlint ✅ biome ✅ lint ✅ duplicates ✅ codescene ✅ |
| `shared/locale/en/whatsapp/index.ts` | tsgo ✅ oxlint ✅ biome ✅ lint ✅ duplicates ✅ codescene ✅ |
| `shared/locale/ar/whatsapp/index.ts` | tsgo ✅ oxlint ✅ biome ✅ lint ✅ duplicates ✅ codescene ✅ |
| `whatsappQualityLabel.ts` | tsgo ✅ oxlint ✅ biome ✅ lint ✅ duplicates ✅ codescene ✅ |
| `whatsappTierLabel.ts` | tsgo ✅ oxlint ✅ biome ✅ lint ✅ duplicates ✅ codescene ✅ |
| `whatsappTemplateStatusLabels.ts` | tsgo ✅ oxlint ✅ biome ✅ lint ✅ duplicates ✅ codescene ✅ |

### Global Checks
- `bun tsgo` — exit 0 ✅
- `bun biome:check` — exit 0 ✅ (5344 files, no fixes applied)
- `bun run lint` — exit 0 ✅

## Semantic Review Checklist
- [x] No cross-layer imports (shared importing from frontend/backend) — shared locale files don't import from any layer above
- [x] All enum imports are value imports (not `import type`) — all helpers use `import { Enum } from "@/shared/constants/..."` and use the values at runtime in Record keys
- [x] No dead branches — all record entries map to valid enum values; defaults handle unknown/null cases
- [x] Only files listed in task scope were modified

## Cross-File Dependencies Discovered

1. **Enum canonical source**: Enums live in `shared/constants/whatsapp-templates.enum.ts`, re-exported by `backend/enum/whatsapp/whatsapp.enum.ts`. Frontend label helpers must import from `@/shared/constants/whatsapp-templates.enum` (per shared/AGENTS.md: "Never import `@/backend/enum` from `shared/`"; per backend/enum/AGENTS.md: "Frontend code must use GraphQL codegen enums"). The existing `statusChipColor.ts` already follows this pattern.

2. **Existing `statusChipColor.ts`**: Already handles APPROVED/PENDING/REJECTED template statuses. The new `whatsappTemplateStatusLabels.ts` is a superset that also handles PAUSED, PENDING_DELETION, and DISABLED. Future task may want to consolidate or have `statusChipColor` delegate to the new labels helper.

3. **`WhatsappLimitTier.UNTIERED` and `TIER_NOT_SET`**: Both map to `tierUnknown`. If a "not set" distinction is needed later, a new i18n key should be added.

## Carry-Forward Knowledge for Future Subtasks

1. **Label helper pattern**: Use `Record<string, string>` lookup tables keyed by enum values — avoids `no-unsafe-enum-comparison` oxlint warnings that would occur with switch statements comparing enum values against a `string` parameter.

2. **Enum import path**: Always use `@/shared/constants/whatsapp-templates.enum` for the four WhatsApp enums (`WhatsappLimitTier`, `WhatsappQualityRating`, `WhatsappTemplateStatus`, `WhatsappTemplateCategory`) in frontend code.

3. **Existing key names**: `tierUnknown` (not `tierTierUnknown`), `qualityUnknown`, `templateStatusPaused` etc. — any consumer code should reference the actual keys defined in `WhatsappLabels`.

4. **i18n conventions**: Locale files export `whatsappEn`/`whatsappAr` const objects (not named exports). Type schema uses `readonly` on all properties. Function-type keys use arrow functions in both type definition and implementation.

5. **New keys ready for consumption**: The form labels (`createAccountTitle`, `editNameTitle`, field labels/helpers), validation messages, and delete confirm with interpolation (`deleteConfirmMessage`) are ready for Task 2 (ViewModel changes) and Task 3 (form UI) to consume.
