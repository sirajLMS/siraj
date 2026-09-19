# Plan 20 — Testing & Quality: Tasks

## Document Info

| Field | Value |
|-------|-------|
| Feature | Certificate Testing & Quality Assurance |
| Plan # | 20 |
| Depends On | Plans 1–19 (all prior plans) |
| Related Docs | `MASTER_ARCHITECTURE.md`, `siraj_analysis/10-testing-quality-patterns.md`, `requirements.md`, `design.md` |

> **Execution Model**: Parallel subagents per independent task group (see dependency graph for parallelization points)

---

## Task Summary

| Task # | Task Name | Est. Hours | Depends On |
|--------|-----------|------------|------------|
| T1 | Extending entity-setup.ts with certificate helpers | 2–3 | Plans 1–3 (schema + repos) |
| T2 | Certificate repository tests (100% coverage) | 3–4 | T1 |
| T3 | Template repository tests | 2–3 | T1 |
| T4 | Template element repository tests | 2 | T1 |
| T5 | Template variable repository tests | 2 | T1 |
| T6 | Recipient group repository tests | 2–3 | T1 |
| T7 | Verification repository tests | 1–2 | T1 |
| T8 | Category repository tests | 2–3 | T1 |
| T9 | Database logic tests (generation, version, state machine) | 3–4 | T1–T8 |
| T10 | Generation pipeline service tests | 2–3 | T1, Plan 4 |
| T11 | Verification service tests | 2 | T1, Plan 4 |
| T12 | Template management service tests | 2–3 | T1, Plan 4 |
| T13 | Entity cache service tests | 2 | T1, Plan 4 |
| T14 | GraphQL certificate query integration tests | 3–4 | T1, Plan 5 |
| T15 | GraphQL template query integration tests | 2–3 | T1, Plan 5 |
| T16 | GraphQL certificate mutation integration tests | 3 | T1, Plan 5 |
| T17 | GraphQL template + group + category mutation tests | 3 | T1, Plan 5 |
| T18 | GraphQL auth scope + DataLoader tests | 2–3 | T14–T17 |
| T28 | Full quality gate + test execution verification | 2–3 | All above |

---

## T1: Extending entity-setup.ts with Certificate Helpers

**Estimated**: 2–3 hours | **Depends On**: Plans 1–3 | **Refs**: REQ-7.1, design.md §3.1

### Subtasks

- **T1.1**: Add `createTestCertificateCategory(tx, overrides?)` helper
  - File: `backend/db/test/entity-setup.ts` (modify)
  - Returns: `certificate_categories` row with defaults (name via `loc("Test Category", "فئة اختبار")`, slug auto-generated, isActive=true, sortOrder=0)
  - Verify helper signature matches `CertificateCategoryRepository.insert` params

- **T1.2**: Add `createTestCertificateTemplate(tx, overrides?)` helper
  - Returns: `certificate_templates` row with defaults (status=draft, version=1, name via `loc()`, dimensions from Plan 1 schema)
  - Auto-creates a user (teacher) if `createdByUserId` not in overrides

- **T1.3**: Add `createTestTemplateElement(tx, templateId, overrides?)` helper
  - Returns: `certificate_template_elements` row with defaults (type=static_text, position at origin, zIndex auto-incremented)
  - Accepts `templateId` as required parameter

- **T1.4**: Add `createTestTemplateVariable(tx, templateId, overrides?)` helper
  - Returns: `certificate_template_variables` row with defaults (type=text, isRequired=false, defaultValue=null)

- **T1.5**: Add `createTestRecipientGroup(tx, templateId, overrides?)` helper
  - Returns: `certificate_recipient_groups` row with defaults (name auto-generated, linked to template)

- **T1.6**: Add `createTestRecipientGroupItem(tx, groupId, studentId?, overrides?)` helper
  - Auto-creates a student (via `createTestStudent`) if `studentId` not supplied
  - Returns: `certificate_recipient_group_items` row

- **T1.7**: Add `createTestCertificate(tx, templateId, studentId, overrides?)` helper
  - Returns: `certificates` row with defaults (status=issued, verification code via `randomUUID()`, issueDate=now)
  - Auto-creates a template if `templateId` not supplied (full rig)

