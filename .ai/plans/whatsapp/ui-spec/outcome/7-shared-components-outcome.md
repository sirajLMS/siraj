# Task 7 Outcome: Shared Component Adoption (Snackbars & StatusBadges)

## Summary

Created `whatsappStatusBadge.tsx` — a configuration module mapping WhatsApp template statuses (`WhatsappTemplateStatus`) and account active/inactive states to `StatusBadge` category+status keys. Replaced `NumbersSnackbar.tsx`'s internal `AppSnackbar` wrapper with `FormSuccessSnackbar` / `FormErrorSnackbar` (shared form snackbar components). Replaced inline `Chip` + `statusChipColor` usage in `NumberCard.tsx` (account active/inactive chip) and `TemplatesTabContent.tsx` (template status chip) with the shared `StatusBadge` component. Updated `statusChipColor.ts` to add `PAUSED`, `PENDING_DELETION`, `DISABLED` cases (kept for backward compatibility / fallback, though no source files currently import it after `TemplatesTabContent` migration). Per task spec, labels were NOT wired to i18n — `StatusBadge` renders raw enum values for template statuses; account active/inactive badge retains existing `t.isActive`/`t.isInactive` labels (already wired in prior tasks).

## Files Created (1)

### 1. `frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge.tsx`
- **Purpose**: Configuration module mapping WhatsApp statuses to `StatusBadge` props (category, status, label).
- **Exports**:
  - `WhatsappStatusBadgeConfig` interface — `{ category: StatusBadgeCategory; status: string; label: string }`
  - `WHATSAPP_TEMPLATE_STATUS_BADGE` — `Readonly<Record<WhatsappTemplateStatus, WhatsappStatusBadgeConfig>>` mapping all 6 template statuses (APPROVED, PENDING, REJECTED, PAUSED, PENDING_DELETION, DISABLED) to `syncStatus` category + semantic status keys (`success`, `running`, `failed`, `partial`, `unknown`)
  - `getWhatsappTemplateStatusBadgeConfig(status: string | null)` — lookup function with fallback for unknown/null statuses (returns grey `"unknown"` badge with raw status or `"—"` label)
  - `getWhatsappAccountStatusBadgeConfig(isActive: boolean | null)` — maps account `isActive` → `syncStatus` + `"success"` (green) or `"failed"` (red/grey)
- **Design decision**: Used existing `syncStatus` category (no new `StatusBadgeCategory` added) because it supports the full semantic range (success/running/partial/failed/unknown) that maps cleanly to template approval lifecycle stages. Avoided modifying `StatusBadgeCategory` union type or `resolveStatusPaletteKey` in shared infrastructure — zero cross-file changes to shared UI components.
- **Label handling**: `label` field is the raw enum value (e.g., `"APPROVED"`) for template statuses. Task 11 (Phase 3) will replace labels with i18n key lookups via `getTemplateStatusLabelKey(status)` or similar. Account badge label is `String(boolean)` in the config but overridden at call-site in `NumberCard.tsx` with existing `t.isActive`/`t.isInactive` labels.
- **Type guard pattern**: Used `isWhatsappTemplateStatus(value): value is WhatsappTemplateStatus` type guard (per oxlint `no-unsafe-type-assertion` rule) instead of `as` type assertion.
- **Nullable handling**: `getWhatsappAccountStatusBadgeConfig` accepts `boolean | null` (matches `WhatsappAccountRow.isActive` type which is nullable) and coalesces `null` → `false` → `"failed"` status.

## Files Modified (4)

### 2. `frontend/common/views/dashboard/settings/whatsapp/tabs/components/NumbersSnackbar.tsx`
- **Change**: Replaced `AppSnackbar` with `FormSuccessSnackbar` / `FormErrorSnackbar` based on `state.severity`.
- **Behavior**: When `state === null` → returns `null` (no snackbar). When `state.severity === "error"` → renders `FormErrorSnackbar` with `open`, `onClose`, `message`. Otherwise (severity `"success"`) → renders `FormSuccessSnackbar`.
- **Props unchanged**: Still accepts `{ state: WhatsappSnackbar; onClose: () => void }` — no consumer changes needed.
- **Import changes**: Removed `AppSnackbar` import; added direct imports from `FormErrorSnackbar.tsx` and `FormSuccessSnackbar.tsx` (no barrel exists in `form/snackbar/` directory).

