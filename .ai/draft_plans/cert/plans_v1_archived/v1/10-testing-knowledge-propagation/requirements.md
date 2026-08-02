# Requirements: Testing & Knowledge Propagation (Plan 10)

## Document Information

- **Feature Name**: Certificate Testing, Documentation & Knowledge Propagation
- **Plan Number**: 10 (Testing & Knowledge Propagation)
- **Target Directory**: `.ai/draft_plans/cert/plans/10-testing-knowledge-propagation`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/10-testing-knowledge-propagation/outcome`
- **Version**: 1.0
- **Date**: 2026-08-01
- **Author**: Siraj Development Team
- **Stakeholders**: All teams — this plan cross-cuts every layer
- **Related Documents**:
  - [Design](./design.md)
  - [Tasks](./tasks.md)
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/10-testing-quality-patterns.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/01-db-schema-patterns.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/03-repository-patterns.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md`
- **Depends On**: Plans 01–09 (ALL preceding plans must be complete)
  - Plan 01 (DB Schema & Enums) — provides tables, enums, relations
  - Plan 02 (Types & Permissions) — provides canonical type definitions
  - Plan 03 (Repository Layer) — provides repository namespaces + methods
  - Plan 04 (Services & Business Logic) — provides service namespaces
  - Plan 05 (GraphQL API) — provides queries, mutations, subscriptions
  - Plan 06 (PDF Rendering Engine) — provides rendering pipeline
  - Plan 07 (Template Management UI) — provides frontend template views
  - Plan 08 (Cert Generation & Verification UI) — provides frontend cert views
  - Plan 09 (i18n & Navigation) — provides translation namespaces + routes

---

## Introduction

This plan covers the **final cross-cutting layer**: comprehensive testing across all certificate domains and knowledge propagation to documentation, AGENTS.md files, and instruction files. It validates that every repository, service, and GraphQL endpoint from Plans 01–09 functions correctly and that future developers/AI agents have canonical reference documentation to continue building on the certificate feature without re-discovering patterns.

### Feature Summary

Create 7 repository test suites (100% coverage), 4 service test suites, 2 GraphQL integration test suites, i18n completeness validation, 4 canonical documentation files in `docs/certificates/`, update 11 layer AGENTS.md files with certificate-specific rules, update root AGENTS.md references, and update skills/instruction files. Produce a knowledge propagation outcome file for future agents.

### Business Value

- **Quality assurance**: 100% repository coverage and comprehensive service/GraphQL testing ensures the certificate feature is production-ready
- **Knowledge retention**: Canonical documentation prevents pattern re-discovery by future agents and developers
- **Onboarding**: New team members can self-learn the certificate architecture via `docs/certificates/`
- **Maintenance**: AGENTS.md updates ensure AI tools (Copilot, agents) follow established certificate conventions
- **Regression prevention**: Comprehensive test suites catch regressions before they reach production

### Scope

**In Scope:**
- Repository tests for all 7 certificate repositories (100% coverage required)
- Service tests for 4 certificate services (generation, verification, template, recipient)
- GraphQL integration tests (queries + mutations + auth scope)
- i18n completeness tests (all `cert.*` translation keys in `ar` and `en`)
- Documentation: 4 canonical reference files in `docs/certificates/`
- AGENTS.md updates: 11 layer files + root
- Instruction file updates: `backend.instructions.md`, `frontend.instructions.md`, `tests.instructions.md`
- Knowledge propagation outcome file
- Quality validation (tsgo, biome, lint — zero errors)

**Out of Scope:**
- UI component tests (covered by Plan 07/08 execution)
- E2E tests (covered by Plan 07/08 execution)
- Seed data creation (covered by Plan 01)
- Performance/load testing
- Security penetration testing

---

## Requirements (EARS Format)

### REQ-10-00: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria

1. **WHEN** an executing agent starts any task **THEN** the system **SHALL** read ALL existing outcome files in `.ai/draft_plans/cert/plans/10-testing-knowledge-propagation/outcome/` to absorb prior research, search results, and pitfalls.
2. **WHEN** an executing agent completes any task **THEN** the system **SHALL** write a new outcome document under `.ai/draft_plans/cert/plans/10-testing-knowledge-propagation/outcome/<task-id>-outcome.md` detailing research findings, implementation details, and carry-over points.
3. **WHEN** an executing agent completes any subtask **THEN** the system **SHALL** update the corresponding task checkbox `[ ]` → `[x]` in `tasks.md`.
4. **WHEN** any file is modified **THEN** the system **SHALL** execute per-file verification (`tsgo` + `biome` + `lint-queue`) on that specific file.
5. **WHEN** any subtask is completed **THEN** the system **SHALL** execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

---

### REQ-10-01: Certificate Repository Tests (CertificateRepository)

**User Story:** As a developer, I want 100% test coverage for the CertificateRepository, so that all data access methods are verified against the live database via rolled-back transactions.

#### Acceptance Criteria

1. **WHEN** the certificate repository test suite is created **THEN** the system **SHALL** place it at `backend/db/test/repo/certificates/certificate.repository.test.ts`.
2. **WHEN** testing `findById` **THEN** the system **SHALL** test: returns existing record, returns null for non-existent ID, returns null for soft-deleted record.
3. **WHEN** testing `findMany` **THEN** the system **SHALL** test: no-filter returns all non-deleted certificates, filter by `status` returns matching records, filter by `templateId` returns matching records, filter by `studentId` returns matching records, pagination cursor returns correct page slice, combined filters work correctly.
4. **WHEN** testing `create` **THEN** the system **SHALL** test: successful insert returns mapped DTO, idempotency key collision returns existing record (no duplicate), all required fields are persisted.
5. **WHEN** testing `update` **THEN** the system **SHALL** test: successful update returns updated record, update on non-existent ID throws error with translated message, update on soft-deleted record throws error.
6. **WHEN** testing `softDelete` **THEN** the system **SHALL** test: record gets `deletedAt` set, subsequent `findById` returns null, audit log entry is created.
7. **WHEN** testing `findByIdempotencyKey` **THEN** the system **SHALL** test: returns record when key exists, returns null when key does not exist.
8. **IF** any test uses `runInRollback` **THEN** the system **SHALL** pass `tx` to EVERY repository method call AND every Drizzle query in the test body.
9. **IF** a test expects an error **THEN** the system **SHALL** use a try/catch helper (e.g., `expectRepoError`) and assert on `.toContain()` with a translated-message substring, NEVER `expect(...).rejects.toThrow()`.
10. **WHEN** test coverage is measured **THEN** the repository test **SHALL** achieve 100% statement coverage for `certificate.repository.ts` (verified via `bun test --coverage`).

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 01 (schema), Plan 03 (repository implementation)
- **Test Runner**: `bun run scripts/run-test/run-test.ts backend/db/test/repo/certificates/certificate.repository.test.ts`
- **AGENTS.md**: `backend/db/repo/AGENTS.md`, `backend/db/test/AGENTS.md`

