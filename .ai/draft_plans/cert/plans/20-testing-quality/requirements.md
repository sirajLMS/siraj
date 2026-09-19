# Plan 20 — Testing & Quality: Requirements

## Document Info

| Field | Value |
|-------|-------|
| Feature | Certificate Testing & Quality Assurance |
| Plan # | 20 |
| Depends On | Plans 1–19 (all prior plans) |
| Stakeholders | Backend team, Frontend team, QA, DevOps |
| Related Docs | `MASTER_ARCHITECTURE.md`, `siraj_analysis/10-testing-quality-patterns.md`, `siraj_analysis/01-db-schema-patterns.md` |
| Spec Files | `requirements.md` (this file), `design.md`, `tasks.md` |

## Introduction

### Overview

This plan establishes the comprehensive test suite and quality verification infrastructure for the entire certificate feature. Because Plans 1–19 implement all schema, repositories, services, GraphQL API, and UI components for certificates, this plan is responsible for verifying correctness, coverage, integration, and full-stack behavior across the complete flow.

### Business Value

- Ensures 100% repository coverage for all certificate domain repositories (mandated by `backend/db/test/AGENTS.md` Rule 14)
- Prevents regressions in the certificate generation, verification, and template management workflows
- Validates public-facing verification page correctness (security-critical: unauthenticated endpoint)
- Provides full-lifecycle confidence that the certificate workflow works from template creation through public verification

### Scope

| In Scope | Out of Scope |
|----------|-------------|
| DB repository tests for all 8 certificate repositories | Implementing new features (tested code already built in Plans 1–19) |
| Service tests for generation, verification, template management, cache | External provider integration tests (e.g., Puppeteer PDF smoke tests) |
| GraphQL integration tests (queries, mutations, auth scopes, DataLoader) | Performance/load testing |
| Entity-setup helper extensions for certificate test data | Coverage of non-certificate domains |
| Test-specific i18n keys for test assertions | CI/CD pipeline configuration (Plan 21 covers docs) |
|  | Migration testing (Plan 1 covers schema) |

---

## Requirements

### REQ-1: Database Repository Tests (100% Coverage)

**Goal**: Every certificate repository method is covered by isolation tests in `backend/db/test/repo/cert/` achieving 100% coverage.

#### REQ-1.1: Certificate Repository Tests

WHEN the certificate repository test suite runs, THEN it SHALL cover:
- CRUD operations: insert, findById, update, softDelete
- findMany with pagination (cursor-based, limit/offset)
- findMany with search (FTS on recipient name, certificate title)
- findMany with filters (status, templateId, recipientGroupId, date range)
- Soft delete behavior (deletedAt set, excluded from default queries)
- Verification code uniqueness constraint
- Status transitions (draft → pending → issued → revoked → expired)
- Version mismatch (optimistic locking) error
- Not-found error for unknown IDs
- Idempotency key uniqueness

#### REQ-1.2: Template Repository Tests

WHEN the template repository test suite runs, THEN it SHALL cover:
- CRUD operations: insert, findById, update, softDelete
- Version chain: parent version, version number increment
- Status transitions: draft → published, published → archived, archived → published (re-publish)
- findMany with filters (status, categoryId, search)
- Soft delete behavior (cascade to elements and variables)
- Version mismatch (optimistic locking) error
- Not-found error for unknown IDs

#### REQ-1.3: Template Element Repository Tests

WHEN the template element repository test suite runs, THEN it SHALL cover:
- CRUD operations: insert, findById, update, delete
- findByTemplateId: returns all elements for a template, ordered by zIndex
- Ordering: elements returned in correct zIndex order
- Type-specific fields: static_text (content), data_text (variable binding), data_date (format), image (URL/size), qr_code (size), shape (type/dimensions)
- Position fields: x, y, width, height, rotation
- Delete with template cascade behavior
- Not-found error for unknown IDs

#### REQ-1.4: Template Variable Repository Tests

