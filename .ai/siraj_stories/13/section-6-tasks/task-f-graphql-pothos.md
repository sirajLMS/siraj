### Task F — Backend GraphQL: Pothos Objects, Input Types & Mutations for User Provisioning

**Objective:** Define Pothos GraphQL input types, mutation fields, and a query field for user provisioning workflows. Wire resolvers to the service layer with proper locale propagation and permission enforcement.

**Dependencies:** Task E — service methods are implemented and tested. Depends on existing Pothos schema builder (`gqlSchemaBuilder`), existing auth Pothos objects, and existing enum Pothos types.

**Layer-Specific Rules (Backend GraphQL — Flattened from backend/graphql/pothos/AGENTS.md):**
- Framework: Pothos code-first GraphQL schema builder.
- Nullability: Fields are non-nullable by default unless explicitly set to `nullable: true`.
- Resolvers: Pothos field resolvers should delegate to the `backend/services/` layer.
- Cache Updates: Ensure `id` fields are always exposed on GraphQL objects.
- Locale Propagation: Resolvers must propagate `ctx.locale` to service calls.
- **🚫 NO DB/Repo Imports**: Resolvers can ONLY depend on `backend/services/`. Importing from `backend/db/repo/`, `backend/db/schema`, or any database module is **strictly forbidden**.

**Target Files:**
- `backend/graphql/pothos/teacher-onboarding.pothos.ts` — New file for teacher onboarding GraphQL types and mutations
- `backend/graphql/pothos/parent-onboarding.pothos.ts` — New file for parent onboarding GraphQL types and mutations
- `backend/graphql/pothos/manager-onboarding.pothos.ts` — New file for manager onboarding GraphQL types and mutations
- `backend/graphql/pothos/index.ts` — Export new Pothos modules

**Detailed Implementation Steps:**

*Step 1: Create teacher onboarding Pothos types and mutation*

Create `backend/graphql/pothos/teacher-onboarding.pothos.ts`:

```typescript
import { TeacherOnboardingService } from "@/services/teacher/teacher-onboarding.service";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

// Input type for teacher onboarding
export const TeacherOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<TeacherOnboardingInput>("TeacherOnboardingInput")
  .implement({
    description: "Input for creating a new teacher account with comprehensive profile",
    fields: t => ({
      name: t.string({ required: true, description: "Teacher full name" }),
      email: t.field({ type: "Email", required: true, description: "Teacher email address" }),
      password: t.string({ required: true, description: "Teacher password" }),
      nationality: t.string({ description: "Teacher nationality (country code)" }),
      nationalId: t.string({ description: "Teacher national ID (encrypted)" }),
      phone: t.string({ description: "Teacher phone number" }),
      dateOfBirth: t.string({ description: "Teacher date of birth (ISO date string)" }),
      gender: t.field({
        type: "Gender",
        description: "Teacher gender",
      }),
      address: t.string({ description: "Teacher address" }),
      qualifications: t.string({ description: "Teacher qualifications" }),
      skypeId: t.string({ description: "Teacher Skype ID" }),
      zoomLink: t.string({ description: "Teacher Zoom meeting link" }),
      zoomUsername: t.string({ description: "Teacher Zoom username" }),
      zoomPassword: t.string({ description: "Teacher Zoom password (encrypted)" }),
      countryCode: t.field({
        type: "CountryCode",
        description: "Teacher country code",
      }),
      timezoneId: t.int({ description: "Timezone ID reference" }),
      timezone: t.string({ required: true, description: "IANA timezone identifier" }),
      hourlyRate: t.string({ description: "Teacher hourly rate" }),
      rateCurrency: t.string({ description: "Currency for hourly rate" }),
      beneficiaryName: t.string({ description: "Banking beneficiary name" }),
      bankName: t.string({ description: "Bank name" }),
      accountNumber: t.string({ description: "Bank account number" }),
      routingNumber: t.string({ description: "Bank routing number" }),
      swiftBic: t.string({ description: "SWIFT/BIC code" }),
      iban: t.string({ description: "IBAN" }),
    }),
  });

// Response type for teacher onboarding
export const TeacherOnboardingResultPothosObject = gqlSchemaBuilder
  .objectRef<TeacherOnboardingResult>("TeacherOnboardingResult")
  .implement({
    description: "Result of teacher onboarding operation",
    fields: t => ({
      userId: t.exposeString("userId", { description: "Created user ID" }),
      teacherId: t.exposeString("teacherId", { description: "Created teacher profile ID" }),
      name: t.exposeString("name", { description: "Teacher name" }),
      email: t.exposeString("email", { description: "Teacher email" }),
      status: t.exposeString("status", { description: "Teacher account status" }),
    }),
  });

// Mutation field registration (to be added to the mutation builder in index.ts)
export function registerTeacherOnboardingMutations(t: any) {
  t.field("createTeacher", {
    type: TeacherOnboardingResultPothosObject,
    description: "Create a new teacher account with comprehensive profile",
    args: {
      input: t.arg({ type: TeacherOnboardingInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await TeacherOnboardingService.createTeacher(
        ctx.userId,
        args.input,
        ctx.locale
      );
      return result;
    },
  });
}
```

*Step 2: Create parent onboarding Pothos types and mutation*

Create `backend/graphql/pothos/parent-onboarding.pothos.ts`:

