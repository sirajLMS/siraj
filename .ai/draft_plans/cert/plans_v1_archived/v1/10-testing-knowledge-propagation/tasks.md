# Plan 10 — Testing & Knowledge Propagation: Tasks

> **Feature**: Certificate Generation & Verification (Siraj)
> **Plan**: 10 — Testing & Knowledge Propagation
> **Depends on**: Plans 01–09 (ALL preceding plans must be complete)
> **Requirements**: [requirements.md](./requirements.md) — REQ-10-00 through REQ-10-17
> **Design**: [design.md](./design.md)

---

## Task Progress

- [ ] Task 1: Create certificate repository tests (all 7 repos)
- [ ] Task 2: Create service tests (generation, verification, template, recipient)
- [ ] Task 3: Create GraphQL integration tests (queries + mutations)
- [ ] Task 4: Run all tests and fix failures (via run-test.ts script)
- [ ] Task 5: Create `docs/certificates/overview.md` canonical reference
- [ ] Task 6: Create `docs/certificates/pdf-rendering.md` documentation
- [ ] Task 7: Create `docs/certificates/template-management.md` documentation
- [ ] Task 8: Create `docs/certificates/verification.md` documentation
- [ ] Task 9: Update all layer AGENTS.md files with certificate rules
- [ ] Task 10: Update root AGENTS.md, skills, and instruction files
- [ ] Task 11: Quality validation (bun tsgo, bun biome:check, bun run lint — 0 errors)
- [ ] Task 12: Knowledge propagation outcome file

---

## Task 1: Create Certificate Repository Tests (All 7 Repos)

**Estimated time**: 3–4 hours
**Requirements**: REQ-10-01, REQ-10-02, REQ-10-03

### Objective

Create comprehensive repository unit tests for all 7 certificate repositories, achieving 100% method coverage. Tests use `runInRollback`, `tx` propagation, `entity-setup.ts` helpers, and the try/catch error assertion pattern.

### Tasks

- [ ] 1.1 Create `backend/db/test/repo/certificates/certificate.repository.test.ts`
  - Tests: `findById` (exists, null non-existent, null soft-deleted), `findMany` (no-filter, filter-by-status, filter-by-templateId, filter-by-studentId, pagination, combined), `create` (happy path, idempotency collision returns existing, all required fields), `update` (happy path, non-existent error, soft-deleted error), `softDelete` (sets deletedAt, findById returns null), `findByIdempotencyKey` (exists, null not found), `loadByIds` (batch lookup, missing throws), `existsById` (true, false), Feature 6 methods (`findOutcomesByCertificateId`, `findProgressByStudentId`, `updateProgress`)
  - Setup helper: `setupTestCertificateEntities(tx)` creates user, student, template, category

- [ ] 1.2 Create `backend/db/test/repo/certificates/certificate-template.repository.test.ts`
  - Tests: all CRUD, `publishVersion` (creates version snapshot, increments version), `findPublishedVersion` (returns latest published), `archive` (sets status to ARCHIVED), version management tests (snapshot integrity, version ordering)
  - Includes Feature 6 methods: `findOutcomesByTemplateId`

- [ ] 1.3 Create `backend/db/test/repo/certificates/template-element.repository.test.ts`
  - Tests: CRUD, `findByTemplateId` (returns ordered by z_index), `reorder` (updates z_index), config jsonb handling

- [ ] 1.4 Create `backend/db/test/repo/certificates/template-variable.repository.test.ts`
  - Tests: CRUD, `findByTemplateId`, unique constraint on `(templateId, key)` — catch violation returns existing, `resolveVariables` (substitutes student profile data)

- [ ] 1.5 Create `backend/db/test/repo/certificates/recipient-group.repository.test.ts`
  - Tests: CRUD, `addStudent` (appends to studentIds array), `removeStudent`, `resolveStudents` (joins students table), `findByIds`

- [ ] 1.6 Create `backend/db/test/repo/certificates/verification.repository.test.ts`
  - Tests: `create` (public insert, no soft-delete), `findByCode` (exists, null), `logVerification` (inserts verification event), `countByCertificateId`
  - Note: verification records are NOT soft-deleted (immutable audit log)

- [ ] 1.7 Create `backend/db/test/repo/certificates/category.repository.test.ts`
  - Tests: CRUD, self-referencing hierarchy (`findByParentId`, `findRootCategories`), move category

### Quality Loop (per file)