- **T1.8**: Add `createTestVerificationLog(tx, certificateId, overrides?)` helper
  - Returns: `certificate_verifications` row with defaults (result=valid, IP=`127.0.0.1`, userAgent=`test-agent`)

- **T1.9**: Add `setupCertificateTestEntities(tx, prefix)` composite helper
  - Orchestrates all above helpers: category → template → 2 elements → 2 variables → recipient group → group item → certificate → verification log
  - Returns object with all created entities

### Quality Loop (per file)
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/db/test/entity-setup.ts --lifecycle codescene
  ```

### Instruction Verification
- Read: `AGENTS.md` (root), `backend/db/test/AGENTS.md`, `backend/db/repo/AGENTS.md`
- Read: `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`
- Verify all helper signatures match column requirements (Rule 18: check schema columns before inserting)
- Verify `TestDb` union type used for `tx` parameter

---

## T2: Certificate Repository Tests (100% Coverage)

**Estimated**: 3–4 hours | **Depends On**: T1 | **Refs**: REQ-1.1

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T3, T4, T5, T6, T7, T8, T10, T11, T12, T13, T14, T15, T16, T17

### Subtasks

- **T2.1**: Create test file `backend/db/test/repo/cert/certificate.repository.test.ts`
  - Import `runInRollback` from `@/backend/db/test/test-utils`
  - Import `createTestCertificate`, `setupCertificateTestEntities` from `@/backend/db/test/entity-setup`
  - Import `getServerTranslations` from `@/shared/locale/server-graphql` for error substrings
  - Initialize `tErrors` in `beforeAll`

- **T2.2**: Write CRUD tests
  - Insert: create certificate, assert returned row has correct fields
  - findById: create then fetch by ID, assert match
  - update: create then update status, assert updated fields
  - softDelete: create then soft-delete, assert `deletedAt` set, assert excluded from default `findMany`

- **T2.3**: Write findMany tests
  - Pagination: insert N certificates, assert `findMany` returns correct page with `after` cursor
  - Search: insert certificates with known recipient names, assert FTS search returns matches
  - Filters: insert certificates with various statuses, assert filter by status returns correct subset
  - Date range filter: insert certificates with different issue dates, assert range filter works
  - Template filter: insert certificates for different templates, assert filter by templateId works

- **T2.4**: Write error path tests
  - Not found: `findById(randomUUID())` → assert error message contains `"not found"`
  - Version mismatch: update with wrong version → assert `"version mismatch"`
  - Duplicate verification code: insert two with same code → assert unique constraint error
  - Duplicate idempotency key: insert two with same key → assert error

- **T2.5**: Write status transition tests
  - draft → pending → issued → revoked (valid)
  - issued → draft (invalid, assert error)
  - revoked → issued (invalid, assert error)

### Coverage Verification
- Run: `bun run scripts/run-test/run-test.ts backend/db/test/repo/cert/certificate.repository.test.ts`
- Run coverage: `bun test --coverage backend/db/test/repo/cert/certificate.repository.test.ts`
- Verify 100% coverage on `CertificateRepository`

### Quality Loop
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/db/test/repo/cert/certificate.repository.test.ts --lifecycle codescene
  ```

### Instruction Verification
- Read: `AGENTS.md` (root), `backend/db/test/AGENTS.md`
- Read: `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`
- Verify Rule 1: all tests in `runInRollback`, all methods receive `tx`
- Verify Rule 3: no `rejects.toThrow()`, uses `expectRepoError` pattern
- Verify Rule 14: 100% coverage target

---

## T3: Template Repository Tests

**Estimated**: 2–3 hours | **Depends On**: T1 | **Refs**: REQ-1.2

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T4, T5, T6, T7, T8, T10, T11, T12, T13, T14, T15, T16, T17

### Subtasks

- **T3.1**: Create `backend/db/test/repo/cert/template.repository.test.ts`
  - Same import pattern as T2.1

- **T3.2**: Write CRUD tests
  - Insert, findById, update, softDelete

- **T3.3**: Write version chain tests
  - Create template (version=1) → publish → new version (version=2) → assert parent version link
  - Version number increment on republish
  - Find all versions of a template in order