---

### REQ-10-02: Certificate Repository Tests (TemplateRepository)

**User Story:** As a developer, I want 100% test coverage for the TemplateRepository, so that template CRUD and version management methods are verified.

#### Acceptance Criteria

1. **WHEN** the template repository test suite is created **THEN** the system **SHALL** place it at `backend/db/test/repo/certificates/certificate-template.repository.test.ts`.
2. **WHEN** testing `findById` **THEN** the system **SHALL** test: returns existing template, returns null for non-existent ID, returns null for soft-deleted template.
3. **WHEN** testing `findMany` **THEN** the system **SHALL** test: no-filter returns all non-deleted templates, filter by `categoryId`, filter by `status`, pagination, combined filters.
4. **WHEN** testing `create` **THEN** the system **SHALL** test: successful insert with all design properties (orientation, width, height, background color, font family), LocalizedString name is persisted correctly.
5. **WHEN** testing `update` **THEN** the system **SHALL** test: successful update, non-existent ID throws error, soft-deleted record throws error.
6. **WHEN** testing `softDelete` **THEN** the system **SHALL** test: `deletedAt` is set, subsequent queries exclude the record.
7. **WHEN** testing `publishVersion` **THEN** the system **SHALL** test: creates a new `certificate_template_versions` row with correct `version` number (incremented), stores `elementSnapshot` as jsonb, sets `publishedAt` and `publishedByUserId`, advances parent template `status` to `PUBLISHED`.
8. **WHEN** testing `findPublishedVersion` **THEN** the system **SHALL** test: returns the latest published version for a template, returns null if no published version exists, returns null if template is soft-deleted.
9. **WHEN** testing FEATURE 6 outcome methods (`findOutcomesByTemplateId`, `createOutcome`, `updateOutcome`, `deleteOutcome`) **THEN** the system **SHALL** test each method's happy path and error path.
10. **WHEN** test coverage is measured **THEN** the repository test **SHALL** achieve 100% statement coverage for `certificate-template.repository.ts`.

#### Additional Details
- **Priority**: High
- **Complexity**: High (version management adds complexity)
- **Dependencies**: Plan 01 (schema), Plan 03 (repository implementation)
- **Test Runner**: `bun run scripts/run-test/run-test.ts backend/db/test/repo/certificates/certificate-template.repository.test.ts`
- **AGENTS.md**: `backend/db/repo/AGENTS.md`, `backend/db/test/AGENTS.md`

---

### REQ-10-03: Certificate Repository Tests (Remaining Repositories)

**User Story:** As a developer, I want 100% test coverage for all remaining certificate repositories, so that template elements, variables, recipient groups, verifications, and categories are fully tested.

#### Acceptance Criteria

1. **WHEN** the `template-element.repository.test.ts` is created **THEN** the system **SHALL** test: `findById`, `findByTemplateId` (returns elements for a template ordered by z_index), `create` (TEXT, IMAGE, QR_CODE, SIGNATURE, SHAPE element types), `update` (position/size/config changes), `softDelete`, `reorder` (updates `zIndex` and `sortOrder`).
2. **WHEN** the `template-variable.repository.test.ts` is created **THEN** the system **SHALL** test: `findById`, `findByTemplateId` (returns variables ordered by `sortOrder`), `create` (TEXT, DATE, NAME, EMAIL, CUSTOM types), `update`, `softDelete`, unique `(templateId, key)` constraint violation returns existing.
3. **WHEN** the `recipient-group.repository.test.ts` is created **THEN** the system **SHALL** test: `findById`, `findMany` (filter by `templateId`), `create` (with `studentIds` array), `update` (add/remove students from array), `softDelete`, `findStudentsInGroup` (returns joined student records).
4. **WHEN** the `verification.repository.test.ts` is created **THEN** the system **SHALL** test: `create` (records verification event with IP/UA), `findByCertificateId` (returns verification history for a certificate), `findByVerificationCode` (returns certificate + verification event), `countVerificationsByCertificate` (returns count).
5. **WHEN** the `category.repository.test.ts` is created **THEN** the system **SHALL** test: `findById`, `findMany` (hierarchical — parent/children), `create` (root and sub-category), `update`, `softDelete` (parent soft-delete sets children `parentId` to NULL), `findChildren` (returns direct children of a category).
6. **WHEN** test coverage is measured **THEN** each repository test **SHALL** achieve 100% statement coverage for its respective repository file.
7. **IF** any test uses `runInRollback` **THEN** the system **SHALL** pass `tx` to ALL repository method calls AND use the try/catch error pattern.
8. **WHEN** test data is needed **THEN** the system **SHALL** create all test data via `entity-setup.ts` helpers (`createTestUser`, `createTestStudent`, etc.), NEVER querying seed data.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 01 (schema), Plan 03 (repository implementation)
- **Files**: 5 test files in `backend/db/test/repo/certificates/`
- **AGENTS.md**: `backend/db/repo/AGENTS.md`, `backend/db/test/AGENTS.md`