```bash
# After creating each test file:
bun tsgo                                                    # Type check
bun biome:check                                              # Format
# Lint via queue client:
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task01-1","files":["backend/db/test/repo/certificates/certificate.repository.test.ts"]}'
# Run the test:
bun run scripts/run-test/run-test.ts backend/db/test/repo/certificates/certificate.repository.test.ts
```

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — Database Testing Critical Rules section
- `backend/db/repo/AGENTS.md` — Repository layer rules
- `backend/db/test/repo/AGENTS.md` — Test repo rules (if exists)
- `backend/db/test/logic/AGENTS.md` — Test logic rules
- `.github/instructions/tests.instructions.md` — Test instruction patterns
- `.github/instructions/backend.instructions.md` — Backend instruction patterns
- `siraj_analysis/10-testing-quality-patterns.md` — Testing patterns reference
- `siraj_analysis/03-repository-patterns.md` — Repository patterns reference
- `backend/db/test/entity-setup.ts` — Helper signatures (verify before use)
- `backend/db/test/repo/billing/billing.repository.test.ts` — Reference test file

### Requirements Reference

- REQ-10-01: CertificateRepository test coverage (findById, findMany, create, update, softDelete, findByIdempotencyKey)
- REQ-10-02: TemplateRepository test coverage (includes publishVersion, findPublishedVersion)
- REQ-10-03: Remaining 5 repos full CRUD coverage (elements, variables, recipient groups, verifications, categories)

### Outcome File

Write `outcome/task01-outcome.md` after completion:
- Implementation Summary
- Research Findings (entity-setup helper signatures used, test patterns applied)
- Pitfalls Encountered (deadlocks, coverage gaps, error message substrings)
- Carry-Over Points for Task 2 (which entity-setup helpers to reuse, which test data setup patterns)
- Files Created/Modified

---

## Task 2: Create Service Tests (Generation, Verification, Template, Recipient)

**Estimated time**: 3–4 hours
**Requirements**: REQ-10-04, REQ-10-05, REQ-10-06, REQ-10-07

### Objective

Create business logic tests for all 4 certificate services. Tests use `runInRollback`, `tx` propagation, and test cross-repo orchestration, idempotency, variable resolution, and workflow logic.

### Tasks

- [ ] 2.1 Create `backend/db/test/logic/certificates/certificate-generation.service.test.ts`
  - Tests: `generateCertificate` (happy path — ISSUED + verification code, idempotency — same key returns same certificate, missing template — not-found error, unpublished template — error, empty recipient group — error), `revokeCertificate` (sets REVOKED + reason, cannot revoke already-revoked, cannot revoke non-existent)
  - Setup: `setupGenerationTestEntities(tx)` creates user, student, published template, recipient group with student
  - Custom tests for variable resolution (student profile → template variables)

- [ ] 2.2 Create `backend/db/test/logic/certificates/certificate-verification.service.test.ts`
  - Tests: `verifyCertificate` (valid — returns VALID + logs verification, expired — returns EXPIRED, revoked — returns REVOKED, not found — returns INVALID/not-found error), `logVerification` (inserts event with IP/UA, public insert works, verifiedBy nullable)
  - Tests for certificate status computation based on expiryDate

- [ ] 2.3 Create `backend/db/test/logic/certificates/template-management.service.test.ts`
  - Tests: `create` (happy path, validation — name required), `update` (happy path, non-existent error), `publish` (creates version snapshot, sets PUBLISHED, cannot publish archived), `archive` (sets ARCHIVED, cannot archive already archived), version snapshot integrity (elementSnapshot jsonb matches current elements)
  - Tests for template lifecycle: DRAFT → PUBLISHED → ARCHIVED

- [ ] 2.4 Create `backend/db/test/logic/certificates/recipient-group.service.test.ts`
  - Tests: `create` (happy path), `assignStudents` (appends to studentIds, idempotent — assigning same student twice is no-op), `resolveVariables` (substitutes student profile fields into template variables), `removeStudent`
  - Tests for variable type resolution: TEXT, DATE, NAME, EMAIL, CUSTOM

### Quality Loop (per file)

```bash
# After creating each test file:
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task02-1","files":["backend/db/test/logic/certificates/certificate-generation.service.test.ts"]}'
bun run scripts/run-test/run-test.ts backend/db/test/logic/certificates/certificate-generation.service.test.ts
```

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — Database Testing Critical Rules
- `backend/services/AGENTS.md` — Service layer rules
- `backend/db/test/logic/AGENTS.md` — Test logic rules
- `.github/instructions/tests.instructions.md` — Test patterns
- `.github/instructions/backend.instructions.md` — Backend patterns
- `siraj_analysis/10-testing-quality-patterns.md` — Test patterns reference
- `siraj_analysis/04-services-graphql-patterns.md` — Service patterns reference
- `backend/db/test/logic/billing/payment-idempotency.test.ts` — Reference logic test
- `backend/db/test/entity-setup.ts` — Helper signatures
- Read Task 1 outcome file: `outcome/task01-outcome.md`

### Requirements Reference