WHEN the template variable repository test suite runs, THEN it SHALL cover:
- CRUD operations: insert, findById, update, delete
- findByTemplateId: returns all variables for a template
- Type-specific operations: text, number, date, select (with options)
- Default value handling: nullable vs required
- Required flag validation
- Delete with template cascade behavior
- Not-found error for unknown IDs

#### REQ-1.5: Recipient Group Repository Tests

WHEN the recipient group repository test suite runs, THEN it SHALL cover:
- CRUD operations on recipient_groups: insert, findById, update, delete
- Student assignment: add student to group, remove student from group
- findByTemplateId: returns all groups for a template
- Variable values: set per-recipient variable value, find by group item ID
- Bulk student assignment
- Not-found errors for unknown group IDs and item IDs

#### REQ-1.6: Verification Repository Tests

WHEN the verification repository test suite runs, THEN it SHALL cover:
- createLog: inserts a verification log entry
- findByCertificateId: returns all verification entries for a certificate, ordered by createdAt descending
- Result values: valid, invalid, revoked, expired
- IP address and user agent capture
- Not-found error for unknown certificate ID

#### REQ-1.7: Category Repository Tests

WHEN the category repository test suite runs, THEN it SHALL cover:
- CRUD operations: insert, findById, update, softDelete
- Tree operations: getChildren, getDescendants, getAncestors, getPath
- Reorder: move category up/down within parent
- Soft delete with cascade (children templates unassigned)
- Not-found error for unknown IDs

#### REQ-1.8: Database Logic Tests

WHEN the certificate logic test suite runs in `backend/db/test/logic/`, THEN it SHALL cover:
- Certificate generation transaction (multi-entity: template + recipient → certificate + verification code)
- Idempotency: duplicate generation request with same idempotency key returns existing certificate
- Status state machine constraint validation (illegal transitions throw)
- Template publish flow (draft → published with version snapshot)
- Template archive flow (published → archived, existing certificates unaffected)
- Category tree integrity (parent deletion cascades correctly)

### REQ-2: Service Tests

**Goal**: All certificate backend services are tested in `backend/services/cert/test/`.

#### REQ-2.1: Generation Pipeline Service Test

WHEN the generation service test runs, THEN it SHALL cover:
- Single certificate generation: template + student → certificate with PDF reference
- Batch generation: template + recipient group → N certificates
- Idempotency: same idempotency key returns existing result
- Variable substitution: template variables resolved from recipient group item values
- Error scenarios: template not found, recipient group empty, template not published, missing required variables
- PDF rendering trigger (mocked: verify render function called with correct parameters)
- Verification code generation (unique, UUID-based)

#### REQ-2.2: Verification Service Test

WHEN the verification service test runs, THEN it SHALL cover:
- Valid verification: existing, issued certificate → returns certificate details
- Revoked certificate: status=revoked → returns revoked indicator
- Expired certificate: status=expired → returns expired indicator
- Invalid code: non-existent code → returns not-found indicator
- Verification log creation: each verification creates a log entry
- Public endpoint behavior: no auth required, rate limiting respected

#### REQ-2.3: Template Management Service Test

WHEN the template management service test runs, THEN it SHALL cover:
- Publish template: draft → published, version snapshot created
- Archive template: published → archived, existing certificates unaffected
- Re-publish archived: archived → published, new version number
- Version history: list all versions of a template
- Permission checks: only users with `certificate_templatemanage` can publish/archive

#### REQ-2.4: Entity Cache Service Test

WHEN the entity cache service test for certificates runs, THEN it SHALL cover:
- Cache hit: second fetch of same certificate by ID returns cached version
- Cache miss: first fetch queries repository
- Cache invalidation: update/delete invalidates cache entry
- TTL expiry: stale cache entry refreshed from repository
- Batch loading: DataLoader fetches N certificates in a single query (N+1 prevention)

### REQ-3: GraphQL Integration Tests

**Goal**: All certificate GraphQL queries and mutations are tested via the integration test harness in `frontend/common/graphql/test/cert/`.

#### REQ-3.1: Certificate Queries

