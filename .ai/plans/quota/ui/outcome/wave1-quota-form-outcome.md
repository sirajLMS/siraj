# Wave 1 — Task Group 4: Billing Quota Form — Tier Isolation + Validation

## Summary

Refactored the billing quota form from a monolithic inline-rendering container into a proper desktop/mobile tier-isolated pattern. The container (`QuotaFormContainer`) was transformed from 161 lines of inline Card/TextField/Select rendering into a thin switcher using `createLazyView` + `ResponsiveViewSwitch`. The ViewModel (`useQuotaFormViewModel`) was rewritten from plain Zustand controlled state to React Hook Form (RHF) + zodResolver, with Apollo cache update functions for create/update mutations and snackbar-based success/error feedback.

## Files Created

| File | Purpose |
|------|---------|
| `frontend/desktop/views/dashboard/billing/quota/quotaForm.desktop.tsx` | Desktop tier view — `DesktopPageContainer` + `DesktopPageHeader` (breadcrumbs: Quotas > New/Edit) + `FormProvider` + `QuotaFormSectionDesktop` + `DesktopPrimaryPageAction` (SyncOutlined spinner) + `FormSuccessSnackbar` + `DesktopFormErrorSnackbar` |
| `frontend/desktop/views/dashboard/billing/quota/components/QuotaFormSectionDesktop.tsx` | Desktop form sections — 3 sections (StudentInfo, QuotaConfig, ValidityDates) using RHF `Controller`, `DesktopSectionPanel`, `StudentAutocomplete`, `DesktopAppDatePicker`, conditional `periodDays` when `periodType === CUSTOM` |
| `frontend/mobile/views/dashboard/billing/quota/quotaForm.mobile.tsx` | Mobile tier view — `MobilePageContainer` + `MobilePageHeader` + `FormProvider` + `QuotaFormSectionMobile` + `MobilePrimaryPageAction` + `FormSuccessSnackbar` + `MobileFormErrorSnackbar` |
| `frontend/mobile/views/dashboard/billing/quota/components/QuotaFormSectionMobile.tsx` | Mobile form sections — same fields as desktop, using `MobileAppDatePicker`, stacked single-column layout |

## Files Modified

| File | Changes |
|------|---------|
| `frontend/common/views/dashboard/billing/quota/QuotaFormContainer.tsx` | Complete rewrite: replaced 161 lines of inline Card/TextField/Select rendering with thin switcher using `createLazyView<UseQuotaFormViewModel>` + `ResponsiveViewSwitch`; lazy imports from desktop/mobile tier views |
| `frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts` | Complete rewrite: replaced Zustand controlled state with `useForm<QuotaFormInput, undefined, QuotaFormData>` + `zodResolver(createQuotaSchema(labels))`; added `cache.updateQuery` for create mutation, `cache.modify` for update mutation; added `showSuccess`/`submitError` state with 3s auto-dismiss; exports `UseQuotaFormViewModel` interface |
| `.ai/plans/quota/ui/tasks.md` | Updated tasks 4.1, 4.2, 4.3, 4.4 and all sub-tasks from `[ ]` to `[x]` |

## Files Deleted

None.

## Verification Results