- **T3.4**: Write status transition tests
  - draft → published
  - published → archived
  - archived → published (re-publish, new version)
  - Invalid transitions: draft → archived (skip publish)

- **T3.5**: Write findMany tests
  - Filter by status (draft, published, archived)
  - Filter by categoryId
  - Search by template name
  - Pagination

- **T3.6**: Write soft delete cascade tests
  - Soft delete template → assert elements and variables are also soft-deleted (or cascade per schema)

- **T3.7**: Write error path tests
  - Not found, version mismatch

### Quality Loop & Instruction Verification
Same pattern as T2.

---

## T4: Template Element Repository Tests

**Estimated**: 2 hours | **Depends On**: T1 | **Refs**: REQ-1.3

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T5, T6, T7, T8, T10, T11, T12, T13, T14, T15, T16, T17

### Subtasks

- **T4.1**: Create `backend/db/test/repo/cert/template-element.repository.test.ts`

- **T4.2**: Write CRUD tests
  - Insert element, findById, update, delete

- **T4.3**: Write findByTemplateId tests
  - Create template with N elements → assert all returned
  - Assert ordering by zIndex (element with zIndex=5 before zIndex=10)

- **T4.4**: Write type-specific tests
  - static_text: content field set and returned
  - data_text: variable binding field set
  - data_date: date format field set
  - image: URL and size fields set
  - qr_code: size field set
  - shape: type and dimension fields set

- **T4.5**: Write position field tests
  - x, y, width, height, rotation set correctly

- **T4.6**: Write error path tests
  - Not found, update non-existent element

### Quality Loop & Instruction Verification
Same pattern as T2.

---

## T5: Template Variable Repository Tests

**Estimated**: 2 hours | **Depends On**: T1 | **Refs**: REQ-1.4

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T6, T7, T8, T10, T11, T12, T13, T14, T15, T16, T17

### Subtasks

- **T5.1**: Create `backend/db/test/repo/cert/template-variable.repository.test.ts`

- **T5.2**: Write CRUD tests
  - Insert, findById, update, delete

- **T5.3**: Write findByTemplateId tests
  - Create template with N variables → assert all returned

- **T5.4**: Write type-specific tests
  - text: defaultValue as string
  - number: defaultValue as number
  - date: defaultValue as ISO date string
  - select: options array field, defaultValue must be one of options

- **T5.5**: Write test cases for the isRequired flag
  - isRequired=true: assert constraint behavior
  - isRequired=false: assert nullable behavior

- **T5.6**: Write error path tests
  - Not found, delete non-existent variable

### Quality Loop & Instruction Verification
Same pattern as T2.

---

## T6: Recipient Group Repository Tests

**Estimated**: 2–3 hours | **Depends On**: T1 | **Refs**: REQ-1.5

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T7, T8, T10, T11, T12, T13, T14, T15, T16, T17

### Subtasks

- **T6.1**: Create `backend/db/test/repo/cert/recipient-group.repository.test.ts`

- **T6.2**: Write CRUD tests on recipient_groups
  - Insert, findById, update, delete

- **T6.3**: Write findByTemplateId tests
  - Create template with N groups → assert all returned

- **T6.4**: Write student assignment tests
  - Add student to group → assert group item created
  - Remove student from group → assert group item deleted
  - Bulk add: assign N students in one operation → assert N items created
  - Duplicate assignment: assign same student twice → assert error or idempotent behavior

- **T6.5**: Write variable value tests
  - Set per-recipient variable value → assert stored
  - Find by group item ID → assert all variable values returned
  - Update variable value → assert updated

- **T6.6**: Write error path tests
  - Group not found, group item not found, student not found

### Quality Loop & Instruction Verification
Same pattern as T2.

---

## T7: Verification Repository Tests

**Estimated**: 1–2 hours | **Depends On**: T1 | **Refs**: REQ-1.6

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T8, T10, T11, T12, T13, T14, T15, T16, T17.

### Subtasks

- **T7.1**: Create `backend/db/test/repo/cert/verification.repository.test.ts`

