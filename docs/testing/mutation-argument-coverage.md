# Mutation Argument Coverage in GraphQL Integration Tests

Brief summary: All GraphQL mutation integration tests MUST pass every available input argument (required AND optional) as `variables` at every mutation call site. Optional fields must be tested with both meaningful non-null values and `null`.

## Why Full Argument Coverage

Mutation integration tests live in `frontend/common/graphql/test/` and exercise the full GraphQL stack (Pothos resolvers → services → repositories → database). If a test omits optional arguments:

1. The resolver branch that handles the optional field is never exercised
2. Regressions in optional argument handling go undetected
3. The test doesn't validate the complete API contract

## The Pattern

### 1. Discover All Available Arguments

For each mutation document, look up the args type in `frontend/common/graphql/generated/gql/graphql-types.ts`:

```typescript
// Example: MutationUpdateStudentQuotaArgs
type MutationUpdateStudentQuotaArgs = {
  expectedVersion: InputMaybe<Scalars['Int']['input']>;  // optional
  newClassesRemaining: Scalars['Int']['input'];          // required
  studentId: Scalars['ID']['input'];                     // required
};
```

- Fields **without** `InputMaybe` are required — always pass a value.
- Fields **with** `InputMaybe` are optional — test both non-null and `null`.

### 2. For Input Object Mutations

If the mutation takes an `input` object (e.g., `input: TeacherOnboardingInput!`), look up the input type and include **ALL** its fields:

```typescript
type TeacherOnboardingInput = {
  email: Scalars['Email']['input'];                    // required
  name: Scalars['String']['input'];                     // required
  password: Scalars['String']['input'];                 // required
  timezone: IanaTimezone;                               // required
  address: InputMaybe<Scalars['String']['input']>;       // optional
  avatarUrl: InputMaybe<Scalars['String']['input']>;     // optional
  // ... more optional fields
};
```

### 3. Test Both Null and Non-Null for Optional Fields

For each optional field:
- At least one test case must pass a **meaningful non-null value** (real enum values, realistic strings, valid IDs)
- At least one test case must pass **`null`**

```typescript
// ✅ Good — non-null optional fields
const input = {
  email: "teacher@example.com",
  name: "Test Teacher",
  password: "password123",
  timezone: "Africa/Cairo",
  address: "123 Teacher St",         // optional, non-null
  avatarUrl: "https://example.com/avatar.png",  // optional, non-null
  gender: Gender.Male,               // optional, valid enum
  phone: "+201234567890",            // optional, non-null
};

// ✅ Also needed — null optional fields
const minimalInput = {
  email: "teacher2@example.com",
  name: "Test Teacher 2",
  password: "password123",
  timezone: "Africa/Cairo",
  address: null,
  avatarUrl: null,
  gender: null,
  phone: null,
};
```

### 4. Use `authenticatedRequest` and `assertOperationDenied`

```typescript
import { authenticatedRequest, assertOperationDenied } from "@/frontend/common/graphql/test/helpers";

// For authenticated mutations:
const result = await authenticatedRequest(createTeacherMutationDocument, {
  input: fullInput,
});

// For authorization denial tests:
await assertOperationDenied({
  document: createTeacherMutationDocument,
  variables: { input: fullInput },
  deniedRole: "MANAGER",  // role that should be denied
});
```

## Rules / Conventions

- Every mutation call site MUST pass ALL available input arguments as `variables`
- Required fields (`InputMaybe` absent): always pass a value
- Optional fields (`InputMaybe` present): test both non-null and `null` in separate test cases
- For `input` object mutations: include ALL fields of the input type in the input object
- Use valid enum values from generated types (`CurrencyCode.Usd`, `AccountStatus.Activated`, etc.)
- Use `authenticatedRequest` from `helpers.ts` for authenticated mutations
- Use `assertOperationDenied` for authorization denial tests
- Use `@/` aliases for imports — never relative paths
- Use `~/.bun/bin/bun` for all commands
- For input objects with nested input types (e.g., `PaymentMethodDetailsInput` inside `UserPaymentMethodCreateInput`), populate ALL nested fields too

## What NOT to Do

- **Don't omit optional fields** — they must be present, even as `null`
- **Don't use empty `variables: {}` for mutations with args** — always pass the full arg set
- **Don't hardcode enum string values** — import and use the generated enum (e.g., `CurrencyCode.Usd` not `"USD"`)
- **Don't test only `null` for optional fields** — also test with meaningful non-null values
- **Don't test only non-null for optional fields** — also test the `null` path
- **Don't modify backend files from test subagents** — report via CROSS-FILE DEPENDENCY

## Rollout Summary

30 test files audited across `frontend/common/graphql/test/`:

| Outcome | Count | Example Files |
|---------|-------|---------------|
| No changes needed (already compliant) | 17 | auth, class-session, schedule, report, notification-prefs, session-config, etc. |
| Added non-null optional field tests | 10 | billing-management, payment-method, complaint, meeting-config, parent-onboarding, student-lifecycle, status-tracking, student-onboarding, manager-onboarding, teacher |
| Added null optional field tests | 1 | general-settings (added null upsert test) |
| Fixed test assertions | 1 | payment-method (stale assertion) |

Files with code changes (13):
- `billing/billing-management.test.ts` — added all-optional-args-non-null test + expectedVersion test
- `billing/payment-method.test.ts` — added full PaymentMethodDetailsInput coverage + fixed assertion
- `classes/class-instance-detail.test.ts` — added null classType test
- `complaints/complaint.test.ts` — added non-null files field test
- `meeting/meeting-config.test.ts` — added non-null optional fields for provider + user config
- `notifications/notification-preferences.test.ts` — no changes (already compliant)
- `parents/parent-onboarding.test.ts` — populated optional fields with realistic values
- `parents/parent.test.ts` — added non-null expectedVersion tests for updateStudentQuota
- `settings/general-settings.test.ts` — added null optional fields upsert test
- `students/status-tracking.test.ts` — added non-null expectedVersion + OnLeave enum value
- `students/student-history.test.ts` — fixed cleanup guard to check all 6 IDs
- `students/student-lifecycle.test.ts` — added non-null expectedVersion tests
- `students/student-onboarding.test.ts` — populated optional fields with realistic values
- `teachers/manager-directory-graphql.test.ts` — populated all optional fields with enum values
- `teachers/manager-onboarding.test.ts` — refactored to builder pattern, all optional fields populated
- `teachers/teacher.test.ts` — populated all 12 TeacherProfileUpdateInput fields
- `auth/impersonation.test.ts` — added non-null optional args test for createManualInvoice

No backend bugs were found during the audit.

## Related Documents

- `frontend/common/graphql/test/AGENTS.md` — Test infrastructure rules
- `.ai/plans/graphql-mutation-test-args/` — Original plan and outcome files
- `frontend/common/graphql/generated/gql/graphql-types.ts` — Source of truth for mutation arg types