---

### REQ-10-04: TemplateManagementService Tests

**User Story:** As a developer, I want comprehensive tests for the TemplateManagementService, so that template CRUD, publish, archive, and version snapshot workflows are verified.

#### Acceptance Criteria

1. **WHEN** the template management service test suite is created **THEN** the system **SHALL** place it at `backend/db/test/logic/certificates/template-management.service.test.ts`.
2. **WHEN** testing `create` **THEN** the system **SHALL** test: successful template creation with variables, returns template with `status: DRAFT` and `version: 1`, validation error when name is too short (< 3 chars), validation error for invalid layout config, insufficient permissions error.
3. **WHEN** testing `update` **THEN** the system **SHALL** test: successful update of template properties, update of template variables (add/modify/remove), returns updated template with all relations, error on non-existent template.
4. **WHEN** testing `publish` **THEN** the system **SHALL** test: creates version snapshot with `elementSnapshot` jsonb, advances `status` to `PUBLISHED`, sets `publishedAt` and `publishedByUserId`, subsequent `findPublishedVersion` returns the snapshot, cannot publish an already-published template without changes (version increments correctly).
5. **WHEN** testing `archive` **THEN** the system **SHALL** test: sets `status` to `ARCHIVED`, archived templates cannot generate new certificates (service-level check), archived templates still appear in listing with filter.
6. **WHEN** testing version snapshot **THEN** the system **SHALL** verify: snapshot captures all element positions/configs at publish time, snapshot is immutable after creation, multiple versions increment correctly (v1 → v2 → v3).
7. **IF** any test requires a database transaction **THEN** the system **SHALL** use `runInRollback` and pass `tx` to ALL repository and service method calls.
8. **WHEN** error messages are asserted **THEN** the system **SHALL** assert on translated message substrings (e.g., "not found", "invalid"), NEVER raw translation keys.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 04 (service implementation), Plan 03 (repository layer)
- **Test Runner**: `bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/template-management.service.test.ts`
- **AGENTS.md**: `backend/services/AGENTS.md`, `backend/db/test/logic/AGENTS.md`

---

### REQ-10-05: CertificateGenerationService Tests

**User Story:** As a developer, I want comprehensive tests for the CertificateGenerationService, so that generation orchestration, idempotency, error scenarios, and revocation are verified.

#### Acceptance Criteria

1. **WHEN** the certificate generation service test suite is created **THEN** the system **SHALL** place it at `backend/db/test/logic/certificates/certificate-generation.service.test.ts`.
2. **WHEN** testing `generateCertificate` happy path **THEN** the system **SHALL** test: valid template (PUBLISHED), valid recipient group with students, variables resolved correctly, certificate created with `status: ISSUED`, `verificationCode` generated, `idempotencyKey` set, audit log created.
3. **WHEN** testing `generateCertificate` idempotency **THEN** the system **SHALL** test: second call with same `idempotencyKey` returns the SAME certificate (no duplicate), no side-effects on second call, verification code unchanged.
4. **WHEN** testing `generateCertificate` with missing template **THEN** the system **SHALL** test: throws error with translated message containing "template" and "not found".
5. **WHEN** testing `generateCertificate` with unpublished template **THEN** the system **SHALL** test: throws error with translated message indicating template must be published (contains "published" or "unpublished").
6. **WHEN** testing `generateCertificate` with empty recipient group **THEN** the system **SHALL** test: throws error with translated message indicating recipient group is empty.
7. **WHEN** testing `revokeCertificate` **THEN** the system **SHALL** test: sets `status` to `REVOKED`, sets `revokedAt` and `revocationReason`, subsequent `verifyCertificate` returns `REVOKED` status, cannot revoke an already-revoked certificate (throws error).
8. **WHEN** testing FEATURE 6 outcome/progress methods (`updateProgress`) **THEN** the system **SHALL** test: upsert on `(studentId, outcomeId)` works correctly, existing progress is updated (not duplicated).
9. **IF** tests require database transactions **THEN** the system **SHALL** use `runInRollback` and pass `tx` to ALL method calls.
10. **WHEN** error messages are asserted **THEN** the system **SHALL** use the try/catch helper pattern, NOT `expect(...).rejects.toThrow()`.

#### Additional Details
- **Priority**: High
- **Complexity**: High (orchestration across multiple services + repos)
- **Dependencies**: Plan 04 (service implementation), Plan 03 (repository), Plan 06 (PDF rendering may be mocked/stubbed)
- **Test Runner**: `bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/certificate-generation.service.test.ts`
- **AGENTS.md**: `backend/services/AGENTS.md`, `backend/db/test/logic/AGENTS.md`

---

### REQ-10-06: CertificateVerificationService Tests

**User Story:** As a developer, I want comprehensive tests for the CertificateVerificationService, so that verification logic for valid, expired, revoked, and not-found certificates is verified.

#### Acceptance Criteria

1. **WHEN** the certificate verification service test suite is created **THEN** the system **SHALL** place it at `backend/db/test/logic/certificates/certificate-verification.service.test.ts`.
2. **WHEN** testing `verifyCertificate` with a valid certificate **THEN** the system **SHALL** test: returns status `VALID`, returns certificate details (recipient name, issue date, template name), does NOT expose PII beyond what the template allows, does NOT require authentication.
3. **WHEN** testing `verifyCertificate` with an expired certificate **THEN** the system **SHALL** test: returns status `EXPIRED`, returns certificate details with expiry information, does NOT throw an error (graceful degradation).
4. **WHEN** testing `verifyCertificate` with a revoked certificate **THEN** the system **SHALL** test: returns status `REVOKED`, includes revocation reason if present, does NOT throw an error.
5. **WHEN** testing `verifyCertificate` with a non-existent verification code **THEN** the system **SHALL** test: returns status `INVALID` (graceful) or throws a not-found error with translated message — the service design determines which; the test must verify the chosen behavior.
6. **WHEN** testing `verifyCertificate` with a soft-deleted certificate **THEN** the system **SHALL** test: returns `INVALID` status (soft-deleted certificates are not verifiable).
7. **WHEN** testing `logVerification` **THEN** the system **SHALL** test: verification event is persisted with `ipAddress`, `userAgent`, `verifiedAt`, certificate linkage, `verifiedByUserId` is NULL for public (unauthenticated) verification.
8. **WHEN** testing with an authenticated user verifying **THEN** the system **SHALL** test: `verifiedByUserId` is set to the user's ID.
9. **IF** tests require database transactions **THEN** the system **SHALL** use `runInRollback` and pass `tx` to ALL method calls.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 04 (service implementation), Plan 03 (repository)
- **Test Runner**: `bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/certificate-verification.service.test.ts`
- **AGENTS.md**: `backend/services/AGENTS.md`, `backend/db/test/logic/AGENTS.md`

