### Task G — GraphQL Integration Tests: Permission Enforcement for New Operations

**Objective:** Write GraphQL integration tests for all new queries and mutations. Each test verifies authorized success and unauthorized denial, covering security threats from Section 4.

**Dependencies:** Depends on Task F — frontend GraphQL documents are created and codegen has run.

**Layer-Specific Rules (Testing — Flattened from AGENTS_STORY_PLANNING.md Section 1.7):**
- **Authorized success + unauthorized denial** — Every new GraphQL query/mutation must have at least one test for authorized success and one test for unauthorized denial.
- **Security threat coverage** — Each threat from Section 4 must have a corresponding GraphQL-level test case.

**Target Files:**
- `frontend/graphql/test/student-directory-graphql.test.ts` — NEW
- `frontend/graphql/test/manager-directory-graphql.test.ts` — NEW
- `frontend/graphql/test/learning-resource-graphql.test.ts` — NEW

---

**Detailed Implementation Steps:**

*Step 1: Create `student-directory-graphql.test.ts`*

Tests for `studentDirectory` query covering Section 4 Threat 1 (IDOR on Student Directory):

- **Test: Academy Admin can query student directory** — Authenticated as Academy Admin (holds `students.list`), execute `studentDirectoryQueryDocument`. Verify: returns rows with `parentName`, `teacherName`, `status` fields. `totalCount > 0`.
- **Test: Staff Default can query student directory** — Authenticated as Staff Default (holds `students.list`), execute query. Verify: returns rows successfully.
- **Test: Teacher denied from student directory** — Authenticated as Teacher (does NOT hold `students.list`), execute query. Verify: returns GraphQL error with `FORBIDDEN` or `UNAUTHORIZED` extension code.
- **Test: Parent denied from student directory** — Authenticated as Parent (does NOT hold `students.list`), execute query. Verify: returns GraphQL error.
- **Test: Unauthenticated request denied** — No auth token, execute query. Verify: returns `UNAUTHENTICATED` error.

*Step 2: Create `manager-directory-graphql.test.ts`*

Tests for `managerDirectory` query and `updateManagerProfile` mutation covering Section 4 Threat 2 (Privilege Escalation):

- **Test: Super Admin can query manager directory** — Authenticated as Super Admin (holds `staff.view_directory`), execute `managerDirectoryQueryDocument`. Verify: returns rows with `name`, `email`, `roleSlug`.
- **Test: Academy Admin can query manager directory** — Authenticated as Academy Admin (holds `staff.view_directory`), execute query. Verify: returns rows.
- **Test: Teacher denied from manager directory** — Authenticated as Teacher (does NOT hold `staff.view_directory`), execute query. Verify: returns error.
- **Test: Super Admin can update any manager profile** — Authenticated as Super Admin, execute `updateManagerProfileMutationDocument` on a Staff Default user. Verify: mutation succeeds, returns updated profile.
- **Test: Academy Admin denied from updating Super Admin profile** — Authenticated as Academy Admin, attempt to update Super Admin's profile. Verify: returns `FORBIDDEN` error (hierarchical constraint).
- **Test: Academy Admin can update Staff Default profile** — Authenticated as Academy Admin, update a Staff Default user's profile. Verify: mutation succeeds.
- **Test: Updating non-existent profile returns error** — Execute mutation with invalid `staffProfileId`. Verify: returns `NOT_FOUND` error.

*Step 3: Create `learning-resource-graphql.test.ts`*

Tests for `learningResources` query and `uploadLearningResource` mutation covering Section 4 Threats 3 and 4:

- **Test: Teacher can query learning resources** — Authenticated as Teacher (holds `resources.list`), execute `learningResourcesQueryDocument`. Verify: returns rows with `displayName`, `filePath`, `createdAt`.
- **Test: Academy Admin can query learning resources** — Authenticated as Academy Admin (holds `resources.list`), execute query. Verify: returns rows.
- **Test: Academy Admin can upload resource** — Authenticated as Academy Admin (holds `resources.upload`), execute `uploadLearningResourceMutationDocument`. Verify: mutation succeeds, returns created resource with `id`.
- **Test: Teacher denied from uploading resource** — Authenticated as Teacher (holds `resources.list` but NOT `resources.upload`), execute upload mutation. Verify: returns `FORBIDDEN` error.
- **Test: Parent denied from resource directory** — Authenticated as Parent (no resource permissions), execute query. Verify: returns error.
- **Test: Upload with missing displayName returns validation error** — Execute upload mutation with empty `displayName`. Verify: returns `VALIDATION_ERROR`.

**Test Execution Requirements:**
- Run GraphQL tests:
  ```bash
  bun run test:graphql
  ```

**Success Criteria / Check Progress Points:**
- [ ] `studentDirectory` query has authorized (Academy Admin, Staff Default) and unauthorized (Teacher, Parent) tests.
- [ ] `managerDirectory` query has authorized and unauthorized tests.
- [ ] `updateManagerProfile` mutation tests hierarchical privilege checks (Super Admin vs Academy Admin).
- [ ] `learningResources` query has authorized (Teacher, Academy Admin) and unauthorized (Parent) tests.
- [ ] `uploadLearningResource` mutation has authorized (Academy Admin) and unauthorized (Teacher) tests.
- [ ] All Section 4 threats have corresponding test cases.
- [ ] `bun run test:graphql` passes with 0 failures.

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