### 3. `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCard.tsx`
- **Change**: Replaced inline `<Chip>` for account active/inactive status with `<StatusBadge>` component using `getWhatsappAccountStatusBadgeConfig`.
- **Implementation**: `<StatusBadge {...getWhatsappAccountStatusBadgeConfig(account.isActive)} label={account.isActive ? t.isActive : t.isInactive} />` — spreads category+status from config, overrides label with existing i18n string (already wired in prior tasks).
- **Informational chips preserved**: `qualityRating`, `messagingTier`, `throughputLevel`, `lastWebhookAt` chips remain as `<Chip>` components (these are label:value info chips, not status indicators).
- **`extraChips` prop preserved**: Desktop-only wabaId/phoneNumberId chips still injected via `extraChips` prop between the StatusBadge and qualityRating chip.

### 4. `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/TemplatesTabContent.tsx`
- **Change**: Replaced inline `<Chip>` + `statusChipColor` for template status with `<StatusBadge>` using `getWhatsappTemplateStatusBadgeConfig`.
- **Implementation**: `<StatusBadge {...getWhatsappTemplateStatusBadgeConfig(template.status)} />` — spreads category+status+label from config. The `label` is the raw enum value (e.g., `"APPROVED"`, `"PENDING"`) — not i18n-wired per task spec (Task 11 will handle this).
- **Import changes**: Removed `statusChipColor` import; added `StatusBadge` and `getWhatsappTemplateStatusBadgeConfig` imports.
- **Other chips preserved**: `templateLanguage` and `templateCategory` chips remain as `<Chip>` (info chips with label:value format).

### 5. `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/statusChipColor.ts`
- **Change**: Added `PAUSED`, `PENDING_DELETION`, `DISABLED` cases to the switch statement.
- **Purpose**: Completeness for all `WhatsappTemplateStatus` enum values. All three new cases return `"default"` (neutral grey) since there's no direct MUI Chip color equivalent for these states.
- **Deprecation note**: This function is no longer imported by any source file after the `TemplatesTabContent.tsx` migration to `StatusBadge`. It is kept for backward compatibility and potential use in other contexts. Task 11 or a future cleanup task may deprecate/remove it entirely if no consumers remain.
- **Return type unchanged**: Still `"success" | "warning" | "error" | "default"` — no new MUI Chip color values needed.

## Files NOT Modified (and why)

- **`frontend/common/components/ui/badge/StatusBadge.tsx`** — No changes needed. The existing `StatusBadge` component accepts arbitrary `category`, `status`, and `label` strings. Using the existing `syncStatus` category avoids modifying the shared component.
- **`frontend/common/components/ui/badge/types/statusBadgeShared.types.ts`** — No new `StatusBadgeCategory` added. Mapped WhatsApp statuses to existing `syncStatus` category which already handles the full range of semantic states (success/running/partial/failed/unknown → completed/pending/confirmed/blocked/pending palette keys).
- **`frontend/common/components/ui/badge/statusBadgeShared.utils.ts`** — `resolveStatusPaletteKey` already handles `syncStatus` category mappings. No changes needed.
- **`frontend/common/components/ui/form/snackbar/FormSuccessSnackbar.tsx` / `FormErrorSnackbar.tsx`** — Used as-is. Props are `{ open, message, onClose }` which maps directly to the `WhatsappSnackbar` `{ message, severity }` pattern.
- **`frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.tsx`** and **`frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.tsx`** — No changes needed. `NumbersSnackbar` component interface (`{ state, onClose }`) is unchanged. The internal implementation switched from `AppSnackbar` to `FormSuccess`/`FormError` snackbars transparently.
- **`frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView.tsx`** — No changes needed. The snackbar replacement is internal to `NumbersSnackbar.tsx`.
- **`frontend/common/views/dashboard/settings/whatsapp/WhatsappSettingsContainer.tsx`** — No changes needed. Container passes ViewModel to `WhatsappConfigView` which delegates to tier views; snackbar state flows through shared props unchanged.

## Verification Results

| Check | Result |
|-------|--------|
| tsgo (global) | ✅ 0 errors |
| biome:check (global) | ✅ 5351 files checked, no fixes applied |
| lint (global) | ✅ clean |
| sub-loop codescene — whatsappStatusBadge.tsx | ✅ all checks pass |
| sub-loop codescene — NumbersSnackbar.tsx | ✅ all checks pass |
| sub-loop codescene — NumberCard.tsx | ✅ all checks pass |
| sub-loop codescene — TemplatesTabContent.tsx | ✅ all checks pass |
| sub-loop codescene — statusChipColor.ts | ✅ all checks pass |