---

### REQ-10-07: RecipientGroupService Tests

**User Story:** As a developer, I want comprehensive tests for the RecipientGroupService, so that recipient group creation, student assignment, and variable resolution are verified.

#### Acceptance Criteria

1. **WHEN** the recipient group service test suite is created **THEN** the system **SHALL** place it at `backend/db/test/logic/certificates/recipient-group.service.test.ts`.
2. **WHEN** testing `create` **THEN** the system **SHALL** test: creates group with name and template association, empty `studentIds` is valid (group with no students), returns mapped DTO.
3. **WHEN** testing `assignStudents` **THEN** the system **SHALL** test: adds students to the group's `studentIds` array, non-existent student IDs are filtered out (service-level validation), duplicate student IDs are not added twice.
4. **WHEN** testing `removeStudents` **THEN** the system **SHALL** test: removes specified students from `studentIds` array, removing non-existent student ID is a no-op.
5. **WHEN** testing `resolveVariables` **THEN** the system **SHALL** test: resolves template variables (TEXT, DATE, NAME, EMAIL, CUSTOM) for each student in the group, uses student profile data for NAME/EMAIL resolution, falls back to `defaultValue` when student data is missing, excludes revoked/expired students from resolution.
6. **IF** tests require database transactions **THEN** the system **SHALL** use `runInRollback` and pass `tx` to ALL method calls.
7. **WHEN** error messages are asserted **THEN** the system **SHALL** assert on translated message substrings.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 04 (service implementation), Plan 03 (repository)
- **Test Runner**: `bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/recipient-group.service.test.ts`
- **AGENTS.md**: `backend/services/AGENTS.md`, `backend/db/test/logic/AGENTS.md`

---

### REQ-10-08: GraphQL Integration Tests — Queries

**User Story:** As a developer, I want GraphQL integration tests for certificate queries, so that list, detail, and public verification endpoints are verified against the running dev server.

#### Acceptance Criteria

1. **WHEN** the GraphQL query test suite is created **THEN** the system **SHALL** place it at `frontend/common/graphql/test/certificates/certificate-query.test.ts`.
2. **WHEN** testing the `certificates` query (list) **THEN** the system **SHALL** test: authenticated admin can list certificates, returns paginated results with `totalCount`, unauthorized request returns `result.error` with permission denied message, results respect `status` and `templateId` filters.
3. **WHEN** testing the `certificate` query (by ID) **THEN** the system **SHALL** test: authenticated admin can fetch a single certificate by ID, returns all certificate fields (recipientName, status, verificationCode, issuedAt), non-existent ID returns error or null (per GraphQL schema design).
4. **WHEN** testing the `verifyCertificate` query (public) **THEN** the system **SHALL** test: NO authentication required (public endpoint), valid verification code returns certificate details + `status: VALID`, expired certificate returns `status: EXPIRED`, revoked certificate returns `status: REVOKED`, invalid code returns `status: INVALID` or error, `result.data` is populated (not `result.error`).
5. **WHEN** tests use the test client **THEN** the system **SHALL** use `testClient` from `@/frontend/common/graphql/test/testClient`, with `errorPolicy: "all"` (so `result.error` is used, not thrown).
6. **WHEN** tests need authentication **THEN** the system **SHALL** use `loginAndProvision` / `authenticatedRequest` from `@/frontend/common/graphql/test/helpers`.
7. **WHEN** tests need a running server **THEN** the system **SHALL** use `setupTestServerLifecycle()` at the root of the `describe` block.
8. **WHEN** tests use GraphQL documents **THEN** the system **SHALL** import `TypedDocumentNode` from `@/frontend/common/graphql/sharedDocuments/certificates/` (generated via `bun codegen`).
9. **IF** test assertions check for errors **THEN** the system **SHALL** assert on `result.error` (not `result.errors`), because the client uses `errorPolicy: "all"`.
10. **WHEN** the test is run **THEN** the system **SHALL** use `bun run test:graphql` or `bun run scripts/run-test/run-test.ts` for execution.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 05 (GraphQL API), Plans 01–04 (backend layers)
- **AGENTS.md**: `frontend/common/graphql/test/AGENTS.md`, `frontend/common/graphql/AGENTS.md`
- **Pre-requisite**: `bun run generate:gqlSchema` + `bun codegen` must complete before tests run

---

### REQ-10-09: GraphQL Integration Tests — Mutations

**User Story:** As a developer, I want GraphQL integration tests for certificate mutations, so that generate, revoke, template CRUD, and publish mutations are verified with proper auth scope gating.

#### Acceptance Criteria