- **T7.2**: Write createLog tests
  - Create verification log for a certificate → assert entry with correct fields
  - Result values: valid, invalid, revoked, expired
  - IP address and user agent captured

- **T7.3**: Write findByCertificateId tests
  - Create N logs for a certificate → assert returned in descending createdAt order
  - Empty result for certificate with no logs

- **T7.4**: Write error path tests
  - Create log for non-existent certificate ID → assert error

### Quality Loop & Instruction Verification
Same pattern as T2.

---

## T8: Category Repository Tests

**Estimated**: 2–3 hours | **Depends On**: T1 | **Refs**: REQ-1.7

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T7, T10, T11, T12, T13, T14, T15, T16, T17

### Subtasks

- **T8.1**: Create `backend/db/test/repo/cert/category.repository.test.ts`

- **T8.2**: Write CRUD tests
  - Insert, findById, update, softDelete

- **T8.3**: Write tree operation tests
  - Create root category → create child → assert `getChildren` returns child
  - Create 3-level hierarchy → assert `getDescendants` returns all descendants
  - `getAncestors` on deepest node → returns path to root
  - `getPath` returns full path string

- **T8.4**: Write reorder tests
  - Create siblings → reorder up → assert sortOrder changed
  - Reorder down → assert sortOrder changed
  - Reorder at boundary (first/last) → assert no-op or error

- **T8.5**: Write soft delete cascade tests
  - Delete parent category with children → assert children unassigned or cascaded per schema
  - Delete category with assigned templates → assert templates unassigned

- **T8.6**: Write error path tests
  - Not found, reorder non-existent, delete non-existent

### Quality Loop & Instruction Verification
Same pattern as T2.

---

## T9: Database Logic Tests (Generation, Version, State Machine)

**Estimated**: 3–4 hours | **Depends On**: T1–T8 | **Refs**: REQ-1.8

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T18.

### Subtasks

- **T9.1**: Create `backend/db/test/logic/cert/generation-logic.test.ts`
  - Test certificate generation transaction: template + recipient group item → certificate + verification code
  - Test idempotency: same idempotency key → returns existing certificate, no duplicate
  - Test batch generation: template + group with N students → N certificates created
  - Test variable substitution: template variables resolved from group item values
  - Test missing required variable → error
  - Test template not published → error

- **T9.2**: Create `backend/db/test/logic/cert/template-version-logic.test.ts`
  - Test publish flow: draft → published, version snapshot created
  - Test archive flow: published → archived, existing certificates unaffected
  - Test re-publish: archived → published, new version number
  - Test version history listing

- **T9.3**: Create `backend/db/test/logic/cert/state-machine-logic.test.ts`
  - Test certificate status state machine: legal transitions succeed
  - Test illegal transitions: draft → revoked (must go through issued first) → error
  - Test category tree integrity: delete parent → children behavior correct

### Quality Loop & Instruction Verification
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/db/test/logic/cert/generation-logic.test.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/db/test/logic/cert/template-version-logic.test.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/db/test/logic/cert/state-machine-logic.test.ts --lifecycle codescene
  ```
- Read: `backend/db/test/AGENTS.md` — verify `logic/` directory rules
- Verify Rule 11: `logic/` for business-logic workflows, `repo/` for isolation

---

## T10: Generation Pipeline Service Tests

**Estimated**: 2–3 hours | **Depends On**: T1, Plan 4 | **Refs**: REQ-2.1

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T7, T8, T11, T12, T13, T14, T15, T16, T17

### Subtasks

- **T10.1**: Create `backend/services/cert/test/generation.service.test.ts`
  - Test single generation: template + student input → certificate with PDF reference
  - Assert returned certificate has correct fields (templateId, studentId, status=issued, verificationCode)
  - Assert PDF render function called with correct parameters (mocked)

- **T10.2**: Write idempotency tests
  - Same idempotency key → returns existing certificate, no new creation
  - Count certificates before and after → assert no duplicate

- **T10.3**: Write batch generation tests
  - Template + recipient group with N students → N certificates
  - Partial failure: some students fail (missing variable) → assert successful ones created, errors collected

- **T10.4**: Write variable substitution tests
  - Template has variables "recipientName", "courseName" → group item has values → assert substitution in generated certificate
  - Missing required variable → assert error with `"required variable"` substring

- **T10.5**: Write error scenario tests
  - Template not found → assert error contains "not found"
  - Template not published → assert error contains "not published"
  - Recipient group empty → assert error contains "empty"
  - Already generated for same recipient → assert error contains "already generated"

### Quality Loop & Instruction Verification
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/services/cert/test/generation.service.test.ts --lifecycle codescene
  ```
