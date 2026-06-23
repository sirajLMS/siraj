# Task F — Frontend GraphQL: Apollo TypedDocumentNodes

**Objective:** Create `TypedDocumentNode` query and mutation documents for all new GraphQL operations introduced in Task E.

**Dependencies:** Depends on Task E — backend GraphQL schema must be generated and `bun codegen` must have run successfully.

**Layer-Specific Rules (Frontend GraphQL — Flattened from frontend/graphql/AGENTS.md):**
- One file per domain: `parent-profile.documents.ts` (within `sharedDocuments/`).
- Import from `"@apollo/client"` — NEVER from `"@apollo/client/core"`.
- TypedDocumentNode naming convention: `<camelCaseName>QueryDocument` / `<camelCaseName>MutationDocument`.
- Every selection set MUST include `id` on every named object type.
- NO `useLazyQuery` — use stateful `useQuery` exclusively.
- Run `bun run generate:gqlSchema` then `bun codegen` after creating documents.

**Target Files:**
- `frontend/graphql/sharedDocuments/parent-profile.documents.ts` — NEW
- `frontend/graphql/sharedDocuments/parent-billing-history.documents.ts` — NEW
- `frontend/graphql/sharedDocuments/parent-documents.documents.ts` — NEW
- `frontend/graphql/sharedDocuments/index.ts` — Add 3 new exports

---

## Detailed Implementation Steps

### Step 1: Create `frontend/graphql/sharedDocuments/parent-profile.documents.ts`

```typescript
import { gql } from "@apollo/client";
import type { TypedDocumentNode } from "@apollo/client";
import type {
  ParentProfileQuery,
  ParentProfileQueryVariables,
  ParentAssociatedStudentsQuery,
  ParentAssociatedStudentsQueryVariables,
  DeactivateParentMutation,
  DeactivateParentMutationVariables,
  UpdateStudentQuotaMutation,
  UpdateStudentQuotaMutationVariables,
} from "@/frontend/graphql/generated/gql/graphql-types";

// ─── Query: parentProfile ────────────────────────────────────────────────────

export const parentProfileQueryDocument: TypedDocumentNode<
  ParentProfileQuery,
  ParentProfileQueryVariables
> = gql`
  query ParentProfile($parentId: String!) {
    parentProfile(parentId: $parentId) {
      id
      userId
      name
      email
      avatarUrl
      status
      phone
      nationality
      address
      facebook
      whatsapp
      twitter
      skype
      defaultZoomLink
      invoiceType
      feeAmount
      paymentMethod
      currency
      timezone
      createdAt
      updatedAt
    }
  }
`;

// ─── Query: parentAssociatedStudents ─────────────────────────────────────────

export const parentAssociatedStudentsQueryDocument: TypedDocumentNode<
  ParentAssociatedStudentsQuery,
  ParentAssociatedStudentsQueryVariables
> = gql`
  query ParentAssociatedStudents($parentId: String!) {
    parentAssociatedStudents(parentId: $parentId) {
      id
      name
      status
      primaryTeacherId
      teacherName
      hoursPerWeek
      classesRemaining
      classesTotal
      language
      gender
      updatedAt
    }
  }
`;

// ─── Mutation: deactivateParent ──────────────────────────────────────────────

export const deactivateParentMutationDocument: TypedDocumentNode<
  DeactivateParentMutation,
  DeactivateParentMutationVariables
> = gql`
  mutation DeactivateParent($parentId: String!) {
    deactivateParent(parentId: $parentId) {
      id
      userId
      status
    }
  }
`;

// ─── Mutation: updateStudentQuota ─────────────────────────────────────────────

export const updateStudentQuotaMutationDocument: TypedDocumentNode<
  UpdateStudentQuotaMutation,
  UpdateStudentQuotaMutationVariables
> = gql`
  mutation UpdateStudentQuota(
    $studentId: String!
    $newClassesRemaining: Int!
    $expectedVersion: Int
  ) {
    updateStudentQuota(
      studentId: $studentId
      newClassesRemaining: $newClassesRemaining
      expectedVersion: $expectedVersion
    ) {
      id
      classesRemaining
      classesTotal
      version
    }
  }
`;
```

---

### Step 2: Create `frontend/graphql/sharedDocuments/parent-billing-history.documents.ts`

