### Task F — Frontend GraphQL: Apollo TypedDocumentNodes

**Objective:** Create Apollo `TypedDocumentNode` query and mutation documents for all new GraphQL operations in the complaints and suggestions domain. Run codegen to generate TypeScript types for all 8 documents.

**Dependencies:** Task E — backend GraphQL schema is generated and codegen types exist. Depends on generated GraphQL types in `frontend/graphql/generated/gql/graphql-types.ts` and operations in `frontend/graphql/generated/gql/operations.ts`.

**Layer-Specific Rules (Frontend GraphQL — Flattened from frontend/graphql/sharedDocuments/AGENTS.md):**
- One file per domain: `<domain>.documents.ts`
- Import from `"@apollo/client"` — never from `"@apollo/client/core"`
- TypedDocumentNode naming convention: `<camelCaseName>QueryDocument` / `<camelCaseName>MutationDocument`
- Every selection set must include `id` field on every named object type
- NO `useLazyQuery` — use stateful `useQuery` exclusively
- **🚫 NO DB/Repo Imports**: Frontend GraphQL can ONLY depend on generated types.

**Target Files:**
- `frontend/graphql/sharedDocuments/complaint.documents.ts` — NEW
- `frontend/graphql/sharedDocuments/suggestion.documents.ts` — NEW
- `frontend/graphql/sharedDocuments/index.ts` — Add exports

---

#### Detailed Implementation Steps

---

##### Step 1 — Create `frontend/graphql/sharedDocuments/complaint.documents.ts`

This file contains all 5 complaint-related TypedDocumentNode definitions: 2 queries and 3 mutations.

```typescript
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

// ─── Query: parentComplaints ────────────────────────────────────────────────

export const parentComplaintsQueryDocument: TypedDocumentNode<
  Operations.ParentComplaintsQuery
> = gql`
  query ParentComplaints {
    parentComplaints {
      id
      category
      body
      status
      createdAt
      studentName
      responses {
        id
        body
        emailSent
        createdAt
        responderName
      }
    }
  }
`;

// ─── Query: adminComplaintQueue ─────────────────────────────────────────────

export const adminComplaintQueueQueryDocument: TypedDocumentNode<
  Operations.AdminComplaintQueueQuery,
  Types.QueryAdminComplaintQueueArgs
> = gql`
  query AdminComplaintQueue($filter: AdminComplaintQueueFilterInput) {
    adminComplaintQueue(filter: $filter) {
      rows {
        id
        parentId
        studentId
        category
        submitterEmail
        body
        status
        createdAt
        parentName
        studentName
        responseCount
      }
      metrics {
        unanswered
        answered
        avgResolutionTime
      }
      totalCount
    }
  }
`;

// ─── Mutation: submitComplaint ──────────────────────────────────────────────

export const submitComplaintMutationDocument: TypedDocumentNode<
  Operations.SubmitComplaintMutation,
  Types.MutationSubmitComplaintArgs
> = gql`
  mutation SubmitComplaint($input: SubmitComplaintInput!) {
    submitComplaint(input: $input) {
      id
      category
      body
      status
      createdAt
    }
  }
`;

// ─── Mutation: respondToComplaint ───────────────────────────────────────────

export const respondToComplaintMutationDocument: TypedDocumentNode<
  Operations.RespondToComplaintMutation,
  Types.MutationRespondToComplaintArgs
> = gql`
  mutation RespondToComplaint($input: RespondToComplaintInput!) {
    respondToComplaint(input: $input) {
      id
      body
      emailSent
      createdAt
      responderName
    }
  }
`;

// ─── Mutation: deleteComplaint ──────────────────────────────────────────────

export const deleteComplaintMutationDocument: TypedDocumentNode<
  Operations.DeleteComplaintMutation,
  Types.MutationDeleteComplaintArgs
> = gql`
  mutation DeleteComplaint($complaintId: String!) {
    deleteComplaint(complaintId: $complaintId)
  }
`;
```

**Key points:**
- `parentComplaintsQueryDocument` is a no-arg query — the second type parameter is omitted per convention.
- `adminComplaintQueueQueryDocument` accepts an optional `AdminComplaintQueueFilterInput` for status filtering.
- `submitComplaintMutationDocument` accepts a required `SubmitComplaintInput` object.
- `respondToComplaintMutationDocument` accepts a required `RespondToComplaintInput` object.
- `deleteComplaintMutationDocument` accepts a scalar `complaintId: String!` and returns `Boolean`.
- All named object types include `id` in their selection sets.
- The `metrics` sub-object is a value type (no `id`) — it holds aggregate counters only.
- All imports come from `"@apollo/client"` — never from `"@apollo/client/core"`.
- No DB/repo imports anywhere in this file.