- REQ-10-04: TemplateManagementService tests (create, update, publish, archive, version snapshot)
- REQ-10-05: CertificateGenerationService tests (happy path, idempotency, missing template, unpublished template, empty recipient group, revoke)
- REQ-10-06: CertificateVerificationService tests (valid, expired, revoked, not found, logVerification)
- REQ-10-07: RecipientGroupService tests (create, assignStudents, resolveVariables)

### Outcome File

Write `outcome/task02-outcome.md` after completion:
- Implementation Summary
- Research Findings (service method signatures, error message substrings used)
- Pitfalls Encountered (service orchestration issues, variable resolution edge cases)
- Carry-Over Points for Task 3 (which service behaviors need GraphQL test coverage)
- Files Created/Modified

---

## Task 3: Create GraphQL Integration Tests (Queries + Mutations)

**Estimated time**: 3–4 hours
**Requirements**: REQ-10-08, REQ-10-09

### Objective

Create GraphQL integration tests for certificate queries and mutations. Tests use `testClient` (not raw fetch), `setupTestServerLifecycle`, `loginAndProvision`, `authenticatedRequest`, and `assertOperationDenied`.

### Prerequisites

- Run `bun run generate:gqlSchema` + `bun codegen` (ensures TypedDocumentNode types exist)
- Verify `frontend/common/graphql/sharedDocuments/certificates/` documents exist (from Plan 05)
- Start dev server (handled by `setupTestServerLifecycle`)

### Tasks

- [ ] 3.1 Create `frontend/common/graphql/test/certificates/certificate-query.test.ts`
  - Tests: `certificates` (list — authenticated admin, unauthenticated → denied), `certificate` (by ID — authenticated, unauthenticated → denied, non-existent → error), `verifyCertificate` (public — no auth required, valid certificate, expired, revoked, not found)
  - Import documents from `@/frontend/common/graphql/sharedDocuments/certificates/`
  - Use `TypedDocumentNode` for all operations

- [ ] 3.2 Create `frontend/common/graphql/test/certificates/certificate-mutation.test.ts`
  - Tests: `generateCertificate` (authenticated admin — ISSUED + verification code, unauthenticated → permission error, idempotency key works, missing template → error), `revokeCertificate` (authenticated admin — REVOKED, unauthenticated → permission error, already revoked → error), `createTemplate` (authenticated admin — DRAFT, unauthenticated → permission error, invalid name → validation error), `publishTemplate` (authenticated admin — PUBLISHED + version snapshot, unauthorized → permission error, archived template → error)
  - Auth scope tests: verify permission gating (unauthorized returns error for all authenticated mutations)

### Quality Loop (per file)

```bash
# After creating each test file:
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task03-1","files":["frontend/common/graphql/test/certificates/certificate-query.test.ts"]}'
# GraphQL tests require dev server — use test runner
bun run scripts/run-test/run-test.ts frontend/common/graphql/test/certificates/certificate-query.test.ts
```

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — GraphQL Document Conventions
- `frontend/common/graphql/test/AGENTS.md` — GraphQL test rules (critical: no backend imports, testClient, errorPolicy, assertOperationDenied)
- `frontend/common/graphql/test/billing/billing-management.test.ts` — Reference GraphQL test
- `frontend/common/graphql/sharedDocuments/AGENTS.md` — Document conventions
- `frontend/AGENTS.md` — Frontend rules
- `.github/instructions/tests.instructions.md` — Test patterns
- `.github/instructions/frontend.instructions.md` — Frontend patterns
- `siraj_analysis/10-testing-quality-patterns.md` — Test patterns reference
- `siraj_analysis/04-services-graphql-patterns.md` — GraphQL patterns reference
- Read Task 2 outcome file: `outcome/task02-outcome.md`

### Requirements Reference

- REQ-10-08: GraphQL query tests (certificates list with auth, certificate by ID, verifyCertificate public/no-auth)
- REQ-10-09: GraphQL mutation tests (generateCertificate, revokeCertificate, createTemplate, publishTemplate, auth scope permission gating)

### Outcome File

Write `outcome/task03-outcome.md` after completion:
- Implementation Summary
- Research Findings (GraphQL document names, testClient behavior, error patterns)
- Pitfalls Encountered (dev server lifecycle, errorPolicy quirks, provisioning)
- Carry-Over Points for Task 4 (known test failures to fix)
- Files Created/Modified

---

## Task 4: Run All Tests and Fix Failures (via run-test.ts Script)

**Estimated time**: 2–3 hours
**Requirements**: REQ-10-01 through REQ-10-09

### Objective

Execute all certificate tests (repository, service, GraphQL), identify failures, and fix them. Use `run-test.ts` script for DB tests and standard test runner for GraphQL tests.

### Tasks