1. **WHEN** the GraphQL mutation test suite is created **THEN** the system **SHALL** place it at `frontend/common/graphql/test/certificates/certificate-mutation.test.ts`.
2. **WHEN** testing `generateCertificate` mutation **THEN** the system **SHALL** test: authenticated admin with `CERTIFICATES_GENERATE` permission succeeds, returns certificate with `status: ISSUED` and `verificationCode`, unauthorized user gets `result.error` with insufficient permissions, idempotent call returns the same certificate, missing template ID returns validation error.
3. **WHEN** testing `revokeCertificate` mutation **THEN** the system **SHALL** test: authenticated admin with `CERTIFICATES_REVOKE` permission succeeds, certificate `status` becomes `REVOKED`, revoking a non-existent certificate returns error, revoking an already-revoked certificate returns error, unauthorized user gets permission error.
4. **WHEN** testing `createTemplate` mutation **THEN** the system **SHALL** test: authenticated admin with `CERTIFICATES_MANAGE_TEMPLATE` permission succeeds, returns template with `status: DRAFT`, unauthorized user gets permission error, invalid name (too short) returns validation error.
5. **WHEN** testing `publishTemplate` mutation **THEN** the system **SHALL** test: authenticated admin succeeds, template `status` becomes `PUBLISHED`, version snapshot is created, publishing an already-published template creates a new version, unauthorized user gets permission error.
6. **WHEN** testing auth scope gating **THEN** the system **SHALL** test: `verifyCertificate` query works WITHOUT any authentication (public), all other certificate queries/mutations require authentication, `CERTIFICATES_VIEW` permission gates `certificates` and `certificate` queries, `CERTIFICATES_MANAGE_TEMPLATE` gates template mutations, `CERTIFICATES_GENERATE` gates generation, `CERTIFICATES_REVOKE` gates revocation.
7. **WHEN** tests use `assertOperationDenied` **THEN** the system **SHALL** import it from `@/frontend/common/graphql/test/helpers` and use it for unauthorized access assertions.
8. **WHEN** tests provision entities **THEN** the system **SHALL** use `loginAndProvision(prefix)` and `provisionTestSuperAdmin(adminToken, prefix)` — NEVER import from `@/shared/demo-users`.

#### Additional Details
- **Priority**: High
- **Complexity**: High (auth scope + multiple mutations)
- **Dependencies**: Plan 05 (GraphQL API), Plans 01–04 (backend layers)
- **AGENTS.md**: `frontend/common/graphql/test/AGENTS.md`, `frontend/common/graphql/AGENTS.md`
- **Pre-requisite**: `bun run generate:gqlSchema` + `bun codegen` must complete before tests run

---

### REQ-10-10: i18n Completeness Tests

**User Story:** As a developer, I want i18n tests validating that all `cert.*` translation keys exist in both `ar` and `en` locales, so that no user-facing message is missing a translation.

#### Acceptance Criteria

1. **WHEN** the i18n test is created **THEN** the system **SHALL** place it at `backend/db/test/logic/certificates/certificate-i18n.test.ts` (or `shared/locale/test/certificates.test.ts` per project conventions).
2. **WHEN** the test runs **THEN** the system **SHALL** enumerate all keys under the `cert` (or `certificates`) namespace in the `en` locale file and verify each key also exists in the `ar` locale file.
3. **WHEN** the test runs **THEN** the system **SHALL** enumerate all keys under the `cert` namespace in the `ar` locale file and verify each key also exists in the `en` locale file.
4. **IF** a key exists in one locale but not the other **THEN** the test **SHALL** fail with a descriptive message listing the missing keys.
5. **WHEN** the test runs **THEN** the system **SHALL** verify that no `cert.*` translation function call in the certificate service/repository code references a key that doesn't exist in the type schema (compile-time safety is already enforced by the custom i18n system, but this test catches runtime/edge cases).
6. **WHEN** pluralization functions exist in the type schema **THEN** the system **SHALL** verify both `ar` and `en` locale files implement them as `(count: number) => string`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Plan 09 (i18n & Navigation) — all translation keys must be defined
- **AGENTS.md**: `shared/AGENTS.md`

---

### REQ-10-11: Canonical Documentation — `docs/certificates/overview.md`

**User Story:** As a new developer or AI agent, I want a canonical overview document for the certificate feature, so that I can understand the full architecture, data flow, and component relationships without reading every file.

#### Acceptance Criteria

1. **WHEN** the overview document is created **THEN** the system **SHALL** place it at `docs/certificates/overview.md`.
2. **WHEN** the document is written **THEN** it **SHALL** cover: feature overview, architecture diagram (all 10 plans and how they relate), data flow (Client → Apollo → GraphQL → Service → Repository → Database), entity relationship summary (tables and their connections), permission model (`CERTIFICATES_*` permissions and their scope), key design decisions (idempotency, versioning, soft-delete, verification).
3. **WHEN** the document references code **THEN** it **SHALL** use relative file paths (e.g., `backend/db/schema/certificates/certificates.ts`) not absolute paths.
4. **WHEN** the document references other docs **THEN** it **SHALL** link to sibling documents (`pdf-rendering.md`, `template-management.md`, `verification.md`).
5. **WHEN** the document is complete **THEN** it **SHALL** serve as the single entry point for any developer needing to understand the certificate feature.
6. **IF** the document exceeds 500 lines **THEN** the system **SHALL** consider splitting sections into separate documents (but the overview remains the index).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: All preceding plans must be complete
- **Assumptions**: All certificate code (Plans 01–09) is written and stable

---

### REQ-10-12: Canonical Documentation — `docs/certificates/pdf-rendering.md`

**User Story:** As a developer, I want documentation for the PDF rendering pipeline, so that I can understand how templates become rendered PDF certificates.

#### Acceptance Criteria

1. **WHEN** the PDF rendering document is created **THEN** the system **SHALL** place it at `docs/certificates/pdf-rendering.md`.
2. **WHEN** the document is written **THEN** it **SHALL** cover: rendering engine technology (Puppeteer/Playwright or whatever Plan 06 uses), template-to-PDF data flow, variable substitution pipeline, element rendering order (z-index, page setup), QR code generation for verification, font handling for Arabic/English, storage integration (where PDFs are saved), error handling and retry, performance considerations.
3. **WHEN** the document references code **THEN** it **SHALL** use relative file paths to the rendering engine source and service files.
4. **WHEN** the document covers i18n **THEN** it **SHALL** explain RTL (right-to-left) rendering for Arabic certificates.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Plan 06 (PDF Rendering Engine)
- **Assumptions**: Plan 06 is complete with the rendering pipeline implemented

