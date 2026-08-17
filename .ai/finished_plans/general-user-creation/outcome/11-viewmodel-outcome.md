# Task 11 Outcome: ViewModel Hook — useGeneralUserCreateViewModel

## Date: 2026-08-14

## Summary

Created `useGeneralUserCreateViewModel` — a React hook serving as the ViewModel for the general user creation form. It wires together form state (via `react-hook-form` + Zod validation), the `useCreateGeneralUser` mutation hook (Task 9), i18n translations (Task 6), form-to-input mapping, and post-success navigation to `/users`. The hook follows the established ViewModel pattern from `useTeacherOnboardingViewModel`.

Additionally, modified the Zod schema (Task 8) to remove `.default(AccountStatus.Activated)` from the `status` field, replacing it with a plain `z.enum(AccountStatus)`. The default value is now set in the ViewModel's `DEFAULT_FORM_VALUES` constant. This resolves a `react-hook-form` / `zodResolver` type incompatibility where Zod's `.default()` creates different input vs output types, causing the resolver generic to mismatch `useForm`'s `TFieldValues` generic.

## Files Created

| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel.ts` | ViewModel hook — form state, validation, mutation, i18n, navigation |

## Files Modified

| File | Change |
|------|--------|
| `frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema.ts` | Changed `status: z.enum(AccountStatus).default(AccountStatus.Activated)` → `status: z.enum(AccountStatus)` (removed `.default()` to fix `zodResolver` type incompatibility — default now in ViewModel `DEFAULT_FORM_VALUES`) |

## Exact Export Name

```typescript
useGeneralUserCreateViewModel
```

**Import path**: `@/frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel`

## Return Shape

```typescript
export interface UseGeneralUserCreateViewModel {
  readonly form: UseFormReturn<GeneralUserCreateFormData>;
  readonly register: UseFormRegister<GeneralUserCreateFormData>;
  readonly control: Control<GeneralUserCreateFormData>;
  readonly errors: FieldErrors<GeneralUserCreateFormData>;
  readonly handleSubmit: UseFormHandleSubmit<GeneralUserCreateFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly submitError: string | null;
  readonly labels: CreateUserLabels;
  readonly onSubmit: (data: GeneralUserCreateFormData) => Promise<void>;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}
```

| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| `form` | `UseFormReturn<GeneralUserCreateFormData>` | `useForm()` | Full form instance (for advanced use) |
| `register` | `UseFormRegister` | `form.register` | Register form fields in tier views |
| `control` | `Control` | `form.control` | For `Controller` components (e.g., Select, Autocomplete) |
| `errors` | `FieldErrors` | `form.formState.errors` | Per-field validation errors for inline display |
| `handleSubmit` | `UseFormHandleSubmit` | `form.handleSubmit` | Wrap `onSubmit` in form submit handler |
| `isSubmitting` | `boolean` | `loading \|\| isSubmitting` | Loading state (Apollo + `useOnboardingSubmit`) |
| `showSuccess` | `boolean` | `useOnboardingSubmit` | Success snackbar visibility |
| `submitError` | `string \| null` | `useOnboardingSubmit` | Error message for display |
| `labels` | `CreateUserLabels` | `useAppTranslation` | All 23+ i18n labels + nested `sections` |
| `onSubmit` | `(data) => Promise<void>` | `useOnboardingSubmit` | Form submit handler (validates → maps → executes → navigates) |
| `onDismissSuccess` | `() => void` | `useOnboardingSubmit` | Close success snackbar |
| `onDismissError` | `() => void` | `useOnboardingSubmit` | Close error snackbar |

## How Translations, Schema, and Mutation Are Wired Together

### 1. Translations (i18n)

```typescript
import { Translation, useAppTranslation } from "@/shared/locale";
import type { CreateUserLabels } from "@/shared/locale/types/dashboard/users/createUser";