- [ ] 4.1 Run all repository tests (7 files)
  ```bash
  for f in backend/db/test/repo/certificates/*.test.ts; do
    bun run scripts/run-test/run-test.ts "$f"
  done
  ```
  Or batch: `bun run test:db` (runs all DB tests in parallel)
  Review results: `bun run scripts/run-test/run-test.ts --last <path>`

- [ ] 4.2 Run all service tests (4 files)
  ```bash
  for f in backend/db/test/logic/certificates/*.test.ts; do
    bun run scripts/run-test/run-test.ts "$f"
  done
  ```

- [ ] 4.3 Run all GraphQL integration tests (2 files)
  ```bash
  bun test frontend/common/graphql/test/certificates/
  # Or:
  bun run test:graphql
  ```

- [ ] 4.4 Fix all failures
  - Common failure types:
    1. **Deadlock** → Check for mixed `tx` and `db` calls inside `runInRollback`. Fix: ensure ALL repo/service calls receive `tx`.
    2. **Error message mismatch** → Check `expectRepoError` substring. Fix: lower-case the expected substring and compare against `error.message.toLowerCase()`.
    3. **Entity setup missing** → Check helper signature. Fix: verify `entity-setup.ts` exports and use correct destructuring.
    4. **GraphQL type errors** → Run `bun codegen` again. Fix: import correct types from `generated/`.
    5. **Permission denied** → Check `loginAndProvision` prefix and provisioning. Fix: ensure provisioning creates necessary permissions.
    6. **Seed data dependency** → Never query seed data. Fix: create all test data via entity-setup helpers.
  - Re-run after each fix until ALL tests pass.

- [ ] 4.5 Verify 100% repository coverage
  ```bash
  bun test --coverage backend/db/test/repo/certificates/
  ```
  Coverage must be 100% for all repo methods.

### Quality Loop

```bash
# After fixing each failing test:
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task04-fix","files":["<fixed-file>"]}'
# Re-run the specific test:
bun run scripts/run-test/run-test.ts <test-path>
```

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — Database Testing Critical Rules, Test Runner section
- `backend/db/test/logic/AGENTS.md` — Debugging patterns
- `scripts/run-test/run-test.ts` — Test runner script behavior
- `siraj_analysis/10-testing-quality-patterns.md` — Test patterns reference
- Read Task 3 outcome file: `outcome/task03-outcome.md`

### Requirements Reference

- REQ-10-01 through REQ-10-03: All repository tests passing
- REQ-10-04 through REQ-10-07: All service tests passing
- REQ-10-08, REQ-10-09: All GraphQL tests passing

### Outcome File

Write `outcome/task04-outcome.md` after completion:
- Implementation Summary (test counts: total, passed, fixed)
- Research Findings (failure patterns discovered, root causes)
- Pitfalls Encountered (deadlocks, type mismatches, provisioning issues — with resolutions)
- Carry-Over Points for Task 5+ (documentation insights from test failures)
- Files Created/Modified

---

## Task 5: Create `docs/certificates/overview.md` Canonical Reference

**Estimated time**: 2–3 hours
**Requirements**: REQ-10-11

### Objective

Create the canonical certificate feature reference document that serves as the entry point for developers and AI agents. Covers architecture, entities, permissions, data flow, and key design decisions.

### Tasks

- [ ] 5.1 Create `docs/certificates/` directory
- [ ] 5.2 Create `docs/certificates/overview.md` with sections:
  - Architecture (layer diagram, data flow: Client → Apollo → GraphQL → Service → Repo → DB)
  - Plan-to-feature mapping table (Plans 01–09 → implemented files)
  - Entities (entity relationship summary, table list from Plan 01 schema)
  - Permissions (permission table with scope from Plan 02 enum)
  - Key design decisions:
    - Idempotency (unique index + catch pattern)
    - Template versioning (snapshot + publish lifecycle)
    - Soft-delete (deletedAt + RLS)
    - Public verification (no-auth + RLS for public insert)
    - Variable resolution (student profile → template variables)
    - Feature 6 (Outcome Knowledge Base & Progress Tracking)
  - References (links to other docs, backend paths, frontend paths)

### Quality Loop

```bash
# Documentation does not require tsgo/biome/lint unless project has docs linting
# Verify markdown formatting:
bun biome:check docs/certificates/overview.md  # If biome covers md
# Verify no broken links (manual review)
```

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — File Organization, Important References
- `siraj_analysis/01-db-schema-patterns.md` — Schema overview
- `siraj_analysis/04-services-graphql-patterns.md` — Service overview
- All Plan 01–09 requirements.md files — for feature mapping
- Read Task 4 outcome file: `outcome/task04-outcome.md`

### Requirements Reference

- REQ-10-11: Create canonical reference doc at `docs/certificates/overview.md`

### Outcome File