---

### REQ-10-13: Canonical Documentation — `docs/certificates/template-management.md`

**User Story:** As a developer, I want documentation for the template management system, so that I can understand template composition, versioning, and the template editor UI.

#### Acceptance Criteria

1. **WHEN** the template management document is created **THEN** the system **SHALL** place it at `docs/certificates/template-management.md`.
2. **WHEN** the document is written **THEN** it **SHALL** cover: template data model (templates, elements, variables, versions), element types (TEXT, IMAGE, QR_CODE, SIGNATURE, SHAPE) and their configs, variable types (TEXT, DATE, NAME, EMAIL, CUSTOM) and resolution, version snapshot mechanism (when/how versions are created, element snapshot jsonb), publish/archive lifecycle (DRAFT → PUBLISHED → ARCHIVED), template editor UI architecture (Plan 07), permissions (`CERTIFICATES_MANAGE_TEMPLATE`).
3. **WHEN** the document covers the UI **THEN** it **SHALL** reference the template editor views from Plan 07.
4. **WHEN** the document covers CRUD **THEN** it **SHALL** reference the `TemplateManagementService` and `TemplateRepository`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Plans 04 (services), 07 (template UI)

---

### REQ-10-14: Canonical Documentation — `docs/certificates/verification.md`

**User Story:** As a developer, I want documentation for the public verification system, so that I can understand how certificate verification works for unauthenticated users.

#### Acceptance Criteria

1. **WHEN** the verification document is created **THEN** the system **SHALL** place it at `docs/certificates/verification.md`.
2. **WHEN** the document is written **THEN** it **SHALL** cover: verification flow (code lookup → status check → response), public access model (no authentication, RLS allows public INSERT on verifications), `VerificationStatus` enum (VALID, INVALID, EXPIRED, REVOKED), verification event logging (IP, UA, timestamp), rate limiting (if applicable), verification UI (Plan 08 public page), privacy considerations (what data is exposed to public verifiers).
3. **WHEN** the document covers the GraphQL API **THEN** it **SHALL** reference the `verifyCertificate` query from Plan 05.
4. **WHEN** the document covers the service layer **THEN** it **SHALL** reference the `CertificateVerificationService` from Plan 04.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Plans 04 (services), 05 (GraphQL), 08 (verification UI)

---

### REQ-10-15: Update Layer AGENTS.md Files

**User Story:** As an AI agent or developer, I want all layer AGENTS.md files updated with certificate-specific rules, so that future AI-assisted development follows established certificate patterns.

#### Acceptance Criteria

1. **WHEN** `backend/db/repo/AGENTS.md` is updated **THEN** it **SHALL** add a "Certificate Repositories" section documenting: the 7 repository namespaces, idempotency pattern (`create` catches unique violation), version snapshot pattern (TemplateRepository), `studentIds` array pattern (RecipientGroupRepository), soft-delete on 5 repos, prepared statement usage, barrel export pattern.
2. **WHEN** `backend/services/AGENTS.md` is updated **THEN** it **SHALL** add a "Certificate Services" section documenting: the 4+ service namespaces, permission gating (`CERTIFICATES_*`), idempotency key generation pattern, variable resolution orchestration, PDF rendering delegation, audit side-effects, localization via `getServerTranslations`.
3. **WHEN** `backend/graphql/AGENTS.md` is updated **THEN** it **SHALL** add a "Certificate GraphQL" section documenting: public `verifyCertificate` query (no auth), auth-gated queries/mutations, DataLoader batching for certificate lookups, enum registration (`CertificateStatus`, `TemplateStatus`, etc.), input types for template/element/variable.
4. **WHEN** `backend/types/AGENTS.md` is updated **THEN** it **SHALL** document certificate type files (`certificate.types.ts`, `certificate-template.types.ts`, etc.), `SelectType`/`InsertType`/`ReturnType`/`SubmitInput` patterns for each entity.
5. **WHEN** `backend/db/schema/AGENTS.md` is updated **THEN** it **SHALL** document the `backend/db/schema/certificates/` subdirectory, 9 tables, 6 enums, RLS policies, CHECK constraints.
6. **WHEN** `frontend/AGENTS.md` is updated **THEN** it **SHALL** add certificate frontend patterns: template editor architecture, certificate list/verification views, Zustand stores for certificate state, Apollo documents location.
7. **WHEN** `frontend/views/AGENTS.md` is updated **THEN** it **SHALL** document certificate view components: desktop/mobile isolation, ViewModel hooks, template editor views, verification page.
8. **WHEN** `shared/AGENTS.md` is updated **THEN** it **SHALL** document the `cert` i18n namespace: translation keys for errors/success messages, pluralization if applicable, both `ar` and `en` locale files.
9. **WHEN** root `AGENTS.md` is updated **THEN** the "Important References" section **SHALL** add links to: `docs/certificates/overview.md`, `docs/certificates/pdf-rendering.md`, `docs/certificates/template-management.md`, `docs/certificates/verification.md`.
10. **WHEN** instruction files are updated **THEN** the system **SHALL** review and update `.agents/instructions/backend.instructions.md` if new backend conventions emerge, `.agents/instructions/frontend.instructions.md` for frontend conventions, and `.agents/instructions/tests.instructions.md` with certificate test patterns (runInRollback + tx propagation for repos, testClient for GraphQL).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low (additive updates to existing files)
- **Dependencies**: All preceding plans complete
- **Files to update (11 AGENTS.md + 3 instruction files + root)**:
  - `backend/db/repo/AGENTS.md`
  - `backend/services/AGENTS.md`
  - `backend/graphql/AGENTS.md`
  - `backend/types/AGENTS.md`
  - `backend/db/schema/AGENTS.md`
  - `frontend/AGENTS.md`
  - `frontend/views/AGENTS.md`
  - `frontend/common/graphql/AGENTS.md` (if certificate-specific GraphQL rules)
  - `frontend/common/graphql/test/AGENTS.md` (add certificates/ subdirectory to Layout)
  - `shared/AGENTS.md`
  - Root `AGENTS.md` (Important References section)
  - `.agents/instructions/backend.instructions.md`
  - `.agents/instructions/frontend.instructions.md`
  - `.agents/instructions/tests.instructions.md`

