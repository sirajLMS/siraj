# Task 8 Outcome: Zod Schema Factory — generalUserCreateSchema

## Date: 2026-08-14

## Summary

Created a Zod validation schema factory `generalUserCreateSchemaFactory` for the general user creation form, following the existing `frontend/common/views/dashboard/` schema patterns (specifically matching the `teacherOnboardingSchema` and `complaintFormSchema` factory function + i18n labels pattern). The schema validates 6 form fields: `name`, `email`, `password`, `phone` (optional), `groupSlug`, and `status` (enum with default). All validation labels are passed as a typed parameter — no hardcoded validation strings.

## File Created

| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema.ts` | Zod validation schema factory for general user creation form |

## Exact Export Name

```typescript
generalUserCreateSchemaFactory
```

## Structure

The schema uses a factory function that accepts validation labels and returns a `ZodObject` (specifically `z.object({...})`). The export wraps arrow function form, matching the established `complaintFormSchema` pattern:

```typescript
export const generalUserCreateSchemaFactory = (
  validationLabels: GeneralUserCreateValidationLabels
) =>
  z.object({
    name: z.string().min(2, validationLabels.nameRequired),
    email: z
      .string()
      .min(1, validationLabels.emailRequired)
      .pipe(z.email({ message: validationLabels.emailInvalid })),
    password: z.string().min(8, validationLabels.passwordRequired),
    phone: z.string().optional(),
    groupSlug: z.string().min(1, validationLabels.permissionGroupRequired),
    status: z.enum(AccountStatus).default(AccountStatus.Activated),
  });

export type GeneralUserCreateFormData = z.infer<
  ReturnType<typeof generalUserCreateSchemaFactory>
>;
```

## Schema Fields & Validation Rules

| Field | Zod Rule | Required | Validation Label | Notes |
|-------|----------|----------|------------------|-------|
| `name` | `z.string().min(2, ...)` | ✅ | `nameRequired` | Minimum 2 characters |
| `email` | `z.string().min(1, ...).pipe(z.email({ message: ... }))` | ✅ | `emailRequired` (empty check) + `emailInvalid` (format check) | Two-stage validation: min length then email format (matches `complaintFormSchema.contactEmail` pattern) |
| `password` | `z.string().min(8, ...)` | ✅ | `passwordRequired` | Minimum 8 characters |
| `phone` | `z.string().optional()` | ❌ | N/A | Optional field |
| `groupSlug` | `z.string().min(1, ...)` | ✅ | `permissionGroupRequired` | Non-empty required |
| `status` | `z.enum(AccountStatus).default(AccountStatus.Activated)` | ❌ (defaulted) | N/A | Enum from GraphQL codegen, defaults to activated |

## Validation Labels Type

```typescript
export type GeneralUserCreateValidationLabels = Pick<
  CreateUserLabels,
  "nameRequired" | "emailRequired" | "emailInvalid" | "passwordRequired" | "permissionGroupRequired"
