### Task I — Frontend GraphQL: Apollo TypedDocumentNodes

**Objective:** Create Apollo `TypedDocumentNode` queries and mutations for the frontend to consume the new GraphQL operations.

**Dependencies:** Depends on Task H — backend GraphQL schema is generated and codegen has run.

**Layer-Specific Rules (Frontend GraphQL — Flattened from frontend/graphql/AGENTS.md):**
- TypedDocumentNode naming convention: `<camelCaseName>QueryDocument` / `<camelCaseName>MutationDocument`.
- Every selection set must include `id` field on every named object type.
- **🚫 NO DB/Repo Imports**: Frontend GraphQL can ONLY depend on generated types.

**Target Files:**
- `frontend/graphql/sharedDocuments/resource.documents.ts`
- `frontend/graphql/sharedDocuments/report.documents.ts`
- `frontend/graphql/sharedDocuments/index.ts`

**Detailed Implementation Steps:**

*Step 1: Modify `resource.documents.ts`*

Add the deletion mutation:
```typescript
// frontend/graphql/sharedDocuments/resource.documents.ts
import { graphql } from "../generated/gql";

// ... existing documents ...

export const deleteLearningResourceMutationDocument = graphql(`
  mutation DeleteLearningResource($id: ID!) {
    deleteLearningResource(id: $id)
  }
`);
```

*Step 2: Create `report.documents.ts`*

```typescript
// frontend/graphql/sharedDocuments/report.documents.ts
import { graphql } from "../generated/gql";

export const generateAttendanceReportQueryDocument = graphql(`
  query GenerateAttendanceReport($filters: AttendanceReportFiltersInput!) {
    generateAttendanceReport(filters: $filters) {
      id
      groupKey
      groupLabel
      takenClasses
      absentClasses
      leaveClasses
      pendingClasses
      totalHours
      paidEGP
      paidUSD
    }
  }
`);
```

*Step 3: Export from `index.ts`*

Open `frontend/graphql/sharedDocuments/index.ts` and add exports:
```typescript
export * from "./report.documents";
// ... (ensure resource.documents is exported)
```

*Step 4: Run codegen again*
After defining frontend fragments/documents, run codegen so Apollo can generate types for the document nodes themselves.

**Test Execution Requirements:**
- Run codegen:
  ```bash
  bun codegen
  ```

**Success Criteria / Check Progress Points:**
- [ ] `deleteLearningResourceMutationDocument` is created.
- [ ] `generateAttendanceReportQueryDocument` is created and includes `id` on the output object.
- [ ] `bun codegen` succeeds.

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