---

### REQ-10-16: Feature 6 — Outcome Knowledge Base & Progress Tracking

**User Story:** As an AI agent or developer, I want the knowledge propagation outcome file to document all implementation decisions, pitfalls, and patterns, so that future work on the certificate feature (or similar features) can leverage this knowledge.

#### Acceptance Criteria

1. **WHEN** the knowledge propagation phase begins **THEN** the system **SHALL** create an outcome directory at `.ai/draft_plans/cert/plans/10-testing-knowledge-propagation/outcome/`.
2. **WHEN** each task completes **THEN** the system **SHALL** write a `<task-id>-outcome.md` file documenting: research findings, implementation decisions, pitfalls encountered and resolutions, carry-over points for subsequent tasks.
3. **WHEN** the final outcome file is written **THEN** it **SHALL** include: a comprehensive summary of all certificate test patterns, documentation links, AGENTS.md update summary, instruction file update summary, and a "Lessons Learned" section.
4. **WHEN** the outcome file references patterns **THEN** it **SHALL** link to the canonical docs in `docs/certificates/` and the AGENTS.md sections added by this plan.
5. **WHEN** the outcome file is complete **THEN** it **SHALL** serve as the definitive reference for any future agent working on certificate-related features or similar domain testing.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: All other tasks in this plan must be complete first

---

### REQ-10-17: Quality Validation

**User Story:** As a developer, I want zero quality gate errors after all tests and docs are created, so that the certificate feature is production-ready.

#### Acceptance Criteria

1. **WHEN** all test files are created **THEN** the system **SHALL** run `bun tsgo` with zero TypeScript errors across all new test files.
2. **WHEN** all test files are created **THEN** the system **SHALL** run `bun biome:check` with zero formatting/lint issues.
3. **WHEN** all test files are created **THEN** the system **SHALL** run `bun run lint` (via lint queue client) with zero ESLint violations.
4. **WHEN** all documentation files are created **THEN** the system **SHALL** verify documentation links resolve (no broken relative paths).
5. **WHEN** all AGENTS.md files are updated **THEN** the system **SHALL** verify no broken cross-references exist.
6. **WHEN** all tests pass **THEN** the system **SHALL** run the full certificate test suite via `bun run scripts/run-test/run-test.ts` and confirm all tests pass (zero failures).
7. **WHEN** 100% repository coverage is required **THEN** the system **SHALL** run `bun test --coverage` for each repository test and confirm 100% statement coverage.

#### Additional Details
- **Priority**: High
- **Complexity**: Low (verification, not implementation)
- **Dependencies**: All other tasks complete

---

## Non-Functional Requirements

### Performance Requirements
- **WHEN** repository tests run **THEN** the full certificate repo test suite **SHALL** complete within 60 seconds (parallel execution via `bun run test:db`).
- **WHEN** service tests run **THEN** the full certificate service test suite **SHALL** complete within 120 seconds.
- **WHEN** GraphQL integration tests run **THEN** the certificate GraphQL test suite **SHALL** complete within 120 seconds (dev server startup included).

### Security Requirements
- **WHEN** tests create certificate data **THEN** they **SHALL** never expose real student PII in test assertions (use generated test data only).
- **WHEN** GraphQL tests verify public endpoints **THEN** they **SHALL** confirm no authentication token is required.
- **WHEN** GraphQL tests verify auth-gated endpoints **THEN** they **SHALL** confirm unauthenticated requests return permission errors.

### Reliability Requirements
- **WHEN** database tests use `runInRollback` **THEN** all tests **SHALL** roll back cleanly with no side effects on the database.
- **WHEN** tests are run in parallel **THEN** they **SHALL** not interfere with each other (isolated transactions, unique IDs per test).

### Maintainability Requirements
- **WHEN** test helpers are repeated across test files **THEN** the system **SHALL** extract reusable helpers (e.g., `createTestCertificate`, `createTestTemplate`) and avoid duplication (SonarQube compliance).
- **WHEN** documentation is written **THEN** it **SHALL** use clear, concise language and include code examples where helpful.

---

## UX/Navigation Specification

> This plan is **testing and documentation only** — no new UI routes, sidebar entries, or frontend components are in scope. All certificate UI routes were defined in Plans 07 and 08.

### Navigation Impact

| Route | Status | Plan |
|-------|--------|------|
| `/certificates` | Already implemented | Plan 08 |
| `/certificates/templates` | Already implemented | Plan 07 |
| `/certificates/verify` | Already implemented (public) | Plan 08 |
| `/certificates/[id]` | Already implemented | Plan 08 |

### Sidebar/Menu Impact

No sidebar changes — all certificate navigation entries were added in Plans 07/08.

### Mobile vs Desktop

No new mobile/desktop views — all versioned components were created in Plans 07/08.

---

## Outcome & Knowledge Transfer Protocol

### Knowledge Propagation Targets

| Target | Type | Content |
|--------|------|---------|
| `docs/certificates/overview.md` | New doc | Canonical certificate feature reference |
| `docs/certificates/pdf-rendering.md` | New doc | PDF rendering pipeline documentation |
| `docs/certificates/template-management.md` | New doc | Template editor and versioning documentation |
| `docs/certificates/verification.md` | New doc | Public verification system documentation |
| `backend/db/repo/AGENTS.md` | Updated | Certificate repository patterns |
| `backend/services/AGENTS.md` | Updated | Certificate service patterns |
| `backend/graphql/AGENTS.md` | Updated | Certificate GraphQL patterns |
| `backend/types/AGENTS.md` | Updated | Certificate type patterns |
| `backend/db/schema/AGENTS.md` | Updated | Certificate schema patterns |
| `frontend/AGENTS.md` | Updated | Certificate frontend patterns |
| `frontend/views/AGENTS.md` | Updated | Certificate view patterns |
| `shared/AGENTS.md` | Updated | Certificate i18n namespace |
| Root `AGENTS.md` | Updated | Important References section |
| `.agents/instructions/*.instructions.md` | Updated | New test/backend/frontend conventions |
| `outcome/` directory | New | Per-task outcome files + final knowledge summary |