>;
```

- Source type: `CreateUserLabels` from `@/shared/locale/types/dashboard/users/createUser` (defined in Task 6 — 23 properties + nested `sections` object, all `readonly`)
- `Pick` projection selects only the validation-relevant fields — 5 of 25 — keeps the factory parameter focused
- Re-exported as `GeneralUserCreateValidationLabels` so the ViewModel (Task 11) can import the exact slice type without re-running the `Pick`

## Import Details

| Import | Path | Value/Type | Rationale |
|--------|------|------------|-----------|
| `z` | `zod` | value | Zod namespace for schema construction |
| `AccountStatus` | `@/frontend/common/graphql/generated/gql/graphql-types` | **value** (NOT `import type`) | Used in runtime expressions: `z.enum(AccountStatus)` and `.default(AccountStatus.Activated)` |
| `CreateUserLabels` | `@/shared/locale/types/dashboard/users/createUser` | `import type` | Only used in type position (`Pick<CreateUserLabels, ...>`) |

### Why GraphQL codegen `AccountStatus` (not backend enum)?

Following the established schema pattern in the codebase, frontend Zod schemas import enums from `@/frontend/common/graphql/generated/gql/graphql-types` (the GraphQL codegen output), NOT from `@/backend/enum`. The shared layer rule (`shared/AGENTS.md`) prohibits shared code from importing backend Enums; frontend code is permitted to use codegen enums for API-facing types. Existing examples:
- `studentOnboardingSchema.ts` uses `StudentStatus` from `graphql-types`
- `parentOnboardingSchema.ts` uses `CurrencyCode`/`InvoiceType` from `graphql-types`
- `managerOnboardingSchema.ts` uses `ManagerAccountType` from `graphql-types`

The codegen-generated `AccountStatus` enum uses string values `'ACTIVATED'` / `'DEACTIVATED'` matching the backend `AccountStatus.ACTIVATED` / `AccountStatus.DEACTIVATED` values — safe to spread to the mutation input.

### Why `z.enum()` (Zod v4) instead of `z.nativeEnum()`?

The task spec suggested `z.nativeEnum(AccountStatus)`, but the project uses Zod v4 (`zod@^4.4.3`), and the established pattern in this codebase is `z.enum(SomeEnum)` (Zod v4 accepts enums directly — no `nativeEnum` needed). Verified in:
- `complaintFormSchema.ts`: `z.enum(ComplaintCategory, { message: ... })`
- `teacherOnboardingSchema.ts`: `z.enum(CurrencyCode)`, `z.enum(Gender)`
- `studentOnboardingSchema.ts`: `z.enum(StudentStatus)`, `z.enum(Gender)`, `z.enum(AppLanguage)`

`z.enum(AccountStatus)` is the canonical Zod v4 pattern for enum-valued fields. Using `z.nativeEnum` would still work (Zod v4 aliases it), but `z.enum` matches the codebase convention.

### Why `.pipe(z.email({ message: ... }))` instead of `z.string().email(...)`?

Zod v4 removed `z.string().email()` — replaced with `z.email()` which returns a top-level `ZodEmail` schema. To enforce non-empty + email format together, we use the pipe pattern (matches `complaintFormSchema.ts`):
- `z.string().min(1, ...)` — first stage: rejects empty strings with `emailRequired`
- `.pipe(z.email({ message: ... }))` — second stage: validates format with `emailInvalid`

Using just `z.email({ message: emailInvalid })` would short-circuit on empty strings and surface the `emailInvalid` message, which is misleading. The pipe pattern surfaces the correct message per validation stage.

## Verification Results

`sub-loop.ts --lifecycle codescene` — all 6 checks passed on first run (exit code 0):

```
✅ tsgo passed (no errors for frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema.ts)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