All 6 files passed `sub-loop.ts --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene):

```
✅ useQuotaFormViewModel.ts — All checks for lifecycle "codescene" passed
✅ QuotaFormContainer.tsx — All checks for lifecycle "codescene" passed
✅ quotaForm.desktop.tsx — All checks for lifecycle "codescene" passed
✅ QuotaFormSectionDesktop.tsx — All checks for lifecycle "codescene" passed
✅ quotaForm.mobile.tsx — All checks for lifecycle "codescene" passed
✅ QuotaFormSectionMobile.tsx — All checks for lifecycle "codescene" passed
```

## Carry-Forward Knowledge

### RHF + Zod with `z.coerce.number()` — 3-Generic Pattern

When using Zod schemas with `z.coerce.number()`, the input type (`QuotaFormInput`) differs from the output type (`QuotaFormData`) because coerce makes numeric fields `unknown` on input. The correct `useForm` invocation is:

```ts
const form = useForm<QuotaFormInput, undefined, QuotaFormData>({
  resolver: zodResolver(schema),
  defaultValues,
});
```

This gives `UseFormReturn<QuotaFormInput, undefined, QuotaFormData>` where:
- `TFieldValues` = `QuotaFormInput` (input — what the fields receive)
- `TTransformedValues` = `QuotaFormData` (output — what `handleSubmit` receives after Zod parsing)

Consequently, all exported types in the ViewModel interface must use the 3-generic RHF types:
- `UseFormReturn<QuotaFormInput, undefined, QuotaFormData>`
- `Control<QuotaFormInput, undefined, QuotaFormData>`
- `FieldErrors<QuotaFormInput>`
- `UseFormHandleSubmit<QuotaFormInput, QuotaFormData>`

Form section components that receive `control` and `errors` props must also use these 3-generic types.

### Type Guards for Enum Selects

When using MUI `Select` with RHF `Controller`, `e.target.value` is typed as `string`. Don't use `as EnumType` — oxlint's `no-unsafe-type-assertion` will flag it. Instead, use type guards:

```ts
function isQuotaKind(value: string): value is QuotaKind {
  return (Object.values(QuotaKind) as readonly string[]).includes(value);
}
```

The `(Object.values(Enum) as readonly string[])` cast is a widening cast (safe, not flagged by oxlint).

### Backend vs Frontend GraphQL Input Types

`formStateToSubmitInput()` from `quotaForm.types.ts` returns the **backend** `QuotaSubmitInput` (from `@/backend/types`), but Apollo mutations expect the **frontend GraphQL** `QuotaSubmitInput` (from `@/frontend/common/graphql/generated/gql/graphql-types`). These are structurally different types:
- Backend uses `T | null | undefined`
- Frontend GraphQL uses `InputMaybe<T>` = `T | null`

Build GraphQL mutation inputs inline (like the old `buildCreateQuotaInput` function), using `?? null` to convert `undefined` to `null`:

```ts
function buildCreateInput(data: QuotaFormData): QuotaSubmitInput {
  return {
    studentId: data.studentId,
    kind: data.kind,
    name: data.name,
    totalClasses: data.totalClasses,
    validFrom: data.validFrom ?? null,
    validUntil: data.validUntil ?? null,
    periodType: data.periodType ?? null,
    periodDays: data.periodDays ?? null,
    priority: data.priority,
    idempotencyKey: null,
    rolloverPolicy: null,
  };
}
```

### Cache Updates — Use `cache.updateQuery` Instead of `cache.modify` for Paginated Lists

`cache.modify` with a `Modifier` callback has complex type constraints with Apollo's `AsStoreObject` types. For paginated list fields (like `quotas` with `rows` and `totalCount`), use `cache.updateQuery` instead:

```ts
cache.updateQuery({ query: quotasQueryDocument }, cached => {
  if (!cached?.quotas?.rows) return cached;
  return {
    ...cached,
    quotas: {
      ...cached.quotas,
      rows: [...cached.quotas.rows, created],
      totalCount: (cached.quotas.totalCount ?? 0) + 1,
    },
  };
});
```

This pattern avoids `no-non-null-assertion` and `Modifier` type issues.

### ViewModel Props Pattern for Tier Views

Tier views (`.desktop.tsx`/`.mobile.tsx`) receive the entire ViewModel as props via `ResponsiveViewSwitch` spread:

```tsx
// Container
<ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={vm} />

// Tier view
export function QuotaFormDesktopView(props: Readonly<UseQuotaFormViewModel>) {
  const { form, labels, ... } = props;
  ...
}
```

The `createLazyView<T>` type parameter must match the ViewModel interface, not a `{ vm: ViewModel }` wrapper.

### QuotaUpdateInput Fields

The frontend GraphQL `QuotaUpdateInput` has only: `name`, `priority`, `status`, `validUntil` (all `InputMaybe`). It does NOT have `validFrom`, `kind`, `totalClasses`, `studentId`, `periodType`, or `periodDays`. The `status` field must be passed from the existing quota data.

## Cross-File Dependencies Discovered

1. **`quotaSchema.ts`** (created in Wave 0) — Uses `z.coerce.number()` for `totalClasses`, `periodDays`, `priority`, which creates the input/output type split. No changes needed, but consumers must use the 3-generic `useForm` pattern.

2. **`quotaForm.types.ts`** (created in Wave 0) — `formStateToSubmitInput()` returns backend `QuotaSubmitInput`, not frontend GraphQL type. ViewModel builds inputs inline instead of using this helper.

3. **`quota.documents.ts`** — `quotasQueryDocument` needed for `cache.updateQuery` in the create mutation cache update.

4. **`quotaStore.ts`** — No longer used by the form ViewModel (RHF replaces Zustand state). Store still exists for other consumers but is no longer imported by `useQuotaFormViewModel.ts`.

5. **`StudentAutocomplete`** component — Used in both desktop and mobile form sections for permission-based student selection (replaces free-text `studentId` input).

6. **`DesktopAppDatePicker` / `MobileAppDatePicker`** — Used for `validFrom`/`validUntil` date fields. Desktop uses `slotProps.textField` for error/helperText; mobile uses direct `error`/`helperText` props.