WHEN the certificate query integration tests run, THEN they SHALL cover:
- Certificate list query with pagination (first, after, totalCount)
- Certificate list query with filters (status, templateId, dateRange)
- Certificate list query with search (recipient name, title)
- Single certificate detail query (by ID)
- Public verification query (by verification code, no auth)
- Auth scope: unauthenticated user cannot list certificates (only public verification)

#### REQ-3.2: Template Queries

WHEN the template query integration tests run, THEN they SHALL cover:
- Template list query with pagination
- Template list query with filters (status, categoryId)
- Single template detail query (by ID, includes elements and variables)
- Category tree query (full hierarchy)
- Auth scope: draft templates only visible to users with template management permission

#### REQ-3.3: Certificate Mutations

WHEN the certificate mutation integration tests run, THEN they SHALL cover:
- Generate certificate mutation (single): returns generated certificate
- Generate certificates mutation (batch): returns N certificates
- Revoke certificate mutation: status transitions to revoked
- Auth scope: only users with `certificate_generate` permission can generate
- Auth scope: only users with `certificate_revoke` permission can revoke

#### REQ-3.4: Template Mutations

WHEN the template mutation integration tests run, THEN they SHALL cover:
- Create template mutation: returns new template in draft status
- Update template mutation: updates meta fields
- Update template elements mutation: add/update/delete elements
- Update template variables mutation: add/update/delete variables
- Publish template mutation: draft → published
- Archive template mutation: published → archived
- Auth scope: only users with `certificate_templatemanage` permission

#### REQ-3.5: Recipient Group Mutations

WHEN the recipient group mutation integration tests run, THEN they SHALL cover:
- Create recipient group mutation
- Assign students to group mutation
- Set per-recipient variable values mutation
- Auth scope: only users with `certificate_recipientmanage` permission

#### REQ-3.6: Category Mutations

WHEN the category mutation integration tests run, THEN they SHALL cover:
- Create category mutation
- Update category mutation
- Reorder category mutation (move up/down)
- Delete category mutation (soft delete)
- Auth scope: only users with `certificate_categorymanage` permission

#### REQ-3.7: DataLoader / N+1 Prevention Tests

WHEN the DataLoader integration tests run, THEN they SHALL cover:
- Certificate list with template: template loaded via DataLoader, not separate per-row queries
- Certificate list with recipient: recipient loaded via batch
- Nested template category resolution: batch-loaded, no N+1
- Query depth: no circular resolution causes infinite loops

### REQ-7: Test Data Infrastructure

**Goal**: Entity-setup helpers are extended for certificate test entities.

#### REQ-7.1: Certificate Entity Setup Helpers

WHEN test entity helpers are created in `entity-setup.ts`, THEN they SHALL provide:
- `createTestCertificateCategory(tx, overrides?)` — inserts a `certificate_categories` row
- `createTestCertificateTemplate(tx, overrides?)` — inserts a `certificate_templates` row (defaults: status=draft, version=1)
- `createTestTemplateElement(tx, templateId, overrides?)` — inserts a `certificate_template_elements` row
- `createTestTemplateVariable(tx, templateId, overrides?)` — inserts a `certificate_template_variables` row
- `createTestRecipientGroup(tx, templateId, overrides?)` — inserts a `certificate_recipient_groups` row
- `createTestRecipientGroupItem(tx, groupId, studentId?, overrides?)` — inserts a group item, auto-creates student if not supplied
- `createTestCertificate(tx, templateId, studentId, overrides?)` — inserts a `certificates` row (defaults: status=issued, verification code auto-generated)
- `createTestVerificationLog(tx, certificateId, overrides?)` — inserts a `certificate_verifications` row
- `setupCertificateTestEntities(tx, prefix)` — full rig: category + template + elements + variables + recipient group + group items + certificate

### REQ-8: Outcome Knowledge Base & Progress Tracking

#### REQ-8.1: Test Documentation

WHEN this plan is complete, THEN the following documentation updates SHALL be made:
- `backend/db/test/AGENTS.md` — add cert test directory to the domain list
- `backend/db/test/entity-setup.ts` — documented helper signatures for cert entities
- `frontend/common/graphql/test/AGENTS.md` — add cert test directory reference

---

## i18n Requirements

### Test-Specific Translation Keys