Write `outcome/task05-outcome.md` after completion:
- Implementation Summary
- Research Findings (architecture decisions documented, cross-plan mapping)
- Carry-Over Points for Task 6 (PDF rendering details to reference)
- Files Created/Modified

---

## Task 6: Create `docs/certificates/pdf-rendering.md` Documentation

**Estimated time**: 2 hours
**Requirements**: REQ-10-12

### Objective

Document the certificate PDF rendering pipeline, including technology choices, data flow, i18n/RTL handling, error handling, and storage.

### Tasks

- [ ] 6.1 Create `docs/certificates/pdf-rendering.md` with sections:
  - Technology (rendering engine from Plan 06, font handling for Arabic/English)
  - Data Flow (Template → Element Resolution → Variable Substitution → PDF Generation → Storage)
  - Template-to-PDF (element rendering order by z_index, page setup, QR code generation)
  - i18n / RTL (right-to-left rendering for Arabic, font selection per locale)
  - Error Handling (retry strategy, error states, user feedback)
  - Storage (where PDFs are saved, storage service integration)
  - Performance (rendering time expectations, batch generation)

### Quality Loop

No code quality checks needed for documentation. Verify:
- Markdown formatting is clean
- All cross-references link to correct files
- No broken internal links

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — Important References
- Plan 06 requirements.md + design.md — PDF rendering implementation details
- `siraj_analysis/04-services-graphql-patterns.md` — Service patterns
- Read Task 5 outcome file: `outcome/task05-outcome.md`

### Requirements Reference

- REQ-10-12: Create PDF rendering documentation at `docs/certificates/pdf-rendering.md`

### Outcome File

Write `outcome/task06-outcome.md` after completion:
- Implementation Summary
- Research Findings (rendering pipeline decisions, font/RTL handling)
- Carry-Over Points for Task 7 (template management context)
- Files Created/Modified

---

## Task 7: Create `docs/certificates/template-management.md` Documentation

**Estimated time**: 2 hours
**Requirements**: REQ-10-13

### Objective

Document the certificate template management system, including the data model, element types, variable types, versioning, UI architecture, and permissions.

### Tasks

- [ ] 7.1 Create `docs/certificates/template-management.md` with sections:
  - Data Model (Templates → Elements → Variables → Versions relationship)
  - Element Types (TEXT, IMAGE, QR_CODE, SIGNATURE, SHAPE — config schema per type)
  - Variable Types (TEXT, DATE, NAME, EMAIL, CUSTOM — resolution pipeline)
  - Versioning (snapshot mechanism, publish lifecycle: DRAFT → PUBLISHED → ARCHIVED, version increment rules)
  - UI Architecture (template editor views from Plan 07, desktop/mobile isolation)
  - Permissions (CERTIFICATES_MANAGE_TEMPLATE)
  - References (TemplateManagementService, TemplateRepository paths)

### Quality Loop

No code quality checks needed for documentation. Verify:
- Markdown formatting is clean
- All cross-references link to correct files
- No broken internal links

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — Important References
- Plan 03 requirements.md + design.md — Repository design for templates
- Plan 04 requirements.md + design.md — Service design for template management
- Plan 07 requirements.md + design.md — UI architecture for template editor
- `siraj_analysis/04-services-graphql-patterns.md` — Service patterns
- Read Task 6 outcome file: `outcome/task06-outcome.md`

### Requirements Reference

- REQ-10-13: Create template management documentation at `docs/certificates/template-management.md`

### Outcome File

Write `outcome/task07-outcome.md` after completion:
- Implementation Summary
- Research Findings (versioning patterns, element/variable type documentation)
- Carry-Over Points for Task 8 (verification system context)
- Files Created/Modified

---

## Task 8: Create `docs/certificates/verification.md` Documentation

**Estimated time**: 2 hours
**Requirements**: REQ-10-14

### Objective

Document the public certificate verification system, including the verification flow, public access model, status types, event logging, GraphQL API, and privacy considerations.

### Tasks

- [ ] 8.1 Create `docs/certificates/verification.md` with sections:
  - Verification Flow (code lookup → status check → response)
  - Public Access Model (no authentication required, RLS allows public INSERT on certificate_verifications)
  - Verification Status (VALID, INVALID, EXPIRED, REVOKED — from Plan 02 enum)
  - Event Logging (IP, User-Agent, timestamp, verified-by nullable)
  - GraphQL API (verifyCertificate query from Plan 05, return shape)
  - Service Layer (CertificateVerificationService from Plan 04, method signatures)
  - Verification UI (public page route from Plan 08)
  - Privacy (what data is exposed, what PII is withheld)

### Quality Loop