---

##### Step 2 — Create `frontend/graphql/sharedDocuments/suggestion.documents.ts`

This file contains all 3 suggestion-related TypedDocumentNode definitions: 1 query and 2 mutations.

```typescript
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

// ─── Query: adminSuggestions ────────────────────────────────────────────────

export const adminSuggestionsQueryDocument: TypedDocumentNode<
  Operations.AdminSuggestionsQuery,
  Types.QueryAdminSuggestionsArgs
> = gql`
  query AdminSuggestions($filter: AdminSuggestionsFilterInput) {
    adminSuggestions(filter: $filter) {
      rows {
        id
        parentId
        submitterName
        body
        emailSentAt
        createdAt
        parentName
      }
      metrics {
        pending
        reviewed
        avgResponseTime
      }
      totalCount
    }
  }
`;

// ─── Mutation: submitSuggestion ─────────────────────────────────────────────

export const submitSuggestionMutationDocument: TypedDocumentNode<
  Operations.SubmitSuggestionMutation,
  Types.MutationSubmitSuggestionArgs
> = gql`
  mutation SubmitSuggestion($input: SubmitSuggestionInput!) {
    submitSuggestion(input: $input) {
      id
      submitterName
      body
      createdAt
    }
  }
`;

// ─── Mutation: markSuggestionReviewed ───────────────────────────────────────

export const markSuggestionReviewedMutationDocument: TypedDocumentNode<
  Operations.MarkSuggestionReviewedMutation,
  Types.MutationMarkSuggestionReviewedArgs
> = gql`
  mutation MarkSuggestionReviewed($suggestionId: String!) {
    markSuggestionReviewed(suggestionId: $suggestionId) {
      id
      emailSentAt
    }
  }
`;
```

**Key points:**
- `adminSuggestionsQueryDocument` accepts an optional `AdminSuggestionsFilterInput` for pagination/filtering.
- `submitSuggestionMutationDocument` accepts a required `SubmitSuggestionInput` and returns the core suggestion fields.
- `markSuggestionReviewedMutationDocument` accepts a scalar `suggestionId` and returns only `id` and `emailSentAt` — the minimal fields needed to confirm the review action.
- All named object types include `id` in their selection sets.
- The `metrics` sub-object is a value type (no `id`) — it holds aggregate counters only.
- All imports come from `"@apollo/client"` — never from `"@apollo/client/core"`.
- No DB/repo imports anywhere in this file.

---

##### Step 3 — Update `frontend/graphql/sharedDocuments/index.ts`

Open `frontend/graphql/sharedDocuments/index.ts` and add barrel exports for the two new document files. Insert the new lines in alphabetical order to maintain the existing convention:

```typescript
export * from "./auth.documents";
export * from "./availability-search.documents";
export * from "./billing-alerts.documents";
export * from "./billing-management.documents";
export * from "./class-session.documents";
export * from "./complaint.documents";
export * from "./dst-migration.documents";
export * from "./learning-resource.documents";
export { createManagerMutationDocument } from "./manager-onboarding.documents";
export * from "./notification-alerts.documents";
export * from "./parent-billing-history.documents";
export * from "./parent-directory.documents";
export * from "./parent-documents.documents";
export { createParentMutationDocument } from "./parent-onboarding.documents";
export * from "./parent-profile.documents";
export * from "./permission-management.documents";
export * from "./recurring-class.documents";
export * from "./report.documents";
export * from "./schedule.documents";
export * from "./schedule-deletion.documents";
export * from "./staff-directory.documents";
export * from "./staff-profile.documents";
export * from "./student.documents";
export * from "./student-directory.documents";
export * from "./student-history.documents";
export * from "./student-lifecycle.documents";
export * from "./suggestion.documents";
export * from "./teacher.documents";
export * from "./teacher-dashboard.documents";
export { createTeacherMutationDocument } from "./teacher-onboarding.documents";
export * from "./test-helper.documents";
export * from "./translation.documents";
export * from "./weekly-schedule.documents";
```