const labels = useAppTranslation(Translation.Dashboard.UsersCreateUser);
```

- Uses the `Translation` enum (NOT string literal) for the namespace, matching the pattern from `useTeacherOnboardingViewModel`
- `useAppTranslation` is from `@/shared/locale` (re-exported from `@/shared/locale/client`)
- Returns `CreateUserLabels` — the full 23+ property label object + nested `sections.userDetails` / `sections.permissions`
- `CreateUserLabels` is imported directly from `@/shared/locale/types/dashboard/users/createUser` (not re-exported from `@/shared/locale` barrel — the `types/index.ts` main barrel does not include `./dashboard/users`)

### 2. Form (react-hook-form + Zod)

```typescript
const schema = generalUserCreateSchemaFactory(labels);

const form = useForm<GeneralUserCreateFormData>({
  resolver: zodResolver(schema),
  defaultValues: DEFAULT_FORM_VALUES,
});
```

- **Schema factory**: `generalUserCreateSchemaFactory(labels)` — passes the full `CreateUserLabels` object; TypeScript accepts it because `CreateUserLabels` is structurally compatible with `GeneralUserCreateValidationLabels` (supertype of the `Pick<>` slice)
- **Resolver**: `zodResolver(schema)` from `@hookform/resolvers/zod`
- **Default values**: Module-level `DEFAULT_FORM_VALUES` constant (extracted per `no-object-type-as-default-prop` oxlint rule):

```typescript
const DEFAULT_FORM_VALUES: GeneralUserCreateFormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  groupSlug: "",
  status: AccountStatus.Activated,
};
```

### 3. Mutation (useCreateGeneralUser)

```typescript
import { useCreateGeneralUser } from "@/frontend/common/hooks/useCreateGeneralUser";

const { execute, loading } = useCreateGeneralUser();
```

- Returns `{ execute, loading, error }` — we destructure `execute` and `loading`
- `execute` accepts `GeneralUserCreateInput` (codegen type), NOT `GeneralUserCreateFormData` (Zod type)
- The ViewModel bridges this gap via `buildCreateInput()`:

```typescript
function buildCreateInput(formData: GeneralUserCreateFormData): GeneralUserCreateInput {
  return {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    phone: formData.phone ?? null,
    groupSlug: formData.groupSlug,
    status: formData.status,
  };
}
```

- `phone: formData.phone ?? null` — Zod optional string (`string | undefined`) → GraphQL `InputMaybe<string>` (= `string | null`). Uses `??` (nullish coalescing) per ESLint `prefer-nullish-coalescing` rule.
- `status: formData.status` — both Zod and GraphQL use the same codegen `AccountStatus` enum (string values `'ACTIVATED'` / `'DEACTIVATED'`)

### 4. Submit Handler (useOnboardingSubmit)

```typescript
const { showSuccess, submitError, onSubmit, onDismissSuccess, onDismissError, isSubmitting } =
  useOnboardingSubmit<GeneralUserCreateFormData, void>({
    execute: formData => execute(buildCreateInput(formData)),
    onSuccess: () => {
      router.push(USERS_PATH);
      return undefined;
    },
    onError: error => (error instanceof Error ? error.message : "operationFailed"),
    successAutoDismissMs: SUCCESS_AUTO_DISMISS_MS,
  });
```

- **`TData = GeneralUserCreateFormData`**, **`TResult = void`** — the mutation hook returns `Promise<void>` (unlike `useCreateTeacherOnboarding` which returns `Promise<TeacherOnboarding>`)
- **`execute` wrapper**: `formData => execute(buildCreateInput(formData))` — adapts the form-data-taking `execute` expected by `useOnboardingSubmit` to the input-taking `execute` from `useCreateGeneralUser`
- **`onSuccess`**: Returns `undefined` (no href for `useOnboardingSubmit`'s internal `router.push`), but directly calls `router.push(USERS_PATH)` to navigate to the users list page. This is because `useOnboardingSubmit`'s `onSuccess` receives `void` (no result data), and we navigate to a fixed path.
- **`onError`**: Returns error message string for snackbar display
- **`successAutoDismissMs`**: 3000ms (matching teacher ViewModel)

### 5. Navigation

```typescript
import { useRouter } from "@/shared/i18n/navigation";

