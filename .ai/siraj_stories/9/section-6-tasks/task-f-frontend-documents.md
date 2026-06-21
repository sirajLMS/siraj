### Task F — Frontend GraphQL: Apollo TypedDocumentNodes for Story 9 Mutations

**Objective:** Create Apollo `TypedDocumentNode` mutation documents for all 5 new GraphQL mutations. Export from the shared documents index. Run codegen to generate typed hooks.

**Dependencies:** Depends on Task E — backend GraphQL schema is generated and all 5 new mutations are available in the schema. `bun run generate:gqlSchema` and `bun codegen` have been run successfully.

**Layer-Specific Rules (Frontend GraphQL — Flattened from `frontend/graphql/AGENTS.md`):**
- One file per domain: `billing-management.documents.ts`, `student-lifecycle.documents.ts`
- Import from `"@apollo/client"` — never from `"@apollo/client/core"`
- `TypedDocumentNode` naming convention: `<camelCaseName>MutationDocument`
- Every selection set must include `id` on every named object type for Apollo cache normalization
- **NO `useLazyQuery`** — use stateful `useQuery` exclusively (not applicable here since these are mutations, but `useMutation` is used)
- **🚫 NO DB/Repo Imports**: Frontend GraphQL can ONLY depend on generated types
- Import generated types from `@/frontend/graphql/generated/gql/graphql-types`

**Target Files:**
- `frontend/graphql/sharedDocuments/billing-management.documents.ts` — NEW file (3 billing mutations)
- `frontend/graphql/sharedDocuments/student-lifecycle.documents.ts` — NEW file (2 student mutations)
- `frontend/graphql/sharedDocuments/index.ts` — Add barrel exports for both new document files

---

#### Step 1: Create `frontend/graphql/sharedDocuments/billing-management.documents.ts`

```typescript
// frontend/graphql/sharedDocuments/billing-management.documents.ts

import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateManualInvoiceMutation,
  CreateManualInvoiceMutationVariables,
  DeleteInvoiceMutation,
  DeleteInvoiceMutationVariables,
  MarkInvoicePaidMutation,
  MarkInvoicePaidMutationVariables,
} from "@/frontend/graphql/generated/gql/graphql-types";

/**
 * Creates a manual invoice for a parent outside the automated billing cycle.
 * Requires: billing.create_invoice permission.
 */
export const createManualInvoiceMutationDocument: TypedDocumentNode<
  CreateManualInvoiceMutation,
  CreateManualInvoiceMutationVariables
> = gql`
  mutation CreateManualInvoice(
    $parentId: String!
    $studentId: String
    $amount: String!
    $currency: String!
    $invoiceType: String!
    $issueDate: String!
    $dueDate: String!
    $exchangeRateSnapshot: String
    $exchangeRateSource: String
  ) {
    createManualInvoice(
      parentId: $parentId
      studentId: $studentId
      amount: $amount
      currency: $currency
      invoiceType: $invoiceType
      issueDate: $issueDate
      dueDate: $dueDate
      exchangeRateSnapshot: $exchangeRateSnapshot
      exchangeRateSource: $exchangeRateSource
    ) {
      id
      parentId
      studentId
      amount
      currency
      status
      invoiceType
      issueDate
      dueDate
      paidDate
      version
      createdAt
    }
  }
`;

/**
 * Marks an UNPAID invoice as PAID with the current server timestamp as paidDate.
 * Requires: billing.update_status_paid permission.
 * Returns updated invoice status and whether notification tray was synced.
 */
export const markInvoicePaidMutationDocument: TypedDocumentNode<
  MarkInvoicePaidMutation,
  MarkInvoicePaidMutationVariables
> = gql`
  mutation MarkInvoicePaid($invoiceId: String!, $expectedVersion: Int) {
    markInvoicePaid(invoiceId: $invoiceId, expectedVersion: $expectedVersion) {
      id
      parentId
      status
      paidDate
      version
      notificationSummaryUpdated
    }
  }
`;

/**
 * Soft-deletes an invoice (sets deletedAt). Works on both UNPAID and PAID invoices.
 * Requires: billing.delete_invoice permission.
 * Returns the deleted invoice and whether notification tray was synced.
 */
export const deleteInvoiceMutationDocument: TypedDocumentNode<
  DeleteInvoiceMutation,
  DeleteInvoiceMutationVariables
> = gql`
  mutation DeleteInvoice($invoiceId: String!) {
    deleteInvoice(invoiceId: $invoiceId) {
      id
      parentId
      deletedAt
      version
      notificationSummaryUpdated
    }
  }