No code quality checks needed for documentation. Verify:
- Markdown formatting is clean
- All cross-references link to correct files
- No broken internal links

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — Important References
- Plan 02 requirements.md — VerificationStatus enum
- Plan 03 requirements.md — VerificationRepository design
- Plan 04 requirements.md — CertificateVerificationService design
- Plan 05 requirements.md — verifyCertificate GraphQL query
- Plan 08 requirements.md — Verification UI page
- `siraj_analysis/04-services-graphql-patterns.md` — Service patterns
- Read Task 7 outcome file: `outcome/task07-outcome.md`

### Requirements Reference

- REQ-10-14: Create verification documentation at `docs/certificates/verification.md`

### Outcome File

Write `outcome/task08-outcome.md` after completion:
- Implementation Summary
- Research Findings (verification flow, privacy constraints, public access model)
- Carry-Over Points for Task 9 (documentation insights for AGENTS.md updates)
- Files Created/Modified

---

## Task 9: Update All Layer AGENTS.md Files with Certificate Rules

**Estimated time**: 3–4 hours
**Requirements**: REQ-10-15

### Objective

Add certificate-specific rules, patterns, and references to all 11 layer-level AGENTS.md files. Updates are additive — no existing content is removed.

### Tasks

- [ ] 9.1 Update `backend/db/repo/AGENTS.md`
  - Add "Certificate Repositories" section
  - Document: 7 repos in `backend/db/repo/certificates/`
  - Key patterns: idempotency catch, version snapshots, `text[]` studentIds, no soft-delete on verification
  - Feature 6: OutcomeRepository methods

- [ ] 9.2 Update `backend/services/AGENTS.md`
  - Add "Certificate Services" section
  - Document: 4 services in `backend/services/certificates/`
  - Key patterns: namespace pattern, permission gating, localization, public endpoint exception
  - Feature 6: outcome linking, progress tracking

- [ ] 9.3 Update `backend/graphql/AGENTS.md`
  - Add "Certificate GraphQL" section
  - Document: `backend/graphql/pothos/certificates/`
  - Key patterns: public query exception, enum registration, DataLoader batching, input types

- [ ] 9.4 Update `backend/types/AGENTS.md`
  - Add "Certificate Types" section
  - Document: certificate types in `backend/types/`
  - Key patterns: SelectType/InsertType/ReturnType/SubmitInput per entity, Feature 6 types

- [ ] 9.5 Update `backend/db/schema/AGENTS.md` (if exists, else create)
  - Add "Certificate Schema" section
  - Key patterns: jsonb config columns, `text[]` arrays, self-referencing categories, unique indexes
  - Feature 6: outcomes and progress tables

- [ ] 9.6 Update `frontend/AGENTS.md`
  - Add "Certificate Frontend" section
  - Document: certificate views, stores, Apollo documents
  - Key patterns: MUI v9 usage, Apollo hooks, Zustand certificate stores

- [ ] 9.7 Update `frontend/views/AGENTS.md`
  - Add "Certificate Views" section
  - Document: certificate view components
  - Key patterns: desktop/mobile isolation, template editor, verification page

- [ ] 9.8 Update `shared/AGENTS.md`
  - Add "Certificate i18n Namespace" section
  - Document: `shared/locale/cert/` namespace
  - Key patterns: compile-time TypeScript i18n, ar/en parity, Feature 6 labels

- [ ] 9.9 Update `backend/enum/AGENTS.md` (if exists)
  - Add certificate enums: CertificateStatus, TemplateStatus, TemplateElementType, TemplateVariableType, CertificateOrientation, VerificationStatus, CertificateFeature6 enums

- [ ] 9.10 Update `frontend/common/graphql/AGENTS.md`
  - Add certificate document conventions (sharedDocuments/certificates/)

- [ ] 9.11 Update `frontend/common/graphql/sharedDocuments/AGENTS.md`
  - Add certificate document naming and organization patterns

### Quality Loop (per file)

```bash
# After updating each AGENTS.md:
bun tsgo                                                    # Type check (AGENTS.md is referenced by TS configs)
bun biome:check                                              # Format check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task09-1","files":["backend/db/repo/AGENTS.md"]}'
```

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — Overall structure
- Each target AGENTS.md file — existing format and content to match style
- `siraj_analysis/03-repository-patterns.md` — Repo patterns
- `siraj_analysis/04-services-graphql-patterns.md` — Service/GraphQL patterns
- `docs/certificates/overview.md` — Canonical reference (created in Task 5)
- Read Task 8 outcome file: `outcome/task08-outcome.md`

### Requirements Reference

- REQ-10-15: Update all layer AGENTS.md files with certificate-specific rules (11+ files)

### Outcome File

Write `outcome/task09-outcome.md` after completion:
- Implementation Summary
- Research Findings (existing AGENTS.md formats, new patterns added)
- Pitfalls Encountered (style mismatches, cross-reference issues)
- Carry-Over Points for Task 10 (root AGENTS.md references needed)
- Files Created/Modified