const router = useRouter();
// In onSuccess callback:
router.push(USERS_PATH); // "/users"
```

- Uses `useRouter` from `@/shared/i18n/navigation` (locale-aware router), matching the pattern across all ViewModels in the codebase
- Navigates to `/users` after successful creation

## Import Details

| Import | Path | Type | Rationale |
|--------|------|------|-----------|
| `zodResolver` | `@hookform/resolvers/zod` | value | Zod resolver for react-hook-form |
| `Control`, `FieldErrors`, `UseFormHandleSubmit`, `UseFormRegister`, `UseFormReturn`, `useForm` | `react-hook-form` | mixed (types + value) | Form management types + hook |
| `useOnboardingSubmit` | `@/frontend/common/components/onboarding/hooks/useOnboardingSubmit` | value | Shared submit hook (loading, success/error, auto-dismiss, navigation) |
| `AccountStatus` | `@/frontend/common/graphql/generated/gql/graphql-types` | **value** (NOT `import type`) | Used in `DEFAULT_FORM_VALUES` runtime expression |
| `GeneralUserCreateInput` | `@/frontend/common/graphql/generated/gql/graphql-types` | `import type` | Input type for `buildCreateInput` return annotation |
| `useCreateGeneralUser` | `@/frontend/common/hooks/useCreateGeneralUser` | value | Mutation hook (Task 9) |
| `GeneralUserCreateFormData`, `generalUserCreateSchemaFactory` | `@/frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema` | mixed (type + value) | Zod schema factory + inferred form type (Task 8) |
| `useRouter` | `@/shared/i18n/navigation` | value | Locale-aware router for navigation |
| `Translation`, `useAppTranslation` | `@/shared/locale` | value | Translation enum + client translation hook |
| `CreateUserLabels` | `@/shared/locale/types/dashboard/users/createUser` | `import type` | Labels type (not re-exported from `@/shared/locale` barrel) |

## Schema Modification Rationale

### Why `.default()` Was Removed from `status`

**Problem**: `z.enum(AccountStatus).default(AccountStatus.Activated)` creates a Zod schema where:
- **Input type**: `status?: AccountStatus | undefined` (can be omitted — default is applied)
- **Output type**: `status: AccountStatus` (always present after default applied)

`z.infer<>` returns the **output** type. `GeneralUserCreateFormData` was typed as the output type (`status: AccountStatus`). But `zodResolver(schema)` returns `Resolver<input, context, output>` where `input` differs from `output`. When `useForm<GeneralUserCreateFormData>` (output type) receives a resolver typed for the input type, TypeScript errors:

```
Type 'Resolver<{...status?: AccountStatus | undefined...}, any, {...status: AccountStatus...}>'
is not assignable to type 'Resolver<{...status: AccountStatus...}, any, {...status: AccountStatus...}>'
```

**Fix**: Removed `.default(AccountStatus.Activated)` from the schema. Now `status` is a required field in both input and output types — no mismatch. The default value `AccountStatus.Activated` is set in the ViewModel's `DEFAULT_FORM_VALUES` constant, which is passed to `useForm({ defaultValues })`. This means:
1. The form always has a `status` value (initialized to `ACTIVATED`)
2. The schema validates `status` is a valid `AccountStatus` enum value
3. The input and output types are identical — no `zodResolver` mismatch

This matches the teacher schema pattern (`teacherOnboardingSchema`) where no `.default()` is used and defaults are set in the ViewModel.

## Verification Results

### `useGeneralUserCreateViewModel.ts` — sub-loop.ts --lifecycle codescene (exit 0)

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

### `generalUserCreateSchema.ts` — sub-loop.ts --lifecycle codescene (exit 0)

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

## Semantic Review Checklist

- [x] `"use client"` directive at top (client component hook)
- [x] All imports use `@/` path aliases (no relative `./` or `../`)
- [x] `Translation` enum used for namespace (NOT string literal) — `Translation.Dashboard.UsersCreateUser`
- [x] `useAppTranslation` from `@/shared/locale` for client-side translations
- [x] `AccountStatus` imported as VALUE (used in `DEFAULT_FORM_VALUES`)
- [x] `GeneralUserCreateInput` imported as `import type` (only used in type annotation)
- [x] `useRouter` from `@/shared/i18n/navigation` (locale-aware router)
- [x] `zodResolver` from `@hookform/resolvers/zod`
- [x] `useOnboardingSubmit` used for shared submit logic (loading, success/error, auto-dismiss, navigation) — matches teacher ViewModel pattern
- [x] `buildCreateInput()` function at module scope (not nested in hook) — per `consistent-function-scoping` oxlint rule
- [x] `DEFAULT_FORM_VALUES` at module scope — per `no-object-type-as-default-prop` oxlint rule
- [x] `USERS_PATH` and `SUCCESS_AUTO_DISMISS_MS` constants at module scope
- [x] `phone: formData.phone ?? null` — uses nullish coalescing (not `||`) per ESLint `prefer-nullish-coalescing`
- [x] `isSubmitting: loading || isSubmitting` — combines Apollo loading + `useOnboardingSubmit` loading (matches teacher pattern)
- [x] ViewModel interface uses `readonly` on all fields (following project convention)
- [x] Returns flat plain object (no nested business logic)
- [x] No `useMediaQuery` / `useViewport` imports (viewport-agnostic)
- [x] No `console.*` usage
- [x] Follows the exact pattern from `useTeacherOnboardingViewModel` (closest existing ViewModel with form + mutation + useOnboardingSubmit)

## Differences from Teacher ViewModel

### What's the Same
- `useForm` + `zodResolver` pattern
- `useOnboardingSubmit` for submit orchestration
- `isSubmitting: loading || isSubmitting` dual loading state
- Module-level `DEFAULT_FORM_VALUES` constant
- Return shape: `{ form, register, control, errors, handleSubmit, isSubmitting, showSuccess, submitError, labels, onSubmit, onDismissSuccess, onDismissError }`

### What's Different (Intentionally)
- **Form-to-input mapping**: Teacher hook accepts `TeacherOnboardingFormData` directly (does mapping internally). General user hook accepts `GeneralUserCreateInput`, so the ViewModel wraps `execute` with `buildCreateInput()` via `formData => execute(buildCreateInput(formData))`.
- **`TResult = void`**: Teacher `useOnboardingSubmit<TeacherOnboardingFormData, TeacherOnboarding>` returns the created teacher. General user `useOnboardingSubmit<GeneralUserCreateFormData, void>` returns `void` — the mutation result is in the Zustand store (Task 10), not returned.
- **`onSuccess` return**: Teacher returns a profile href (navigates via `useOnboardingSubmit`'s internal `router.push`). General user returns `undefined` and navigates directly via `router.push(USERS_PATH)` — because there's no result data to build a dynamic href.
- **No meeting config / avatar**: Teacher ViewModel has meeting config warning, avatar upload, and meeting setup href. General user has none of these — simpler form.
- **No store subscriptions**: Teacher ViewModel subscribes to `useTeacherOnboardingStore` for `result` (to build `meetingSetupHref`). General user ViewModel doesn't subscribe to the store — the mutation hook handles store updates internally.

## Carry-Forward Knowledge for Task 12 (Shared Form)

### Import & Usage

```typescript
import {
  type UseGeneralUserCreateViewModel,
  useGeneralUserCreateViewModel,
} from "@/frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel";
```

### Using the ViewModel in a Container

```typescript
// In CreateGeneralUserContainer.tsx
export function CreateGeneralUserContainer() {
  const viewModel = useGeneralUserCreateViewModel();
  return <CreateGeneralUserView {...viewModel} />;
}
```

### Using the ViewModel in Shared/Desktop/Mobile Views

The Shared Form component (Task 12) receives `UseGeneralUserCreateViewModel` as props:

```typescript
// In the shared form component
interface CreateGeneralUserFormProps extends UseGeneralUserCreateViewModel {}