**Key points:**
- `complaint.documents` is inserted alphabetically between `class-session.documents` and `dst-migration.documents`.
- `suggestion.documents` is inserted alphabetically between `student-lifecycle.documents` and `teacher.documents`.
- Both use `export *` since all documents in these files should be publicly available.

---

##### Step 4 — Run schema generation and codegen

After all document files are created and the index is updated, run the codegen pipeline to generate TypeScript types for the new operations:

```bash
~/.bun/bin/bun run generate:gqlSchema
~/.bun/bin/bun codegen
```

Both commands must pass with zero errors. The generated types should include:

| Generated Type | Source |
|---|---|
| `Operations.ParentComplaintsQuery` | `parentComplaints` query |
| `Operations.AdminComplaintQueueQuery` | `adminComplaintQueue` query |
| `Types.QueryAdminComplaintQueueArgs` | `adminComplaintQueue` query variables |
| `Operations.SubmitComplaintMutation` | `submitComplaint` mutation |
| `Types.MutationSubmitComplaintArgs` | `submitComplaint` mutation variables |
| `Operations.RespondToComplaintMutation` | `respondToComplaint` mutation |
| `Types.MutationRespondToComplaintArgs` | `respondToComplaint` mutation variables |
| `Operations.DeleteComplaintMutation` | `deleteComplaint` mutation |
| `Types.MutationDeleteComplaintArgs` | `deleteComplaint` mutation variables |
| `Operations.AdminSuggestionsQuery` | `adminSuggestions` query |
| `Types.QueryAdminSuggestionsArgs` | `adminSuggestions` query variables |
| `Operations.SubmitSuggestionMutation` | `submitSuggestion` mutation |
| `Types.MutationSubmitSuggestionArgs` | `submitSuggestion` mutation variables |
| `Operations.MarkSuggestionReviewedMutation` | `markSuggestionReviewed` mutation |
| `Types.MutationMarkSuggestionReviewedArgs` | `markSuggestionReviewed` mutation variables |

---

##### Step 5 — Verify TypeScript compilation

After codegen succeeds, verify that all new documents compile without errors:

```bash
~/.bun/bin/bun tsgo
```

This must pass with zero TypeScript errors. If errors occur, verify that:
1. The generated types match the expected naming convention.
2. The GraphQL operation names in the `gql` template literals match the TypedDocumentNode type parameters.
3. All imports resolve correctly from `@/frontend/graphql/generated/gql/`.

---

#### File Creation Order

Execute the steps in this exact order to satisfy incremental type-checking:

1. `frontend/graphql/sharedDocuments/complaint.documents.ts` — 5 documents (2 queries, 3 mutations)
2. `frontend/graphql/sharedDocuments/suggestion.documents.ts` — 3 documents (1 query, 2 mutations)
3. `frontend/graphql/sharedDocuments/index.ts` — add barrel exports

After creating each file, run the Quality Gate — Per-File Validation checklist before proceeding to the next file.

---

#### Test Execution Requirements

After completing all files and codegen, run the following to verify correctness:

```bash
~/.bun/bin/bun run generate:gqlSchema
~/.bun/bin/bun codegen
```

Verify TypeScript compilation:

```bash
~/.bun/bin/bun tsgo
```

If GraphQL integration tests exist for the complaint/suggestion domain:

```bash
~/.bun/bin/bun run test:graphql
```

---

#### Success Criteria

- [ ] `complaint.documents.ts` contains all 5 documents: `parentComplaintsQueryDocument`, `adminComplaintQueueQueryDocument`, `submitComplaintMutationDocument`, `respondToComplaintMutationDocument`, `deleteComplaintMutationDocument`
- [ ] `suggestion.documents.ts` contains all 3 documents: `adminSuggestionsQueryDocument`, `submitSuggestionMutationDocument`, `markSuggestionReviewedMutationDocument`
- [ ] All documents use correct TypedDocumentNode pattern with `Operations.*` and `Types.*` generated types
- [ ] All documents import from `"@apollo/client"` (not `"@apollo/client/core"`)
- [ ] All documents use generated types from `graphql-types.ts` and `operations.ts`
- [ ] All selection sets include `id` on every named object type
- [ ] No-arg query (`parentComplaints`) omits the second type parameter
- [ ] All documents are exported from `index.ts` in alphabetical order
- [ ] No DB/repo imports in any document file
- [ ] `bun run generate:gqlSchema` succeeds with zero errors
- [ ] `bun codegen` succeeds with zero errors
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] Generated types include all 8 new operations (3 queries + 5 mutations)

---

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
