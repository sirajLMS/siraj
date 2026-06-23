### Task G — Frontend GraphQL: Apollo TypedDocumentNodes for User Provisioning

**Objective:** Create Apollo `TypedDocumentNode` query and mutation documents for user provisioning operations. Run codegen to generate TypeScript types.

**Dependencies:** Task F — backend GraphQL schema is generated and codegen has run. Depends on generated GraphQL types in `frontend/graphql/generated/gql/graphql-types.ts`.

**Layer-Specific Rules (Frontend GraphQL — Flattened from frontend/graphql/sharedDocuments/AGENTS.md):**
- One file per domain: `<domain>.documents.ts`
- Import from `"@apollo/client"` — never from `"@apollo/client/core"`
- TypedDocumentNode naming convention: `<camelCaseName>QueryDocument` / `<camelCaseName>MutationDocument`
- Every selection set must include `id` field on every named object type
- NO `useLazyQuery` — use stateful `useQuery` exclusively
- **🚫 NO DB/Repo Imports**: Frontend GraphQL can ONLY depend on generated types.

**Target Files:**
- `frontend/graphql/sharedDocuments/teacher-onboarding.documents.ts` — New file
- `frontend/graphql/sharedDocuments/parent-onboarding.documents.ts` — New file
- `frontend/graphql/sharedDocuments/manager-onboarding.documents.ts` — New file
- `frontend/graphql/sharedDocuments/auth-validation.documents.ts` — New file
- `frontend/graphql/sharedDocuments/index.ts` — Export new documents

**Detailed Implementation Steps:**

*Step 1: Create teacher onboarding documents*

Create `frontend/graphql/sharedDocuments/teacher-onboarding.documents.ts`:

```typescript
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createTeacherMutationDocument: TypedDocumentNode<
  Operations.CreateTeacherMutation,
  Types.MutationCreateTeacherArgs
> = gql`
  mutation createTeacher($input: TeacherOnboardingInput!) {
    createTeacher(input: $input) {
      userId
      teacherId
      name
      email
      status
    }
  }
`;
```

*Step 2: Create parent onboarding documents*

Create `frontend/graphql/sharedDocuments/parent-onboarding.documents.ts`:

```typescript
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createParentMutationDocument: TypedDocumentNode<
  Operations.CreateParentMutation,
  Types.MutationCreateParentArgs
> = gql`
  mutation createParent($input: ParentOnboardingInput!) {
    createParent(input: $input) {
      userId
      parentId
      name
      email
      status
      invoiceType
      currency
    }
  }
`;
```

*Step 3: Create manager onboarding documents*

Create `frontend/graphql/sharedDocuments/manager-onboarding.documents.ts`:

```typescript
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createManagerMutationDocument: TypedDocumentNode<
  Operations.CreateManagerMutation,
  Types.MutationCreateManagerArgs
> = gql`
  mutation createManager($input: ManagerOnboardingInput!) {
    createManager(input: $input) {
      userId
      staffProfileId
      name
      email
      status
      assignedGroupSlug
    }
  }
`;
```

*Step 4: Create auth validation documents*

Create `frontend/graphql/sharedDocuments/auth-validation.documents.ts`:

```typescript
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const validateLoginScopeQueryDocument: TypedDocumentNode<
  Operations.ValidateLoginScopeQuery,
  Types.QueryValidateLoginScopeArgs
> = gql`
  query validateLoginScope($input: LoginValidationInput!) {
    validateLoginScope(input: $input) {
      valid
      error
      userId
    }
  }
`;
```

*Step 5: Export from index.ts*

Open `frontend/graphql/sharedDocuments/index.ts` and add barrel exports:

```typescript
// ... existing exports ...

export { createTeacherMutationDocument } from "./teacher-onboarding.documents";
export { createParentMutationDocument } from "./parent-onboarding.documents";
export { createManagerMutationDocument } from "./manager-onboarding.documents";
export { validateLoginScopeQueryDocument } from "./auth-validation.documents";
```

*Step 6: Run codegen*

```bash
bun run generate:gqlSchema
bun codegen
```

Both commands must pass. The generated types should include:
- `CreateTeacherMutation` and `MutationCreateTeacherArgs`
- `CreateParentMutation` and `MutationCreateParentArgs`
- `CreateManagerMutation` and `MutationCreateManagerArgs`
- `ValidateLoginScopeQuery` and `QueryValidateLoginScopeArgs`

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
- [ ] All mutation documents use correct TypedDocumentNode pattern
- [ ] All query documents use correct TypedDocumentNode pattern
- [ ] All documents import from `"@apollo/client"` (not `"@apollo/client/core"`)
- [ ] All documents use generated types from `graphql-types.ts`
- [ ] All documents are exported from `index.ts`
- [ ] `bun run generate:gqlSchema` succeeds
- [ ] `bun codegen` succeeds
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] Generated types include all 4 new operations

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
