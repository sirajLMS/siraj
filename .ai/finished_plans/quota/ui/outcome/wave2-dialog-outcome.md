# Wave 2 — Task Group 9: Recurring Class Dialog — Quota Autocomplete

## Summary

Replaced the free-text `quotaId` TextField in the recurring class dialog with an MUI Autocomplete component (`QuotaAutocomplete`) that fetches open quotas for the selected student via `studentOpenQuotasQueryDocument`. Changed the `schedulingMode` field from a `Select` dropdown to a `RadioGroup` with three options (NumberOfClasses / OnDemand / Quota). Added conditional rendering so quota and on-demand-specific fields only appear when their mode is active. Added an empty state with a "Create Quota" CTA linking to `/quotas/new`.

The implementation follows the existing slot-based scaffold pattern: the shared dialog (`CreateRecurringClassDialogShared.tsx`) receives a `QuotaAutocomplete` slot from both desktop and mobile tier dialog files, which import the reusable `QuotaAutocomplete` component from `@/frontend/common/components/ui/input/quotaSelect`.

## Files Created

| File | Purpose |
|------|---------|
| `frontend/common/components/ui/input/quotaSelect/QuotaAutocomplete.tsx` | Reusable MUI Autocomplete component using `useQuery(studentOpenQuotasQueryDocument)` with empty state CTA, `readOnly` input, and option label formatting (name + remaining + validUntil). Accepts `QuotaAutocompleteSlotProps` with `studentId`, `value`, `onChange`, `disabled`, and i18n label functions. |
| `frontend/common/components/ui/input/quotaSelect/index.ts` | Barrel file exporting `QuotaAutocomplete` |

## Files Modified

| File | Changes |
|------|---------|
| `frontend/common/components/ui/dialog/CreateRecurringClassDialogShared.tsx` | Replaced `SchedulingFields` function: changed `schedulingMode` from `Select` + `MenuItem` to `RadioGroup` + `Radio` + `FormControlLabel`; replaced `quotaId` `TextField` with `QuotaAutocomplete` slot component; added conditional rendering — `isQuotaMode` shows quota autocomplete, `isOnDemandMode` shows on-demand outcome select, `showCommonFields` (quota OR on-demand) shows earmarked/generation fields, NumberOfClasses mode shows no extra fields; threaded `QuotaAutocomplete` slot through `DialogFormContent` props and main shared component destructuring |
| `frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types.ts` | Added `QuotaAutocompleteOption` interface (id, name, remaining, validUntil), `QuotaAutocompleteSlotProps` interface (studentId, value, onChange, disabled, label, placeholder, noOptionsText, noOptionsCta, optionLabel), `QuotaAutocompleteSlot` type; added `QuotaAutocomplete` field to `CreateRecurringClassDialogSlotProps` |
| `frontend/desktop/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.desktop.tsx` | Imported `QuotaAutocomplete` from `@/frontend/common/components/ui/input/quotaSelect`; added `QuotaAutocomplete` to the `slots` object with i18n labels from `t("scheduling")` |
| `frontend/mobile/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.mobile.tsx` | Same as desktop — imported `QuotaAutocomplete`, added to `slots` object |
| `frontend/common/components/ui/input/index.ts` | Added `export * from "./quotaSelect"` |
| `shared/locale/types/dashboard/teachers/createRecurringClass.ts` | Added `quotaSelect`, `quotaPlaceholder`, `noOpenQuotas`, `noOpenQuotasCta`, `quotaOptionLabel(name: string, remaining: number, validUntil: string) => string` to the `scheduling` section of `TeacherCreateRecurringClassLabels` type |
| `shared/locale/en/dashboard/teachers/createRecurringClass.ts` | English translations for new i18n keys |
| `shared/locale/ar/dashboard/teachers/createRecurringClass.ts` | Arabic translations for new i18n keys |
| `.ai/plans/quota/ui/tasks.md` | Updated task 9.1, 9.1.QL, 9.1.IV from `[ ]` to `[x]` |

## Files Deleted

None.

## Verification Results

