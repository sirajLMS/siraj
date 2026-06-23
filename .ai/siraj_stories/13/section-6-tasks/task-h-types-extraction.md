### Task H — Type Extraction: Extract Onboarding Types from Mock Stores

**Objective:** Extract shared types from mock onboarding store files into dedicated `types.ts` files in the view component directories. Re-export generated GraphQL types where available. Update mock stores to re-import from `types.ts`.

**Dependencies:** Task G — codegen has run and generated types are available in `frontend/graphql/generated/gql/graphql-types.ts`. Depends on existing mock store type definitions.

**Layer-Specific Rules (Type Extraction - Flattened from AGENTS_STORY_PLANNING.md):**
- Extract all shared types (interfaces, type aliases, union types, constants) from mock store files into dedicated `types.ts` files in the view component's directory.
- Before defining any custom type, check `frontend/graphql/generated/gql/graphql-types.ts` for the generated equivalent.
- If the generated type matches the UI's needs, re-export it from the `types.ts` file and use it directly.
- Only define UI-specific types when the generated type is missing fields, has incompatible nullability, or doesn't exist yet.
- Mock stores then re-import from the `types.ts` file for backward compatibility with Storybook stories.
- This task MUST come after Frontend Apollo Documents (so codegen has run) and BEFORE Frontend Stores/Views.

**Target Files:**
- `frontend/views/dashboard/teachers/onboarding/types.ts` — New file
- `frontend/views/dashboard/parents/onboarding/types.ts` — New file
- `frontend/views/dashboard/managers/onboarding/types.ts` — New file
- `frontend/stores/mockTeacherOnboardingStore.ts` — Update to re-import types
- `frontend/stores/mockParentOnboardingStore.ts` — Update to re-import types
- `frontend/stores/mockManagerOnboardingStore.ts` — Update to re-import types

**Detailed Implementation Steps:**

*Step 1: Audit generated GraphQL types*

Open `frontend/graphql/generated/gql/graphql-types.ts` and search for the following generated types:
- `TeacherOnboardingInput` — should match the form data structure
- `ParentOnboardingInput` — should match the form data structure
- `ManagerOnboardingInput` — should match the form data structure
- `TeacherOnboardingResult` — should match the mutation result
- `ParentOnboardingResult` — should match the mutation result
- `ManagerOnboardingResult` — should match the mutation result
- `LoginValidationInput` — should match the validation input
- `LoginValidationResult` — should match the validation result

For each type, compare the generated fields with the mock store type fields. If they match (same fields, same nullability), re-export the generated type. If they differ (e.g., the form needs additional UI-only fields like `isSubmitting`), define a UI-specific type.

*Step 2: Create teacher onboarding types.ts*

Create `frontend/views/dashboard/teachers/onboarding/types.ts`:

```typescript
// Re-export generated GraphQL types where they match UI needs
export type {
  TeacherOnboardingInput,
  TeacherOnboardingResult,
} from "@/frontend/graphql/generated/gql/graphql-types";

// UI-specific types that have no generated equivalent
export type TeacherOnboardingGender = "male" | "female" | "";

// Form data type used by react-hook-form (combines GraphQL input with UI-only fields)
export interface TeacherOnboardingFormData {
  readonly fullName: string;
  readonly email: string;
  readonly nationality: string;
  readonly nationalId: string;
  readonly phone: string;
  readonly age: string;
  readonly gender: TeacherOnboardingGender;
  readonly address: string;
  readonly qualifications: string;
  readonly skypeId: string;
  readonly zoomLink: string;
  readonly country: string;
  readonly zoomUsername: string;
  readonly zoomPassword: string;
  readonly timezone: string;
  readonly salaryAmount: string;
  readonly currency: string;
  readonly beneficiaryName: string;
  readonly bankName: string;
  readonly accountNumber: string;
  readonly routingNumber: string;
  readonly swiftBic: string;
  readonly iban: string;
}

// Map form data to GraphQL input
export function mapTeacherFormDataToInput(data: TeacherOnboardingFormData): TeacherOnboardingInput {
  return {
    name: data.fullName,
    email: data.email,
    password: data.password ?? "", // Password is set separately or generated
    nationality: data.nationality || null,
    nationalId: data.nationalId || null,
    phone: data.phone || null,
    dateOfBirth: data.age || null,
    gender: data.gender === "" ? null : (data.gender.toUpperCase() as "MALE" | "FEMALE"),
    address: data.address || null,
    qualifications: data.qualifications || null,
    skypeId: data.skypeId || null,
    zoomLink: data.zoomLink || null,
    countryCode: data.country || null,
    timezone: data.timezone,
    hourlyRate: data.salaryAmount || null,
    rateCurrency: data.currency || null,
    beneficiaryName: data.beneficiaryName || null,
    bankName: data.bankName || null,
    accountNumber: data.accountNumber || null,
    routingNumber: data.routingNumber || null,
    swiftBic: data.swiftBic || null,
    iban: data.iban || null,
  };
}
```