No errors, no fixes required. No cross-file dependencies discovered — the schema only depends on:
1. Zod runtime (already installed)
2. GraphQL codegen `AccountStatus` enum (generated in Task 5's codegen run)
3. `CreateUserLabels` i18n type (created in Task 6)

## Semantic Review Checklist

- [x] `AccountStatus` imported as value (NOT `import type`) — used in `z.enum(AccountStatus)` and `.default(AccountStatus.Activated)` runtime expressions
- [x] All imports use `@/` path aliases (no `./` or `../` relative imports)
- [x] No hardcoded validation strings — all messages sourced from `validationLabels` parameter
- [x] `status` defaults to `AccountStatus.Activated` matching backend service default (from Task 3 outcome)
- [x] `password` min length of 8 matches `teacherOnboardingSchema` min length (security baseline)
- [x] `name` min length of 2 follows task spec (2 chars minimum for display name, distinguishing from onboarding schemas which use 1 for `fullName` or 3 for student `name`)
- [x] Email validation uses pipe pattern (`min(1)` → `z.email()`) — separates empty-vs-format in error messages, matches `complaintFormSchema`
- [x] Exported `GeneralUserCreateFormData` inferred type so the ViewModel can type form state without recomputing
- [x] Exported `GeneralUserCreateValidationLabels` so the ViewModel can import the exact slice as a single type
- [x] `z.enum` (Zod v4) used instead of `z.nativeEnum` — matches existing schema convention across the codebase
- [x] File placed under `frontend/common/views/dashboard/users/createUser/schemas/` per `frontend/common/views/AGENTS.md` directory layout

## Carry-Forward Knowledge for Task 11 (ViewModel)

### Exact Import Paths

```typescript
// Schema factory + inferred form type + labels type
import {
  generalUserCreateSchemaFactory,
  type GeneralUserCreateFormData,
  type GeneralUserCreateValidationLabels,
} from "@/frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema";
```

No barrel — there is no `index.ts` in `schemas/` or `createUser/`. Direct file import is the canonical pattern across the codebase (see `managerOnboardingSchema`, `teacherOnboardingSchema`, etc., all imported via deep path).

### Building the Schema in ViewModel

```typescript
// In useCreateGeneralUserViewModel.ts
const t = useAppTranslation("Dashboard.UsersCreateUser");
const schema = generalUserCreateSchemaFactory(t);
// NOTE: `t` (CreateUserLabels) is a superset of GeneralUserCreateValidationLabels
// because GeneralUserCreateValidationLabels = Pick<CreateUserLabels, ...>.
// TypeScript accepts the supertype thanks to structural typing.
```

### Form Default Values (matches schema defaults)

```typescript
const defaultFormValues: GeneralUserCreateFormData = {
  name: "",
  email: "",
  password: "",
  phone: "",     // optional but populated for controlled input
  groupSlug: "",
  status: AccountStatus.Activated,  // must import AccountStatus
};
```

### Validation Trigger Pattern

Use `schema.safeParse(values)` from form state (Zod stand-alone), or wire into `react-hook-form` with `zodResolver(schema)`. Factory form means schema is recreated on each labels change — fine for client-only render path.

### Labels — Validation Slice vs Namespace

The factory accepts a `Pick<CreateUserLabels, ...>` slice of 5 validation keys, but the full `CreateUserLabels` (23 properties + nested) provides all the copy needed for form fields, sections, buttons, toasts, etc. The ViewModel should:
1. Load the full namespace via `useAppTranslation("Dashboard.UsersCreateUser")` → returns `CreateUserLabels`
2. Pass `t` directly to `generalUserCreateSchemaFactory(t)` — TypeScript accepts it because `CreateUserLabels` is structurally compatible with `GeneralUserCreateValidationLabels` (supertype)
3. Spread remaining keys (`t.name`, `t.email`, `t.createButton`, etc.) to form fields, buttons, toasts via `labels: CreateUserLabels` on the ViewModel

NO need to project to `GeneralUserCreateValidationLabels` at call sites — the type system allows passing the superset.

### Wiring to Mutation (Task 9 hook)

The inferred `GeneralUserCreateFormData` shape maps directly to `GeneralUserCreateInput` GraphQL input (Task 7 GraphQL document):
```typescript
// After successful safeParse, the data shape is ready for mutation:
await createGeneralUser({
  variables: { input: { ...formData, status: formData.status ?? AccountStatus.Activated } },
});
```

`status` defaults via the schema's `.default(AccountStatus.Activated)`, so parsed output will always include `status`. No need for ViewModel-level defaulting after parse — use parsed value directly.

## Cross-File Dependencies Discovered

None. All dependencies were already provided by prior tasks:
- Zod v4 was already installed at `package.json:zod@^4.4.3`
- `AccountStatus` GraphQL enum generated by Task 5's `bun codegen` run
- `CreateUserLabels` type created by Task 6

## Notes for Reviewers

- The file is 35 lines — deliberately small and focused. Adding form state / mutation logic here would violate the layer separation (schemas are pure validation; ViewModels own mutations).
- `phone: z.string().optional()` — the optional wrapper matters for the GraphQL input which accepts null/undefined. When `phone` is missing from form values, parsed output is `undefined`, and the mutation variables object can include `phone: undefined` (Apollo skips undefined keys).
- `status` uses `.default()` modifier (Zod v4) — input can be omitted; parsed output always contains the defaulted value. This is why the schema does NOT need a separate "optional" wrapper on `status`. Default is `AccountStatus.Activated`, matching the backend service default (Task 3: `GeneralUserOnboardingService.createGeneralUser` defaults `status ?? ACTIVATED`).