- Read: `AGENTS.md` (root), `backend/services/AGENTS.md`
- Read: `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`

---

## T11: Verification Service Tests

**Estimated**: 2 hours | **Depends On**: T1, Plan 4 | **Refs**: REQ-2.2

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T7, T8, T10, T12, T13, T14, T15, T16, T17

### Subtasks

- **T11.1**: Create `backend/services/cert/test/verification.service.test.ts`
  - Test valid verification: existing, issued certificate → returns certificate details
  - Test revoked certificate: status=revoked → returns revoked indicator in result
  - Test expired certificate: status=expired → returns expired indicator
  - Test invalid code: non-existent verification code → returns not-found indicator

- **T11.2**: Write verification log creation tests
  - Each verification creates a log entry → query `certificate_verifications` to assert
  - Log contains IP, user agent, result, timestamp

- **T11.3**: Write public endpoint behavior tests
  - No auth required → service method callable without auth context
  - Rate limiting: multiple rapid requests → assert limited (if applicable)

- **T11.4**: Write error path tests
  - Expired code → error substring "expired"
  - Invalid code → error substring "invalid"

### Quality Loop & Instruction Verification
Same as T10.

---

## T12: Template Management Service Tests

**Estimated**: 2–3 hours | **Depends On**: T1, Plan 4 | **Refs**: REQ-2.3

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T7, T8, T10, T11, T13, T14, T15, T16, T17

### Subtasks

- **T12.1**: Create `backend/services/cert/test/template-management.service.test.ts`
  - Test publish: draft → published, assert version snapshot created
  - Test archive: published → archived, assert existing certificates unaffected (status unchanged)

- **T12.2**: Write re-publish tests
  - Archived → published, assert new version number
  - Version history: list all versions, assert ordered by version number

- **T12.3**: Write permission check tests
  - User with `certificate_templatemanage` permission → publish succeeds
  - User without permission → assert error (permission denied)
  - Use `createTestUser` + `createTestPermission` to set up permission scopes

- **T12.4**: Write version snapshot tests
  - Publish template with elements and variables → assert snapshot captures element positions, variable configs
  - Re-publish after editing elements → assert new snapshot differs from old

### Quality Loop & Instruction Verification
Same as T10.

---

## T13: Entity Cache Service Tests

**Estimated**: 2 hours | **Depends On**: T1, Plan 4 | **Refs**: REQ-2.4

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T7, T8, T10, T11, T12, T14, T15, T16, T17

### Subtasks

- **T13.1**: Create `backend/services/cert/test/certificate-cache.service.test.ts`
  - Test cache hit: fetch certificate by ID twice → assert repository called once (second from cache)
  - Test cache miss: first fetch → assert repository called

- **T13.2**: Write cache invalidation tests
  - Update certificate → assert cache entry invalidated, next fetch from repository
  - Delete certificate → assert cache entry removed

- **T13.3**: Write TTL expiry tests
  - Set short TTL → wait → assert stale entry refreshed from repository
  - Control TTL via mock configuration

- **T13.4**: Write batch loading (DataLoader) tests
  - Fetch N certificate IDs → assert single batch query (not N queries)
  - Assert repository `findByIds` called once with array of IDs

### Quality Loop & Instruction Verification
- Same as T10
- Mock repository namespace for deterministic cache behavior
- Verify EntityCacheService pattern per `docs/services/entity-cache-service.md`

---

## T14: GraphQL Certificate Query Integration Tests

**Estimated**: 3–4 hours | **Depends On**: T1, Plan 5 | **Refs**: REQ-3.1

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T7, T8, T10, T11, T12, T13, T15, T16, T17

### Subtasks