```typescript
import { ParentOnboardingService } from "@/services/parent/parent-onboarding.service";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

export const ParentOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<ParentOnboardingInput>("ParentOnboardingInput")
  .implement({
    description: "Input for creating a new parent account with billing configuration",
    fields: t => ({
      name: t.string({ required: true }),
      email: t.field({ type: "Email", required: true }),
      password: t.string({ required: true }),
      phone: t.string(),
      nationality: t.string(),
      address: t.string(),
      facebook: t.string(),
      whatsapp: t.string(),
      twitter: t.string(),
      skype: t.string(),
      defaultZoomLink: t.string(),
      invoiceType: t.field({ type: "InvoiceType" }),
      feeAmount: t.string(),
      paymentMethod: t.field({ type: "PaymentMethod" }),
      currency: t.string(),
      timezone: t.string(),
    }),
  });

export const ParentOnboardingResultPothosObject = gqlSchemaBuilder
  .objectRef<ParentOnboardingResult>("ParentOnboardingResult")
  .implement({
    description: "Result of parent onboarding operation",
    fields: t => ({
      userId: t.exposeString("userId"),
      parentId: t.exposeString("parentId"),
      name: t.exposeString("name"),
      email: t.exposeString("email"),
      status: t.exposeString("status"),
      invoiceType: t.exposeString("invoiceType", { nullable: true }),
      currency: t.exposeString("currency", { nullable: true }),
    }),
  });

export function registerParentOnboardingMutations(t: any) {
  t.field("createParent", {
    type: ParentOnboardingResultPothosObject,
    description: "Create a new parent account with billing configuration",
    args: {
      input: t.arg({ type: ParentOnboardingInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await ParentOnboardingService.createParent(
        ctx.userId,
        args.input,
        ctx.locale
      );
      return result;
    },
  });
}
```

*Step 3: Create manager onboarding Pothos types and mutation*

Create `backend/graphql/pothos/manager-onboarding.pothos.ts`:

```typescript
import { ManagerOnboardingService } from "@/services/staff/manager-onboarding.service";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

export const ManagerAccountTypePothosEnum = gqlSchemaBuilder.enumType(
  { admin: "admin", manager: "manager" },
  { name: "ManagerAccountType", description: "Account type for new manager" }
);

export const ManagerOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<ManagerOnboardingInput>("ManagerOnboardingInput")
  .implement({
    description: "Input for creating a new manager/staff account with RBAC assignment",
    fields: t => ({
      name: t.string({ required: true }),
      email: t.field({ type: "Email", required: true }),
      password: t.string({ required: true }),
      phone: t.string(),
      skypeId: t.string(),
      accountType: t.field({ type: ManagerAccountTypePothosEnum, required: true }),
    }),
  });

export const ManagerOnboardingResultPothosObject = gqlSchemaBuilder
  .objectRef<ManagerOnboardingResult>("ManagerOnboardingResult")
  .implement({
    description: "Result of manager onboarding operation",
    fields: t => ({
      userId: t.exposeString("userId"),
      staffProfileId: t.exposeString("staffProfileId"),
      name: t.exposeString("name"),
      email: t.exposeString("email"),
      status: t.exposeString("status"),
      assignedGroupSlug: t.exposeString("assignedGroupSlug"),
    }),
  });

export function registerManagerOnboardingMutations(t: any) {
  t.field("createManager", {
    type: ManagerOnboardingResultPothosObject,
    description: "Create a new manager/staff account (System Admin only)",
    args: {
      input: t.arg({ type: ManagerOnboardingInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await ManagerOnboardingService.createManager(
        ctx.userId,
        args.input,
        ctx.locale
      );
      return result;
    },
  });
}
```



Open `backend/graphql/pothos/index.ts` and add exports for the new modules:

```typescript
// ... existing exports ...

export {
  TeacherOnboardingInputPothosObject,
  TeacherOnboardingResultPothosObject,
  registerTeacherOnboardingMutations,
} from "./teacher-onboarding.pothos";

export {
  ParentOnboardingInputPothosObject,
  ParentOnboardingResultPothosObject,
  registerParentOnboardingMutations,
} from "./parent-onboarding.pothos";

export {
  ManagerAccountTypePothosEnum,
  ManagerOnboardingInputPothosObject,
  ManagerOnboardingResultPothosObject,
  registerManagerOnboardingMutations,
} from "./manager-onboarding.pothos";

export {
  LoginRoleTabPothosEnum,
  LoginValidationInputPothosObject,
  LoginValidationResultPothosObject,
  registerAuthValidationQueries,
} from "./auth-validation.pothos";
```

*Step 5: Register mutations in the schema builder*

Open the main schema builder file (typically `backend/graphql/gqlSchemaBuilder.ts` or the file that assembles the schema) and register the new mutations:

```typescript
// In the mutation builder section:
registerTeacherOnboardingMutations(mutationBuilder);
registerParentOnboardingMutations(mutationBuilder);
registerManagerOnboardingMutations(mutationBuilder);
```

*Step 7: Run schema generation and codegen*

```bash
bun run generate:gqlSchema
bun codegen
```

Both commands must pass with zero errors. The generated schema should include:
- `createTeacher` mutation
- `createParent` mutation
- `createManager` mutation
- `validateLoginScope` query
- All input types and result types

**Test Execution Requirements:**
- Run GraphQL schema generation and codegen:
  ```bash
  bun run generate:gqlSchema
  bun codegen
  ```
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] All Pothos input types are defined with correct field types and nullability
- [ ] All Pothos result types expose all fields from service result interfaces
- [ ] All mutation resolvers delegate to service layer with `ctx.userId` and `ctx.locale` propagation
- [ ] No DB/repo imports in any Pothos files
- [ ] All new modules are exported from `index.ts`
- [ ] All mutations are registered in the schema builder
- [ ] `bun run generate:gqlSchema` succeeds with zero errors
- [ ] `bun codegen` succeeds with zero errors
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] Generated GraphQL schema includes all 3 new operations

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