`;
```

---

#### Step 2: Create `frontend/graphql/sharedDocuments/student-lifecycle.documents.ts`

```typescript
// frontend/graphql/sharedDocuments/student-lifecycle.documents.ts

import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ChangeStudentStatusMutation,
  ChangeStudentStatusMutationVariables,
  ReassignStudentTeacherMutation,
  ReassignStudentTeacherMutationVariables,
} from "@/frontend/graphql/generated/gql/graphql-types";

/**
 * Reassigns a student's primary teacher to the specified teacher.
 * Requires: student.reassign_teacher permission.
 * Returns updated student with new primaryTeacherId and current version.
 */
export const reassignStudentTeacherMutationDocument: TypedDocumentNode<
  ReassignStudentTeacherMutation,
  ReassignStudentTeacherMutationVariables
> = gql`
  mutation ReassignStudentTeacher(
    $studentId: String!
    $newTeacherId: String!
    $expectedVersion: Int
  ) {
    reassignStudentTeacher(
      studentId: $studentId
      newTeacherId: $newTeacherId
      expectedVersion: $expectedVersion
    ) {
      id
      primaryTeacherId
      version
    }
  }
`;

/**
 * Changes a student's global enrollment status.
 * Requires: student.manage_status permission.
 * Valid transitions enforced by service + DB trigger.
 * Returns updated student with new status and current version.
 */
export const changeStudentStatusMutationDocument: TypedDocumentNode<
  ChangeStudentStatusMutation,
  ChangeStudentStatusMutationVariables
> = gql`
  mutation ChangeStudentStatus(
    $studentId: String!
    $newStatus: String!
    $expectedVersion: Int
  ) {
    changeStudentStatus(
      studentId: $studentId
      newStatus: $newStatus
      expectedVersion: $expectedVersion
    ) {
      id
      status
      version
    }
  }
`;
```

---

#### Step 3: Export New Documents from `frontend/graphql/sharedDocuments/index.ts`

Open `frontend/graphql/sharedDocuments/index.ts` and add two new export lines alongside the existing ones:

```typescript
// Add to frontend/graphql/sharedDocuments/index.ts:
export * from "./billing-management.documents";
export * from "./student-lifecycle.documents";
```

The complete set of new exports to add (existing exports remain untouched):
```typescript
// Story 9 additions:
export {
  createManualInvoiceMutationDocument,
  markInvoicePaidMutationDocument,
  deleteInvoiceMutationDocument,
} from "./billing-management.documents";
export {
  reassignStudentTeacherMutationDocument,
  changeStudentStatusMutationDocument,
} from "./student-lifecycle.documents";
```

Match the existing export style in `index.ts` — use named re-exports if the file uses named exports, or `export *` if it uses wildcard exports.

---

#### Step 4: Verify Generated Types Are Available

After Task E ran `bun codegen`, the following types must exist in `frontend/graphql/generated/gql/graphql-types.ts`. Verify with grep:

```bash
grep -n "CreateManualInvoice\|MarkInvoicePaid\|DeleteInvoice\|ReassignStudentTeacher\|ChangeStudentStatus" frontend/graphql/generated/gql/graphql-types.ts
```

Expected output: Each of the 5 mutation names appears as a `Mutation` type and `MutationVariables` type in the generated file.

If types are missing, re-run:
```bash
bun run generate:gqlSchema
bun codegen
```

---

#### Step 5: Run TypeScript Check

```bash
bun tsgo
```

Both new document files must compile with 0 errors. The `TypedDocumentNode` generics must resolve correctly against the generated types.

---

**Test Execution Requirements:**
```bash
bun run generate:gqlSchema
bun codegen
bun tsgo
```

---

**Success Criteria / Check Progress Points:**
- [ ] `billing-management.documents.ts` created with `createManualInvoiceMutationDocument`, `markInvoicePaidMutationDocument`, `deleteInvoiceMutationDocument`
- [ ] `student-lifecycle.documents.ts` created with `reassignStudentTeacherMutationDocument`, `changeStudentStatusMutationDocument`
- [ ] All mutation documents include `id` on every returned object type
- [ ] All documents use generated types from `frontend/graphql/generated/gql/graphql-types.ts`
- [ ] Both new files exported from `frontend/graphql/sharedDocuments/index.ts`
- [ ] `bun run generate:gqlSchema` passes with 0 errors
- [ ] `bun codegen` passes with 0 errors
- [ ] `bun tsgo` passes with 0 TypeScript errors on both new files
- [ ] No `backend/db/` or `drizzle-orm` imports in frontend graphql files

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