*Step 3: Create parent onboarding types.ts*

Create `frontend/views/dashboard/parents/onboarding/types.ts`:

```typescript
export type {
  ParentOnboardingInput,
  ParentOnboardingResult,
} from "@/frontend/graphql/generated/gql/graphql-types";

export type ParentInvoiceType = "per_class" | "monthly" | "semester" | "";
export type ParentPaymentMethod = "bank_transfer" | "credit_card" | "cash" | "paypal" | "";

export interface ParentOnboardingFormData {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly nationality: string;
  readonly address: string;
  readonly whatsapp: string;
  readonly facebook: string;
  readonly twitter: string;
  readonly skype: string;
  readonly zoomId: string;
  readonly invoiceType: ParentInvoiceType;
  readonly feeAmount: string;
  readonly paymentMethod: ParentPaymentMethod;
  readonly currency: string;
}

export function mapParentFormDataToInput(data: ParentOnboardingFormData): ParentOnboardingInput {
  return {
    name: data.fullName,
    email: data.email,
    password: data.password ?? "",
    phone: data.phone || null,
    nationality: data.nationality || null,
    address: data.address || null,
    whatsapp: data.whatsapp || null,
    facebook: data.facebook || null,
    twitter: data.twitter || null,
    skype: data.skype || null,
    defaultZoomLink: data.zoomId || null,
    invoiceType: data.invoiceType === "" ? null : (data.invoiceType.toUpperCase() as "PER_CLASSES" | "MONTHLY"),
    feeAmount: data.feeAmount || null,
    paymentMethod: data.paymentMethod === "" ? null : (data.paymentMethod.toUpperCase() as "PAYPAL" | "BANK_ACCOUNT"),
    currency: data.currency || null,
  };
}
```

*Step 4: Create manager onboarding types.ts*

Create `frontend/views/dashboard/managers/onboarding/types.ts`:

```typescript
export type {
  ManagerOnboardingInput,
  ManagerOnboardingResult,
  ManagerAccountType,
} from "@/frontend/graphql/generated/gql/graphql-types";

export type ManagerDepartment = "academic" | "operations" | "human_resources" | "it_support";

export interface ManagerOnboardingFormData {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly skypeId: string;
  readonly accountType: ManagerAccountType;
  readonly department: ManagerDepartment;
}

export function mapManagerFormDataToInput(data: ManagerOnboardingFormData): ManagerOnboardingInput {
  return {
    name: data.fullName,
    email: data.email,
    password: data.password ?? "",
    phone: data.phone || null,
    skypeId: data.skypeId || null,
    accountType: data.accountType,
  };
}
```

*Step 5: Update mock stores to re-import types*

Open `frontend/stores/mockTeacherOnboardingStore.ts` and update the type import:

```typescript
import { create } from "zustand";
import type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/types";

// Re-export for backward compatibility
export type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/types";

interface TeacherOnboardingState {
  readonly data: TeacherOnboardingFormData;
  readonly isSubmitting: boolean;
  readonly setField: <K extends keyof TeacherOnboardingData>(field: K, value: TeacherOnboardingData[K]) => void;
  readonly setSubmitting: (isSubmitting: boolean) => void;
  readonly reset: () => void;
}

// ... rest of the store implementation remains unchanged ...
```

Open `frontend/stores/mockParentOnboardingStore.ts` and update:

```typescript
import { create } from "zustand";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/parents/onboarding/types";

export type { ParentOnboardingFormData } from "@/frontend/views/dashboard/parents/onboarding/types";

// ... rest of the store implementation remains unchanged ...
```

Open `frontend/stores/mockManagerOnboardingStore.ts` and update:

```typescript
import { create } from "zustand";
import type { ManagerOnboardingFormData } from "@/frontend/views/dashboard/managers/onboarding/types";

export type { ManagerOnboardingFormData } from "@/frontend/views/dashboard/managers/onboarding/types";

// ... rest of the store implementation remains unchanged ...
```

*Step 6: Verify TypeScript compilation*

```bash
bun tsgo
```

All files must compile with zero errors. The type extraction should not break any existing imports.

**Test Execution Requirements:**
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```
- Verify linting:
  ```bash
  bun lint
  ```

**Success Criteria / Check Progress Points:**
- [ ] Teacher onboarding `types.ts` created with form data type and mapping function
- [ ] Parent onboarding `types.ts` created with form data type and mapping function
- [ ] Manager onboarding `types.ts` created with form data type and mapping function
- [ ] Generated GraphQL types are re-exported where available
- [ ] UI-specific types are defined only when no generated equivalent exists
- [ ] Mock stores re-import types from `types.ts` files
- [ ] Mapping functions correctly transform form data to GraphQL input types
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] `bun lint` passes with zero errors
- [ ] No existing imports are broken by the type extraction

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