---

## Task 10: Update Root AGENTS.md, Skills, and Instruction Files

**Estimated time**: 2–3 hours
**Requirements**: REQ-10-15

### Objective

Update the root AGENTS.md Important References section to link to the new certificate docs. Update instruction files if new backend/frontend test conventions were introduced.

### Tasks

- [ ] 10.1 Update root `AGENTS.md` — Important References section
  Add after existing references:
  ```markdown
  - `docs/certificates/overview.md` - Certificate feature canonical reference
  - `docs/certificates/pdf-rendering.md` - Certificate PDF rendering pipeline
  - `docs/certificates/template-management.md` - Certificate template editor & versioning
  - `docs/certificates/verification.md` - Public certificate verification system
  ```

- [ ] 10.2 Update `.github/instructions/backend.instructions.md` (if new backend conventions)
  - Add certificate namespace pattern if it introduces conventions not already covered
  - Add idempotency Key note if new convention
  - Only update if genuinely new patterns were established (don't duplicate existing rules)

- [ ] 10.3 Update `.github/instructions/frontend.instructions.md` (if new frontend conventions)
  - Add certificate Apollo document import patterns if new
  - Add certificate MUI component patterns if new
  - Only update if genuinely new patterns (don't duplicate)

- [ ] 10.4 Update `.github/instructions/tests.instructions.md` (if new test patterns)
  - Add: "Certificate tests use `runInRollback` + `tx` propagation; GraphQL tests in `test/certificates/` subdirectory"
  - Add: "Repository tests must achieve 100% method coverage"
  - Add: "Use `run-test.ts` script for DB tests (not raw `bun test`)"

### Quality Loop

```bash
bun tsgo
bun biome:check
# Lint root AGENTS.md:
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task10","files":["AGENTS.md",".github/instructions/backend.instructions.md",".github/instructions/frontend.instructions.md",".github/instructions/tests.instructions.md"]}'
```

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — Current Important References section
- `.github/instructions/backend.instructions.md` — Current backend instructions
- `.github/instructions/frontend.instructions.md` — Current frontend instructions
- `.github/instructions/tests.instructions.md` — Current test instructions
- All Task 5–9 outcome files — for insights on what patterns were established
- Read Task 9 outcome file: `outcome/task09-outcome.md`

### Requirements Reference

- REQ-10-15: Update root AGENTS.md and instruction files

### Outcome File

Write `outcome/task10-outcome.md` after completion:
- Implementation Summary
- Research Findings (new conventions established, instruction gaps filled)
- Carry-Over Points for Task 11 (files modified for quality validation)
- Files Created/Modified

---

## Task 11: Quality Validation (bun tsgo, bun biome:check, bun run lint — 0 errors)

**Estimated time**: 2 hours
**Requirements**: REQ-10-17

### Objective

Run full quality validation across all files created/modified in Tasks 1–10. Ensure zero type errors, zero biome issues, and zero lint errors.

### Tasks

- [ ] 11.1 Run `bun tsgo` — must exit with 0 errors
  ```bash
  bun tsgo
  ```
  If errors: fix TypeScript issues in test files, doc imports, or AGENTS.md references

- [ ] 11.2 Run `bun biome:check` — must exit with 0 errors
  ```bash
  bun biome:check
  ```
  If errors: fix formatting issues (run `bun run format` for auto-fix)

- [ ] 11.3 Start lint queue server and run `bun run lint` — must exit with 0 errors
  ```bash
  # Start queue server (background, detached)
  ~/.bun/bin/bun run scripts/lint-queue-server.ts &
  sleep 3
  # Verify server is running
  export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
  curl -s http://localhost:${LINT_QUEUE_PORT}/status
  # Run full-repo lint
  bun run lint
  ```
  If errors: fix ESLint issues in test files, docs, AGENTS.md files

- [ ] 11.4 Re-run all certificate tests to confirm they still pass after quality fixes
  ```bash
  # Repository + service tests
  bun run test:db
  # GraphQL tests
  bun run test:graphql
  ```

- [ ] 11.5 Verify 100% repository coverage
  ```bash
  bun test --coverage backend/db/test/repo/certificates/
  ```

### Quality Loop

This task IS the quality loop. If any check fails:
1. Identify the failing file(s)
2. Fix the issue(s)
3. Re-run the specific check
4. Repeat until all pass

### Instruction Verification

Read BEFORE starting:
- `AGENTS.md` (root) — Code Quality Workflow, Lint Queue Server, Quality Gates
- Read Task 10 outcome file: `outcome/task10-outcome.md`

### Requirements Reference

- REQ-10-17: Quality validation — bun tsgo (0 errors), bun biome:check (0 errors), bun run lint (0 errors)

### Outcome File

Write `outcome/task11-outcome.md` after completion:
- Implementation Summary (quality gate results: tsgo ✓, biome ✓, lint ✓, tests ✓, coverage ✓)
- Research Findings (common quality issues and resolutions)
- Carry-Over Points for Task 12 (final knowledge transfer inputs)
- Files Created/Modified

---

## Task 12: Knowledge Propagation Outcome File

**Estimated time**: 2 hours
**Requirements**: REQ-10-16, REQ-10-00

### Objective

Create the final knowledge transfer file that synthesizes all outcome files from Tasks 1–11 into a comprehensive reference for future agents and developers.

### Tasks

- [ ] 12.1 Read ALL outcome files (task01-outcome.md through task11-outcome.md)
- [ ] 12.2 Create `outcome/00-knowledge-transfer-final.md` with sections:

  ```markdown
  # Certificate Testing & Knowledge Transfer — Final Summary

  ## All Test Files
  - [Complete list: 7 repo tests, 4 service tests, 2 GraphQL test files, 1 i18n test]
  - [Paths and brief description of what each covers]

  ## Documentation Created
  - docs/certificates/overview.md — [description]
  - docs/certificates/pdf-rendering.md — [description]
  - docs/certificates/template-management.md — [description]
  - docs/certificates/verification.md — [description]

  ## AGENTS.md Updates
  - [List of 11+ files with section names added]

  ## Instruction File Updates
  - [List of instruction files updated with what was added]

  ## Key Patterns Established
  - [runInRollback + tx propagation for certificate DB tests]
  - [try/catch error helper (expectRepoError) for error assertions]
  - [testClient + setupTestServerLifecycle for GraphQL tests]
  - [entity-setup.ts helpers for test data creation]
  - [100% repository coverage methodology]
  - [Feature 6 outcome + progress tracking test patterns]
  - [Custom higher-order test wrappers for CodeScene compliance]

  ## Lessons Learned
  - [Cross-cutting insights from all tasks]
  - [Pitfalls and resolutions]

  ## References for Future Work
  - docs/certificates/overview.md — Start here
  - AGENTS.md — Updated Important References
  - backend/db/repo/AGENTS.md — Certificate repo patterns
  - backend/services/AGENTS.md — Certificate service patterns
  - backend/graphql/AGENTS.md — Certificate GraphQL patterns
  - frontend/common/graphql/test/AGENTS.md — Certificate test patterns
  ```

- [ ] 12.3 Verify all cross-references in the final file link to correct paths
- [ ] 12.4 Verify the file is discoverable: referenced from `docs/certificates/overview.md` and root `AGENTS.md`

### Quality Loop

```bash
# Verify markdown formatting
bun biome:check outcome/00-knowledge-transfer-final.md  # If biome covers md
# Verify no broken links (manual review)
```

### Instruction Verification

Read BEFORE starting:
- ALL outcome files: `outcome/task01-outcome.md` through `outcome/task11-outcome.md`
- `AGENTS.md` (root) — AI Agent Communication Rules, Important References
- `docs/certificates/overview.md` — Canonical reference
- Read Task 11 outcome file: `outcome/task11-outcome.md`

### Requirements Reference

- REQ-10-16: Feature 6 outcome knowledge base — knowledge propagation outcome file
- REQ-10-00: Execution outcome protocol — each task writes outcome, next task reads it, final task synthesizes

### Outcome File

This task's output IS the final outcome file. No separate outcome file needed.

---

## Summary

| Task | Title | Est. Time | Requirements |
|------|-------|-----------|--------------|
| 1 | Create certificate repository tests (7 repos) | 3–4h | REQ-10-01, 02, 03 |
| 2 | Create service tests (4 services) | 3–4h | REQ-10-04, 05, 06, 07 |
| 3 | Create GraphQL integration tests (queries + mutations) | 3–4h | REQ-10-08, 09 |
| 4 | Run all tests and fix failures | 2–3h | REQ-10-01–09 |
| 5 | Create `docs/certificates/overview.md` | 2–3h | REQ-10-11 |
| 6 | Create `docs/certificates/pdf-rendering.md` | 2h | REQ-10-12 |
| 7 | Create `docs/certificates/template-management.md` | 2h | REQ-10-13 |
| 8 | Create `docs/certificates/verification.md` | 2h | REQ-10-14 |
| 9 | Update all layer AGENTS.md files (11+) | 3–4h | REQ-10-15 |
| 10 | Update root AGENTS.md, skills, instruction files | 2–3h | REQ-10-15 |
| 11 | Quality validation (tsgo, biome, lint — 0 errors) | 2h | REQ-10-17 |
| 12 | Knowledge propagation outcome file | 2h | REQ-10-00, 16 |

**Total estimated time**: 27–36 hours (3.4–4.5 days)