```typescript
import { gql } from "@apollo/client";
import type { TypedDocumentNode } from "@apollo/client";
import type {
  ParentInvoiceHistoryQuery,
  ParentInvoiceHistoryQueryVariables,
} from "@/frontend/graphql/generated/gql/graphql-types";

// ─── Query: parentInvoiceHistory ─────────────────────────────────────────────

export const parentInvoiceHistoryQueryDocument: TypedDocumentNode<
  ParentInvoiceHistoryQuery,
  ParentInvoiceHistoryQueryVariables
> = gql`
  query ParentInvoiceHistory($parentId: String!) {
    parentInvoiceHistory(parentId: $parentId) {
      id
      issueDate
      dueDate
      paidDate
      amount
      currency
      status
      invoiceType
      studentId
    }
  }
`;
```

---

### Step 3: Create `frontend/graphql/sharedDocuments/parent-documents.documents.ts`

```typescript
import { gql } from "@apollo/client";
import type { TypedDocumentNode } from "@apollo/client";
import type {
  ParentDocumentsQuery,
  ParentDocumentsQueryVariables,
  LinkDocumentToParentMutation,
  LinkDocumentToParentMutationVariables,
} from "@/frontend/graphql/generated/gql/graphql-types";

// ─── Query: parentDocuments ──────────────────────────────────────────────────

export const parentDocumentsQueryDocument: TypedDocumentNode<
  ParentDocumentsQuery,
  ParentDocumentsQueryVariables
> = gql`
  query ParentDocuments($parentId: String!) {
    parentDocuments(parentId: $parentId) {
      id
      fileId
      filePath
      isProtected
      usageType
      createdAt
    }
  }
`;

// ─── Mutation: linkDocumentToParent ──────────────────────────────────────────

export const linkDocumentToParentMutationDocument: TypedDocumentNode<
  LinkDocumentToParentMutation,
  LinkDocumentToParentMutationVariables
> = gql`
  mutation LinkDocumentToParent(
    $parentId: String!
    $fileId: String!
    $usageType: String!
  ) {
    linkDocumentToParent(
      parentId: $parentId
      fileId: $fileId
      usageType: $usageType
    ) {
      id
      fileId
      filePath
      isProtected
      usageType
      createdAt
    }
  }
`;
```

---

### Step 4: Update `frontend/graphql/sharedDocuments/index.ts`

Add three new barrel exports to the existing `index.ts`:

```typescript
// Add these alongside the existing exports:
export * from "./parent-profile.documents";
export * from "./parent-billing-history.documents";
export * from "./parent-documents.documents";
```

---

### Step 5: Run codegen to generate TypeScript types

```bash
bun run generate:gqlSchema
bun codegen
```

After codegen completes, the following types will be generated in `frontend/graphql/generated/gql/graphql-types.ts`:
- `ParentProfileQuery`, `ParentProfileQueryVariables`
- `ParentAssociatedStudentsQuery`, `ParentAssociatedStudentsQueryVariables`
- `DeactivateParentMutation`, `DeactivateParentMutationVariables`
- `UpdateStudentQuotaMutation`, `UpdateStudentQuotaMutationVariables`
- `ParentInvoiceHistoryQuery`, `ParentInvoiceHistoryQueryVariables`
- `ParentDocumentsQuery`, `ParentDocumentsQueryVariables`
- `LinkDocumentToParentMutation`, `LinkDocumentToParentMutationVariables`

---

## Test Execution Requirements

```bash
# Run GraphQL integration tests to confirm new documents work against the live test server
bun run test:graphql
```

---

## Success Criteria / Check Progress Points

- [ ] All 3 new document files created in `frontend/graphql/sharedDocuments/`.
- [ ] Every selection set includes `id` on every named object type.
- [ ] All documents import from `"@apollo/client"` — not `"@apollo/client/core"`.
- [ ] `index.ts` updated with 3 new barrel exports.
- [ ] `bun run generate:gqlSchema` succeeds.
- [ ] `bun codegen` succeeds with new TypeScript types generated.
- [ ] `bun tsgo` passes with 0 errors after codegen.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after each document file
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after each document file
- [ ] `bun lint` passes with 0 errors & 0 warnings after each document file
- [ ] `bun codescene` passes with 0 errors & 0 warnings after each document file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after completing all steps
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun lint` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun codescene` passes with 0 errors & 0 warnings after completing all steps