### Knowledge Transfer Protocol

1. **Write first, review later**: Each task writes its outcome file immediately upon completion.
2. **Read before starting**: Each task reads all prior outcome files before beginning.
3. **Link, don't duplicate**: Documentation links to source code paths; AGENTS.md links to docs; outcome files link to both.
4. **AGENTS.md as living spec**: Updated AGENTS.md files are the authoritative pattern reference — they override stale training data for AI agents.
5. **Final knowledge file**: The last task synthesizes all outcomes into a comprehensive knowledge transfer document.

---

## Constraints and Assumptions

### Technical Constraints
- All database tests MUST use `runInRollback` and pass `tx` to all repository/service methods
- All database tests MUST use `bun:test` (never Jest/Vitest)
- All GraphQL tests MUST use `testClient` (never raw `fetch`)
- All GraphQL tests MUST use `TypedDocumentNode` (run codegen first)
- All test data MUST be created via `entity-setup.ts` helpers (never query seed data)
- 100% repository coverage is MANDATORY
- Test runner: `bun run scripts/run-test/run-test.ts <path>` (not raw `bun test`)

### Business Constraints
- Documentation is developer-facing (no end-user docs in scope)
- AGENTS.md updates must be additive (don't remove existing content)
- Instruction file updates must be reviewed for consistency with existing rules

### Assumptions
- Plans 01–09 are fully implemented and all certificate code is stable
- The database is accessible and migrations are applied
- The dev server can be started for GraphQL integration tests
- `bun run generate:gqlSchema` + `bun codegen` have been run (typed documents exist)
- The lint queue server can be started for parallel test/lint execution

---

## Success Criteria

### Definition of Done
- [ ] All 7 repository test files created in `backend/db/test/repo/certificates/`
- [ ] All 4 service test files created in `backend/db/test/logic/certificates/`
- [ ] Both GraphQL integration test files created in `frontend/common/graphql/test/certificates/`
- [ ] i18n completeness test created
- [ ] All repository tests achieve 100% statement coverage
- [ ] All service tests pass (via `runInRollback`, `tx` propagated)
- [ ] All GraphQL tests pass (via `testClient`, dev server lifecycle)
- [ ] `docs/certificates/overview.md` created
- [ ] `docs/certificates/pdf-rendering.md` created
- [ ] `docs/certificates/template-management.md` created
- [ ] `docs/certificates/verification.md` created
- [ ] All 11 AGENTS.md files updated with certificate-specific rules
- [ ] Root `AGENTS.md` Important References updated
- [ ] Instruction files reviewed and updated if needed
- [ ] Knowledge propagation outcome file written
- [ ] `bun tsgo` passes with zero errors
- [ ] `bun biome:check` passes with zero errors
- [ ] `bun run lint` passes with zero errors

### Acceptance Metrics
- 100% statement coverage for all 7 certificate repository files
- Zero TypeScript compilation errors from new test files
- Zero ESLint violations from new test files
- Zero Biome formatting issues from new test files
- All certificate tests pass (zero failures)
- 4 documentation files created with correct relative paths
- 11+ AGENTS.md files updated with certificate sections
- All documentation cross-links resolve

---

## Glossary

| Term | Definition |
|------|------------|
| EARS | Easy Approach to Requirements Syntax — WHEN/THEN/IF/SHALL format |
| runInRollback | Test wrapper that executes the test body inside `db.transaction()` and rolls back after |
| tx propagation | Passing the transaction object (`tx`) to all repository/service method calls within a transaction |
| expectRepoError | Try/catch helper pattern for asserting errors inside `runInRollback` (avoids deadlocks) |
| entity-setup.ts | Test helper file with functions to create test users, students, teachers, etc. |
| run-test.ts | Test runner script that captures output to log files for debugging |
| testClient | Apollo Client test instance with `errorPolicy: "all"`, `fetchPolicy: "no-cache"` |
| setupTestServerLifecycle | Shared lifecycle helper that spawns/kills the Next.js dev server for GraphQL tests |
| TypedDocumentNode | Type-safe GraphQL document with generated types for query/mutation operations |
| 100% coverage | 100% statement coverage measured via `bun test --coverage` |
| Knowledge Propagation | Pattern of documenting decisions/patterns/pitfalls for future agents and developers |
| Feature 6 | Outcome Knowledge Base & Progress Tracking — links certificates to learning outcomes |

---

## Requirements Review Checklist

### Completeness ✅
- [x] All user stories have clear roles, features, and benefits
- [x] Each requirement has specific acceptance criteria using EARS format
- [x] Non-functional requirements are addressed (performance, security, reliability, maintainability)
- [x] Success criteria are defined and measurable
- [x] Navigation/sidebar/tabs noted as N/A (testing/docs plan — no new nav)
- [x] Permissions documented for test auth scope (cert.* permissions)
- [x] Feature 6 (Outcome Knowledge Base) included (REQ-10-16)

### Quality ✅
- [x] Requirements are written in active voice
- [x] Each acceptance criterion is testable
- [x] Requirements avoid implementation details (mostly — test patterns noted as constraints)
- [x] Terminology is consistent throughout

### EARS Format Validation ✅
- [x] WHEN statements describe specific events or triggers
- [x] IF statements describe clear conditions or states
- [x] All statements use SHALL for system responses

### Traceability ✅
- [x] Requirements are numbered (00–17) and organized by domain
- [x] Dependencies between requirements are clear
- [x] Assumptions and constraints are documented
- [x] Each requirement references applicable AGENTS.md paths