- **T14.1**: Create `frontend/common/graphql/test/cert/certificate-queries.test.ts`
  - Import `testClient`, `setupTestServerLifecycle`, `loginDemoUser`, `provisionTestEntities` from test helpers
  - Import TypedDocumentNode imports from `frontend/common/graphql/sharedDocuments/cert/`
  - Call `setupTestServerLifecycle()` at suite level

- **T14.2**: Write certificate list query tests
  - Login as admin → query certificate list with pagination → assert `edges`, `pageInfo`, `totalCount`
  - Filter by status → assert only certificates with that status returned
  - Filter by templateId → assert correct subset
  - Search by recipient name → assert matching certificates

- **T14.3**: Write single certificate detail query tests
  - Query by ID → assert all fields (recipient, template, status, issueDate, verificationCode)
  - Query non-existent ID → assert error in `result.error`

- **T14.4**: Write public verification query tests
  - No login required → query by verification code → assert certificate details returned
  - Invalid code → assert not-found state
  - Revoked code → assert revoked indicator
  - Expired code → assert expired indicator

- **T14.5**: Write auth scope tests
  - Unauthenticated → list query → assert `result.error` defined (private)
  - Unauthenticated → public verification query → assert data returned (public)

### Quality Loop & Instruction Verification
- Run: `bun run generate:gqlSchema` + `bun codegen` before tests (ensure document imports resolve)
- [ ] Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/graphql/test/cert/certificate-queries.test.ts --lifecycle codescene
  ```
- Read: `AGENTS.md` (root), `frontend/common/graphql/test/AGENTS.md`, `frontend/common/graphql/AGENTS.md`
- Read: `.agents/instructions/frontend.instructions.md`, `.agents/instructions/tests.instructions.md`
- Verify Rule 3: TypedDocumentNode imports, no raw string queries
- Verify Rule 5: assert on `result.error`, not `result.errors`

---

## T15: GraphQL Template Query Integration Tests

**Estimated**: 2–3 hours | **Depends On**: T1, Plan 5 | **Refs**: REQ-3.2

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T7, T8, T10, T11, T12, T13, T14, T16, T17

### Subtasks

- **T15.1**: Create `frontend/common/graphql/test/cert/template-queries.test.ts`

- **T15.2**: Write template list query tests
  - Login as admin → query template list with pagination → assert edges, pageInfo, totalCount
  - Filter by status → assert correct subset
  - Filter by categoryId → assert correct subset

- **T15.3**: Write single template detail query tests
  - Query by ID → assert template meta + elements + variables
  - Elements ordered by zIndex
  - Variables with type-specific fields

- **T15.4**: Write category tree query tests
  - Query category tree → assert full hierarchy
  - Assert templates assigned to categories nested correctly

- **T15.5**: Write auth scope tests
  - Draft templates only visible with `certificate_templatemanage` permission
  - Published templates visible to any authenticated user
  - Unauthenticated → template list → error

### Quality Loop & Instruction Verification
Same as T14.

---

## T16: GraphQL Certificate Mutation Integration Tests

**Estimated**: 3 hours | **Depends On**: T1, Plan 5 | **Refs**: REQ-3.3

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T7, T8, T10, T11, T12, T13, T14, T15, T17

### Subtasks

- **T16.1**: Create `frontend/common/graphql/test/cert/certificate-mutations.test.ts`

- **T16.2**: Write generate certificate mutation tests
  - Login as admin with `certificate_generate` permission
  - Single generation: provide templateId, recipientGroupItemId, variable overrides → assert certificate returned
  - Batch generation: provide templateId, recipientGroupId → assert N certificates returned

- **T16.3**: Write revoke certificate mutation tests
  - Login as admin with `certificate_revoke` permission
  - Revoke an issued certificate → assert status=revoked
  - Revoke already-revoked → assert error

- **T16.4**: Write auth scope tests
  - User without `certificate_generate` → generate mutation → assert error in `result.error`
  - User without `certificate_revoke` → revoke mutation → assert error
  - Unauthenticated → both mutations → assert error

### Quality Loop & Instruction Verification
Same as T14.

---

## T17: GraphQL Template + Group + Category Mutation Tests

**Estimated**: 3 hours | **Depends On**: T1, Plan 5 | **Refs**: REQ-3.4, REQ-3.5, REQ-3.6

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5, T6, T7, T8, T10, T11, T12, T13, T14, T15, T16

### Subtasks

- **T17.1**: Create `frontend/common/graphql/test/cert/template-mutations.test.ts`
  - Create template mutation → assert new template in draft status
  - Update template mutation → assert updated fields
  - Update template elements mutation → assert add/update/delete elements
  - Update template variables mutation → assert add/update/delete variables
  - Publish template mutation → assert status=published, version snapshot
  - Archive template mutation → assert status=archived
  - Auth scope: without `certificate_templatemanage` → error

- **T17.2**: Create `frontend/common/graphql/test/cert/recipient-group-mutations.test.ts`
  - Create recipient group → assert returned
  - Assign students to group → assert group items created
  - Set per-recipient variable values → assert values stored
  - Auth scope: without `certificate_recipientmanage` → error

- **T17.3**: Create `frontend/common/graphql/test/cert/category-mutations.test.ts`
  - Create category → assert returned
  - Update category → assert updated
  - Reorder category (move up/down) → assert sortOrder changed
  - Delete category (soft delete) → assert soft-deleted, children behavior
  - Auth scope: without `certificate_categorymanage` → error

### Quality Loop & Instruction Verification
Same as T14.

---

## T18: GraphQL Auth Scope + DataLoader Tests

**Estimated**: 2–3 hours | **Depends On**: T14–T17 | **Refs**: REQ-3.7, design.md §2.6

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T9.

### Subtasks

- **T18.1**: Create `frontend/common/graphql/test/cert/auth-scope.test.ts`
  - Consolidated test file for all cert permission-gated operations
  - For each mutation: login as user WITH permission → assert success; login as user WITHOUT → assert error
  - Public verification query without auth → assert success (public endpoint)

- **T18.2**: Create `frontend/common/graphql/test/cert/dataloader.test.ts`
  - Query certificate list with template → assert template loaded via DataLoader (batch)
  - Query certificate list with recipient → assert recipient batch-loaded
  - Nested: template → category → assert batch-loaded
  - Verify query depth: no circular resolution
  - Instrument DB query count to verify N+1 prevention (design DD-6)

### Quality Loop & Instruction Verification
Same as T14.

---

## T28: Full Quality Gate + Test Execution Verification

**Estimated**: 2–3 hours | **Depends On**: All above | **Refs**: AC-1 through AC-8

### Subtasks

- **T28.2**: Run full quality gate
  - `bun quality-gate` (tsgo → biome → lint → codescene → sonar)
  - If any stage fails, fix per `scripts/health/sub-loop.ts` per-file
  - Re-run `bun quality-gate` to resume from last failed stage

- **T28.3**: Run all test suites
  - `bun run test:db` — DB repository + logic tests (parallel runner)
  - `bun run test:services` — Service tests (parallel runner)
  - `bun run test:graphql` — GraphQL integration tests (shared dev server)

- **T28.4**: Verify coverage
  - Run: `bun test --coverage backend/db/test/repo/cert/` — verify 100% on all cert repo files
  - If below 100%, add missing test cases and re-run

- **T28.6**: Verify all acceptance criteria from requirements.md
  - Walk through AC-1 through AC-8 checklist
  - Document any incomplete items

### Quality Loop
- This IS the quality loop task — verify all gates pass

### Instruction Verification
- Read: `AGENTS.md` (root) — quality gate workflow
- Follow: per-file sub-loop via `bun run scripts/health/sub-loop.ts <path> --lifecycle codescene`
- Never run: `bun sonar-scan` (subagent prohibition — orchestrator only)

---

## Dependency Graph

```
T1 (entity-setup)
├── T2 (cert repo)         T3 (template repo)      T4 (element repo)
├── T5 (variable repo)     T6 (recipient repo)      T7 (verification repo)
├── T8 (category repo)
│   └── T9 (DB logic) ← depends on T2–T8
├── T10 (gen service)      T11 (verif service)
├── T12 (template svc)     T13 (cache service)
├── T14 (cert GraphQL Q)   T15 (template GraphQL Q)
├── T16 (cert GraphQL M)   T17 (template+group+cat M)
│   └── T18 (auth + DataLoader) ← depends on T14–T17
└── T28 (quality gate) ← depends on ALL
```

---

## Execution Order

**Execution order**: T1 → (T2, T3, T4, T5, T6, T7, T8, T10, T11, T12, T13, T14, T15, T16, T17 via parallel subagents after T1) → (T9, T18 via parallel subagents after Wave 2) → T28

### Phase A: Test Infrastructure (Sequential)
1. **T1** — Entity-setup helpers (blocks everything)
   - Run verification loop: `bun tsgo`, `bun biome:check`, lint queue client
   - Verify all helper signatures compile and type-check

### Phase B: DB Repository Tests (via parallel subagents after T1)
2. **T2, T3, T4, T5, T6, T7, T8** — All 7 repo test files (via parallel subagents)
   - Each independently: run `bun tsgo`, `bun biome:check`, lint queue client
   - Run `bun run scripts/run-test/run-test.ts <test-path>` for each file
   - Verify 100% coverage per file

### Phase C: DB Logic + Service Tests (via parallel subagents after Phase B)
3. **T9** — DB logic tests (depends on T2–T8)
4. **T10, T11, T12, T13** — Service tests (via parallel subagents, depend on T1)
   - Run `bun run scripts/run-test/run-test.ts <test-path>` for each

### Phase D: GraphQL Integration Tests (via parallel subagents after T1)
5. **T14, T15** — Query tests (via parallel subagents)
6. **T16, T17** — Mutation tests (via parallel subagents, after T14–T15 preferred but not required)
7. **T18** — Auth scope + DataLoader (after T14–T17)
   - Run `bun run generate:gqlSchema` + `bun codegen` before any GraphQL test
   - Run `bun run test:graphql` to verify all cert GraphQL tests

### Phase E: Quality Gate (Sequential, last)
9. **T28** — Full quality gate + test execution verification
    - Start lint queue server (background, detached)
    - `bun quality-gate` — resume from last failed stage if needed
    - Run all test suites to verify
    - Verify 100% coverage on DB repo tests
    - Walk through all acceptance criteria

---

## Parallel Subagent Strategy

Tasks grouped by wave (each wave runs as parallel subagents):

### Wave 1: T1
- Tasks: T1 (entity-setup helpers)
- Rationale: T1 blocks all other tasks — no other task can start until test infrastructure helpers exist

### Wave 2: T2, T3, T4, T5, T6, T7, T8, T10, T11, T12, T13, T14, T15, T16, T17
- Tasks: T2–T8 (DB repo tests), T10–T13 (service tests), T14–T17 (GraphQL integration tests)
- Rationale: All depend only on T1 (or external plans already completed). No interdependencies among these tasks — each can be dispatched to a separate subagent concurrently

### Wave 3: T9, T18
- Tasks: T9 (DB logic tests, depends on T2–T8), T18 (auth scope + DataLoader, depends on T14–T17)
- Rationale: All depend on Wave 2 tasks completing first. No interdependencies among Wave 3 tasks themselves — they can run as parallel subagents concurrently

### Final Wave: T28
- Task: T28 (full quality gate + test execution verification)
- Rationale: Must run after all other tasks complete — aggregates and verifies all tests

> **Subagent dispatch**: Each task in a wave is dispatched as a separate subagent. The orchestrator waits for all subagents in a wave to complete before starting the next wave.

---

## Knowledge Propagation (Deferred to Plan 21)

All knowledge propagation tasks are deferred to Plan 21 (Knowledge Propagation). This plan's T28 quality gate verifies the tests pass and the code is clean. Plan 21 will:
- Update `backend/db/test/AGENTS.md` with cert test directory references
- Update `frontend/common/graphql/test/AGENTS.md` with cert test directory reference
- Create `.ai/draft_plans/cert/plans/20-testing-quality/outcome/cert-testing-learnings.md` with outcomes from this plan (per the spec-driven-development skill outcome-protocol; `cert-testing-learnings.md` is a cross-task summary outcome doc)
- Update `.agents/instructions/tests.instructions.md` if cert-specific test patterns emerge