All 10 files passed `sub-loop.ts --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene):

```
✅ QuotaAutocomplete.tsx — All checks for lifecycle "codescene" passed
✅ createRecurringClassDialogShared.types.ts — All checks for lifecycle "codescene" passed
✅ CreateRecurringClassDialogShared.tsx — All checks for lifecycle "codescene" passed
✅ shared/locale/types/dashboard/teachers/createRecurringClass.ts — All checks for lifecycle "codescene" passed
✅ shared/locale/en/dashboard/teachers/createRecurringClass.ts — All checks for lifecycle "codescene" passed
✅ shared/locale/ar/dashboard/teachers/createRecurringClass.ts — All checks for lifecycle "codescene" passed
✅ quotaSelect/index.ts — All checks for lifecycle "codescene" passed
✅ input/index.ts — All checks for lifecycle "codescene" passed
✅ createRecurringClassDialog.desktop.tsx — All checks for lifecycle "codescene" passed
✅ createRecurringClassDialog.mobile.tsx — All checks for lifecycle "codescene" passed
```

## Carry-Forward Knowledge

### Slot Pattern for Quota Autocomplete

The recurring class dialog uses a **slot-based scaffold** (`CreateRecurringClassDialogShared.tsx`) that receives slot components from desktop/mobile tier files. The `QuotaAutocomplete` follows the same pattern as `StudentSelect` and `TimezoneSelect` — it's a reusable UI component injected as a slot. However, unlike `StudentSelect` which receives its options as props, `QuotaAutocomplete` self-fetches via `useQuery(studentOpenQuotasQueryDocument)` because it needs to reactively query based on the selected student's `studentId`.

**When to self-fetch in a slot component:** A slot component may self-fetch when its data depends on form state that changes at runtime (e.g., `studentId` changes → refetch quotas). This is acceptable because the component is a reusable UI primitive (like `TimezoneSelect` which also encapsulates its own logic), not a tier view file.

### DeepPartialObject Handling for Apollo Query Results

Apollo's generated query types use `DeepPartialObject<T>` which makes all fields `T | null | undefined`. When mapping query results to option objects, always null-check with `?.` and provide defaults:

```ts
.map(quota => {
  if (!quota?.id) return null;
  return {
    id: quota.id,
    name: quota.name ?? "",
    remaining: quota.remaining ?? 0,
    validUntil: quota.validUntil ?? "",
  } satisfies QuotaAutocompleteOption;
})
.filter((opt): opt is QuotaAutocompleteOption => opt !== null);
```

Using `satisfies QuotaAutocompleteOption` (not `as`) avoids the oxlint `no-unsafe-type-assertion` rule.

### MUI Autocomplete with Read-Only Input

The Autocomplete input is set to `readOnly` to prevent free-text entry — users must select from the dropdown. In MUI v9, this is done via `slotProps.htmlInput`:

```tsx
slotProps={{
  ...params.slotProps,
  htmlInput: {
    ...params.slotProps?.htmlInput,
    readOnly: true,
  },
}}
```

### RadioGroup for Scheduling Mode

Using `RadioGroup` + `FormControlLabel` + `Radio` instead of `Select` + `MenuItem` for the scheduling mode provides better visibility of all options at once (3 modes: NumberOfClasses / OnDemand / Quota). The `Radio` import comes from `@mui/material/Radio`, `RadioGroup` from `@mui/material/RadioGroup`, and `FormControlLabel` from `@mui/material/FormControlLabel`.

### Conditional Rendering Based on Scheduling Mode

```ts
const isQuotaMode = schedulingMode === SchedulingMode.Quota;
const isOnDemandMode = schedulingMode === SchedulingMode.OnDemand;
const showCommonFields = isQuotaMode || isOnDemandMode;
```

- `isQuotaMode` → show `QuotaAutocomplete` slot
- `isOnDemandMode` → show on-demand outcome `Select`
- `showCommonFields` → show earmarked classes + generation horizon fields
- Default (NumberOfClasses) → no extra scheduling fields

### i18n Option Label Function

The `quotaOptionLabel` i18n key is typed as a function `(name: string, remaining: number, validUntil: string) => string`. This allows each locale to compose the label differently. The `validUntil` is pre-formatted via `formatValidUntil()` before being passed to the label function.

## Semantic Review Checklist

- [x] No dead branches
- [x] No cross-layer imports (shared layer never imports frontend/backend; `QuotaAutocomplete` is in common/components which is valid)
- [x] All i18n strings typed (type + en + ar for all new keys)
- [x] `git diff --name-only` matches expected file list (10 files modified/created)