All quality checks pass for all 5 created/modified files.

## Carry-Forward Knowledge for Future Subtasks

1. **`whatsappStatusBadge.tsx` is the canonical status mapping**: Task 11 should replace the `label` field in `WHATSAPP_TEMPLATE_STATUS_BADGE` entries and in `getWhatsappTemplateStatusBadgeConfig`'s fallback with i18n label lookups. The `category` and `status` keys should remain unchanged — only labels need localization. For account status, `NumberCard.tsx` already overrides the label with `t.isActive`/`t.isInactive`, so no change needed there in Task 11.

2. **`syncStatus` category reused for WhatsApp**: No new `StatusBadgeCategory` was added. Template statuses map to `syncStatus` semantic keys: APPROVED→`success`, PENDING→`running`, REJECTED→`failed`, PAUSED→`partial`, PENDING_DELETION→`disabled`→`unknown`, DISABLED→`unknown`. If a future task needs a dedicated `whatsappTemplate` category for different palette semantics, add it to `StatusBadgeCategory` in `statusBadgeShared.types.ts` and add resolution logic in `resolveStatusPaletteKey` in `statusBadgeShared.utils.ts`.

3. **`statusChipColor.ts` is now dead code**: No source files import `statusChipColor` after the `TemplatesTabContent.tsx` migration. It's kept for backward compatibility but can be safely removed in a future cleanup task. All three new cases (PAUSED, PENDING_DELETION, DISABLED) return `"default"`.

4. **`NumbersSnackbar` transparently uses Form snackbars**: The component interface (`{ state: WhatsappSnackbar; onClose: () => void }`) is unchanged. If a future task wants to show both success and error snackbars simultaneously or add snackbar variants beyond success/error, the `WhatsappSnackbar` type's `severity` field only supports `"success" | "error"` — extending this requires updating the type in `whatsappSettingsTypes.ts`.

5. **`StatusBadge` label rendering**: Currently renders raw enum values (e.g., `"APPROVED"`, `"PENDING_DELETION"`) in uppercase. The `StatusBadgeShared` component applies `labelUppercase` Typography variant — labels will appear uppercase even if Task 11 provides mixed-case translations. Task 11 should account for this when choosing label text.

6. **No barrel file for `form/snackbar/`**: `FormSuccessSnackbar` and `FormErrorSnackbar` are imported directly from their source files. If more consumers need these components, consider creating an `index.ts` barrel in `frontend/common/components/ui/form/snackbar/`.

## Cross-File Dependencies Discovered

1. **`WhatsappAccountRow.isActive` is `boolean | null`**: The GraphQL fragment field is nullable. `getWhatsappAccountStatusBadgeConfig` accepts `boolean | null` and coalesces `null` → `false`. If a future task changes the field to be non-nullable, the config function signature can be tightened.

2. **`WhatsappTemplateRow.status` is `string | null`**: The `WhatsappTemplateSnapshotFieldsFragment` status field is nullable string. `getWhatsappTemplateStatusBadgeConfig` handles `null` with a fallback to `"—"`. The `StatusBadge` renders the raw string or `"—"` for null/unknown statuses.

3. **Task 11 (Phase 3) label wiring dependency**: The `label` fields in `whatsappStatusBadge.tsx` are intentionally raw enum values. Task 11 must update:
   - `WHATSAPP_TEMPLATE_STATUS_BADGE` record entries — replace `label: WhatsappTemplateStatus.XXX` with localized label
   - `getWhatsappTemplateStatusBadgeConfig` fallback — replace `label: status ?? "—"` with localized label
   - `getWhatsappAccountStatusBadgeConfig` — already overridden at call-site in `NumberCard.tsx`, but the config's `label: String(active)` should be updated to a localized default for direct use

4. **`FormSuccessSnackbar` uses `severityColor="primary"` (not "success")**: The shared `FormSnackbarShared` maps `severityColor` to either `"primary"` or `"error"`. Form success snackbars use `theme.palette.primary.main` (brand color), not `theme.palette.success.main` (green). This is a design choice in the shared component — not a bug.
