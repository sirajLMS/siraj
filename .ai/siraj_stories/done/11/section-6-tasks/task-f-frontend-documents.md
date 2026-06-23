### Task F — Frontend GraphQL: Apollo TypedDocumentNode Queries & Mutations

**Objective:** Create Apollo `TypedDocumentNode` documents for all new GraphQL operations. Documents provide type-safe query/mutation definitions for Apollo `useQuery`/`useMutation` hooks.

**Dependencies:** Depends on Task E — Pothos schema is generated and codegen has run.

**Layer-Specific Rules (Frontend GraphQL — Flattened from frontend/graphql/AGENTS.md):**
- One file per domain: `*.documents.ts`
- Import from `"@apollo/client"` — never from `"@apollo/client/core"`
- TypedDocumentNode naming convention: `<camelCaseName>QueryDocument` / `<camelCaseName>MutationDocument`
- Every selection set must include `id` field on every named object type
- **NO DB/Repo Imports**: Frontend GraphQL can ONLY depend on generated types.

**Target Files:**
- `frontend/graphql/sharedDocuments/student-directory.documents.ts` — NEW (student directory query document)
- `frontend/graphql/sharedDocuments/staff-directory.documents.ts` — MODIFY (add manager directory query)
- `frontend/graphql/sharedDocuments/learning-resource.documents.ts` — NEW (resource list + upload documents)
- `frontend/graphql/sharedDocuments/index.ts` — MODIFY (add barrel exports)

---

**Detailed Implementation Steps:**

*Step 1: Create `student-directory.documents.ts`*

Create `frontend/graphql/sharedDocuments/student-directory.documents.ts` with a TypedDocumentNode for the student directory query. The document must include `id` on every object type. Use the pattern from existing `student.documents.ts` and `student-history.documents.ts`.

**Document structure:**
- Query name: `studentDirectory`
- Variables: `$paginationArgs: PaginationArgs`, `$filterArgs: StudentFilterArgs`, `$orderBy: [StudentsOrderByClause!]`
- Selection set: `rows { id, name, email, status, classesRemaining, classesTotal, hoursPerWeek, parentName, teacherName, createdAt }` and `totalCount`
- Export as: `studentDirectoryQueryDocument`

**Also define a fragment** for the row type to enable cache updates:
- Fragment name: `StudentDirectoryRowFragment`
- On type: `StudentDirectoryRow`
- Fields: all fields from the row

Use `as unknown as <GeneratedType>` cast following the existing project pattern. The exact generated type names will be available after running codegen in Task E.

---

*Step 2: Extend `staff-directory.documents.ts` with manager directory query*

Open `frontend/graphql/sharedDocuments/staff-directory.documents.ts` and add the manager directory query document. The existing file contains teacher directory documents — append the manager query.

**Document structure:**
- Query name: `managerDirectory`
- Variables: none (server returns all managers)
- Selection set: `{ id, staffProfileId, name, email, phone, skypeId, status, roleSlug, roleName }`
- Export as: `managerDirectoryQueryDocument`

---

*Step 3: Create `learning-resource.documents.ts`*

Create `frontend/graphql/sharedDocuments/learning-resource.documents.ts` with two documents:

**Query document:**
- Query name: `learningResources`
- Variables: `$searchQuery: String`
- Selection set: `{ id, displayName, filePath, uploadedByUserId, uploadedByUserName, fileSize, contentType, createdAt }`
- Export as: `learningResourcesQueryDocument`

**Mutation document:**
- Mutation name: `uploadLearningResource`
- Variables: `$input: ResourceUploadInput!`
- Selection set: `{ id, displayName, filePath, uploadedByUserId, uploadedByUserName, fileSize, contentType, createdAt }`
- Export as: `uploadLearningResourceMutationDocument`

**Fragment:**
- Fragment name: `LearningResourceRowFragment`
- On type: `LearningResourceRow`
- Fields: all fields above
- Export as: `learningResourceRowFragment`

---

*Step 4: Export from index.ts*

Update `frontend/graphql/sharedDocuments/index.ts` to export the new document files:

```typescript
export * from "./student-directory.documents";
export * from "./learning-resource.documents";
```

Place them alphabetically within existing exports.

---

*Step 5: Run codegen*

After saving all document files, run codegen to generate TypeScript types:

```bash
bun codegen
```

Verify generated types compile without errors.

**Test Execution Requirements:**
- Run codegen:
  ```bash
  bun codegen
  ```

**Success Criteria / Check Progress Points:**
- [ ] `studentDirectoryQueryDocument` created with `id` on every object type.
- [ ] `managerDirectoryQueryDocument` created with `id` on every object type.
- [ ] `learningResourcesQueryDocument` created with `id` on every object type.
- [ ] `uploadLearningResourceMutationDocument` created with `id` on returned object.
- [ ] All documents use generated types from codegen.
- [ ] All documents exported from `index.ts`.
- [ ] `bun codegen` succeeds with 0 errors.
- [ ] No DB/repo imports in frontend GraphQL files.

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