This plan introduces minimal translation keys that are used in test assertions (error messages) and test-derived UI states. All user-facing strings are already defined in Plans 1–19. Test assertions SHALL assert on translated message substrings (never raw i18n keys) per `backend/db/test/AGENTS.md` Rule 3 and Rule 19.

| Namespace | Key | English | Arabic | Used In |
|-----------|-----|---------|--------|---------|
| `certificates.errors` | `notFound` | "Certificate not found" | "الشهادة غير موجودة" | DB repo tests, GraphQL test error assertions |
| `certificates.errors` | `templateNotFound` | "Template not found" | "النموذج غير موجود" | DB repo tests, service tests |
| `certificates.errors` | `versionMismatch` | "Version mismatch" | "عدم تطابق الإصدار" | DB repo tests (optimistic locking) |
| `certificates.errors` | `alreadyRevoked` | "Certificate already revoked" | "تم إلغاء الشهادة بالفعل" | Service test, GraphQL test |
| `certificates.errors` | `notPublished` | "Template is not published" | "النموذج غير منشور" | Service test (generation guard) |
| `certificates.errors` | `expiredCode` | "Verification code has expired" | "انتهت صلاحية رمز التحقق" | Verification service test |
| `certificates.errors` | `invalidCode` | "Invalid verification code" | "رمز تحقق غير صالح" | Verification service test |
| `certificates.errors` | `missingRequiredVariable` | "Missing required variable: {name}" | "متغير مطلوب غير موجود: {name}" | Generation service test (interpolation: `name`) |
| `certificates.errors` | `groupEmpty` | "Recipient group is empty" | "مجموعة المستلمين فارغة" | Generation service test |
| `certificates.errors` | `alreadyGenerated` | "Certificate already generated for this recipient" | "تم إصدار شهادة لهذا المستلم بالفعل" | Generation service test (idempotency) |

### Pluralization Rules

No pluralization is needed for test-specific error keys — all are singular error messages. The pluralization for user-facing labels (e.g., "X certificates generated") is defined in Plans 16–17 and not duplicated here.

---

## Acceptance Criteria

### AC-1: DB Repository Tests
- [ ] All 8 certificate repositories have isolation test files in `backend/db/test/repo/cert/`
- [ ] `bun run test:db` passes with 0 failures for cert test files
- [ ] Coverage check: `bun test --coverage backend/db/test/repo/cert/` reports 100% for all cert repo files
- [ ] All tests use `runInRollback` wrapper with `tx` passed to all repository methods
- [ ] No seed data is queried — all test data created via entity-setup helpers
- [ ] Error assertions use translated message substrings, not raw i18n keys

### AC-2: Service Tests
- [ ] Generation pipeline test covers single, batch, idempotency, and error scenarios
- [ ] Verification service test covers valid, invalid, revoked, and expired codes
- [ ] Template management test covers publish, archive, and re-publish
- [ ] Entity cache test covers hit, miss, invalidation, and batch loading
- [ ] `bun run test:services` passes for cert service tests

### AC-3: GraphQL Integration Tests
- [ ] All certificate queries have integration tests in `frontend/common/graphql/test/cert/`
- [ ] All certificate mutations have integration tests
- [ ] Auth scope tests verify permission-gated operations reject unauthorized users
- [ ] Public verification query is tested without authentication
- [ ] DataLoader tests verify no N+1 queries (assert single batch query)
- [ ] `bun run test:graphql` passes for cert test files

### AC-7: Test Data Infrastructure
- [ ] `entity-setup.ts` exports all certificate helper functions per REQ-7.1
- [ ] All helpers accept `tx: DBTransaction` as first parameter
- [ ] All helpers accept an `overrides` partial for the relevant table's `$inferInsert` type
- [ ] `setupCertificateTestEntities` creates a full certificate rig in a single call

### AC-8: Quality Gate
- [ ] `bun tsgo` passes (type check)
- [ ] `bun biome:check` passes (format + lint)
- [ ] `bun run lint` passes (ESLint via queue)
- [ ] `bun run codescene --file <cert-test-file>` passes (no health warnings)