function CreateGeneralUserSharedForm(props: Readonly<CreateGeneralUserFormProps>) {
  const { form, register, control, errors, handleSubmit, onSubmit, labels, isSubmitting, showSuccess, submitError, onDismissSuccess, onDismissError } = props;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField {...register("name")} label={labels.name} error={!!errors.name} helperText={errors.name?.message} />
      <TextField {...register("email")} label={labels.email} error={!!errors.email} helperText={errors.email?.message} />
      <TextField {...register("password")} type="password" label={labels.password} error={!!errors.password} helperText={errors.password?.message} />
      <TextField {...register("phone")} label={labels.phone} />
      {/* groupSlug: use Controller with Autocomplete/Select for permission groups */}
      {/* status: use Controller with Select for AccountStatus enum */}
      <Button type="submit" disabled={isSubmitting}>{labels.createButton}</Button>
      {/* Snackbar for showSuccess/submitError */}
    </form>
  );
}
```

### Key Labels Available (from `labels: CreateUserLabels`)

All 23+ properties for rendering:
- Page/header: `pageTitle`, `formTitle`
- Field labels: `name`, `email`, `phone`, `password`, `permissionGroup`, `accountStatus`
- Status options: `statusActivated`, `statusDeactivated`
- Buttons: `createButton`, `cancelButton`
- Toasts: `createSuccess`, `createError`
- Validation: `nameRequired`, `emailRequired`, `emailInvalid`, `emailExists`, `passwordRequired`, `passwordWeak`, `permissionGroupRequired`
- Business: `specializedGroupNotAllowed`, `permissionGroupNotFound`
- Sections: `sections.userDetails`, `sections.permissions`

### Form Fields (from `GeneralUserCreateFormData`)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `name` | `string` | ✅ | `""` | min 2 chars |
| `email` | `string` | ✅ | `""` | valid email format |
| `password` | `string` | ✅ | `""` | min 8 chars |
| `phone` | `string \| undefined` | ❌ | `""` | optional |
| `groupSlug` | `string` | ✅ | `""` | permission group slug |
| `status` | `AccountStatus` | ✅ | `AccountStatus.Activated` | enum: Activated / Deactivated |

## Carry-Forward Knowledge for Task 14 (Container)

### Container Pattern

```typescript
// frontend/common/views/dashboard/users/createUser/CreateGeneralUserView.tsx
"use client";
import { createLazyView, ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { type UseGeneralUserCreateViewModel, useGeneralUserCreateViewModel } from "./useGeneralUserCreateViewModel";

const lazyViews = createLazyView<UseGeneralUserCreateViewModel>(
  () => import("@/frontend/mobile/views/dashboard/users/createUser/createGeneralUser.mobile").then(m => ({ default: m.CreateGeneralUserMobileView })),
  () => import("@/frontend/desktop/views/dashboard/users/createUser/createGeneralUser.desktop").then(m => ({ default: m.CreateGeneralUserDesktopView })),
);

export function CreateGeneralUserView() {
  const viewModel = useGeneralUserCreateViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
```

### Container Props

```typescript
export type UseGeneralUserCreateViewModelProps = Record<string, never>;
```

The container takes no props — all data is self-contained in the ViewModel hook.

## Cross-File Dependencies Discovered & Fixed

### Schema `.default()` Incompatibility (Fixed)

- **Problem**: `z.enum(AccountStatus).default(AccountStatus.Activated)` in the schema caused `zodResolver` type incompatibility with `useForm<GeneralUserCreateFormData>` — input/output types differ when `.default()` is used.
- **Fix**: Removed `.default()` from the schema. Default value moved to ViewModel's `DEFAULT_FORM_VALUES` constant.
- **Scope**: One line changed in `generalUserCreateSchema.ts` (`status` field). The schema's validation behavior is unchanged — `status` is still validated as a valid `AccountStatus` enum value. The only difference is that `status` is now required in the form (always provided via default values), rather than being optional with a schema-level default.

### `CreateUserLabels` Not in `@/shared/locale` Barrel (Worked Around)

- **Problem**: `CreateUserLabels` is not re-exported from the `@/shared/locale` main barrel. The `shared/locale/types/index.ts` barrel does not include `./dashboard/users` (it has `./dashboard/teachers` and others but not `users`).
- **Fix**: Imported `CreateUserLabels` directly from `@/shared/locale/types/dashboard/users/createUser` (the deep path), as recommended in Task 6's outcome file.
- **Scope**: No barrel modifications needed — the deep import path is the canonical pattern per Task 6 outcome.
