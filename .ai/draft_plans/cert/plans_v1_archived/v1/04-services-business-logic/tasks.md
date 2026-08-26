# Plan 04 — Services & Business Logic: Trackable Tasks

## Document Information

- **Feature Name**: Certificate Generation & Verification — Service Layer
- **Plan Number**: 04 (Services & Business Logic)
- **Version**: 1.0
- **Date**: 2026-08-01
- **Related Documents**:
  - [Requirements](./requirements.md)
  - [Design](./design.md)
- **Outcome Directory**: `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/`

---

## Non-Negotiable Execution Protocol

1. **Read AGENTS.md before coding**: Before writing any file in `backend/services/`, read:
   - `AGENTS.md` (root)
   - `backend/services/AGENTS.md`
   - `backend/AGENTS.md`

2. **Per-File Verification Loop**: After writing each service file, run:
   ```bash
   bun tsgo         # Type check
   bun biome:check   # Format + lint
   # Lint via queue client:
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"task-N","files":["backend/services/certificates/<file>"]}'
   ```

3. **Instruction Verification**: After each task, run:
   ```bash
   bun run scripts/health/sub-loop.ts backend/services/certificates/<file> --lifecycle lint
   ```
   This verifies tsgo → biome → lint sequentially and short-circuits at first failure.

4. **Outcome File**: After completing each task, create an outcome file at:
   ```
   .ai/draft_plans/cert/plans/04-services-business-logic/outcome/<NN>-<task-name>-outcome.md
   ```
   Following the template in `design.md` → Outcome & Knowledge Transfer Protocol.

5. **Requirements Traceability**: Every task references the requirements it fulfills using `_Requirements: REQ-04-XX_` notation.

6. **No Hardcoded Strings**: All error messages use `tErrors.cert.*` keys from `shared/locale/messages/{ar,en}/errors.cert.ts`.

7. **No console.\***

8. **No GraphQLError in services**

9. **Path aliases**: All imports use `@/` prefix, never relative `./` or `../`

---

## Task Status Legend

- [ ] **Not Started** — Task has not been picked up
- [~] **In Progress** — Task is actively being worked on
- [x] **Complete** — Task is done, quality loop passed, outcome file written
- [!] **Blocked** — Task is blocked by a dependency (document in outcome file)

---

## Task 1: Create `template-management.service.ts`

**Estimated Time**: 3-4 hours
_Difficulty: Medium_

### Description

Create `backend/services/certificates/template-management.service.ts` implementing the `TemplateManagementService` namespace with CRUD operations, version management, and status transitions (publish/archive).

### Steps

1. **Read instruction files**:
   - `backend/services/AGENTS.md`
   - `backend/AGENTS.md`
   - `.agents/instructions/backend.instructions.md`

2. **Read reference files**:
   - `backend/services/billing/billing-management.service.ts` — namespace + idempotency + permission pattern
   - `backend/services/cache/EntityCacheService.ts` — `cachedReadSingleFlight` and `invalidateByTag` signatures
   - `.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md` — §B (service patterns), §D.1-D.2 (template management blueprint)

3. **Create the file** with these exported functions inside `export namespace TemplateManagementService`:
   - `create(actorUserId, input, tErrors, locale?)` — REQ-04-01
   - `update(actorUserId, input, tErrors, locale?)` — REQ-04-02
   - `publish(actorUserId, input, tErrors, locale?)` — REQ-04-03 (creates version snapshot, invalidates cache)
   - `archive(actorUserId, input, tErrors, locale?)` — REQ-04-04 (invalidates cache)
   - `getById(actorUserId, input, tErrors, locale?)` — REQ-04-02 (gated read)
   - `listVersions(actorUserId, input, tErrors, locale?)` — REQ-04-05

4. **Implement helpers**:
   - `requirePermission(actorUserId, AppPermission.CERTIFICATES_MANAGE_TEMPLATE, tErrors)` — shared helper
   - Validate `name` length (3-255), `layoutConfig` non-null
   - `invalidateCertificateTemplateWrite(templateId)` import from `./cache-helpers`

5. **Wire side-effects**:
   - Audit logs via `AuditService.createManyAuditLogs` in `try/catch` for publish and archive
   - Cache invalidation via `invalidateCertificateTemplateWrite` on publish and archive

6. **Type imports**: All from `@/backend/types/template.types` and `@/backend/types/template-version.types`

7. **Quality Loop**:
   ```bash
   bun tsgo
   bun biome:check
   export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"task1","files":["backend/services/certificates/template-management.service.ts"]}'
   ```

8. **Instruction Verification**:
   ```bash
   bun run scripts/health/sub-loop.ts backend/services/certificates/template-management.service.ts --lifecycle lint
   ```

### Acceptance Criteria

- [ ] Namespace `TemplateManagementService` exported with all 6 functions
- [ ] Each function follows `(actorUserId, input, tErrors, locale?)` signature
- [ ] `requirePermission` gates all functions
- [ ] `publish` creates a `TemplateVersion` snapshot, sets status to `PUBLISHED`, invalidates cache
- [ ] `archive` sets status to `ARCHIVED`, invalidates cache
- [ ] `DRAFT`-only edit enforcement (REQ-04-02)
- [ ] Audit logs for publish and archive
- [ ] No hardcoded error strings — all via `tErrors.cert.*`
- [ ] No `console.*` — use `logger` from `@/backend/lib/logger`
- [ ] No `GraphQLError` thrown
- [ ] All imports use `@/` path aliases
- [ ] `tsgo` passes clean
- [ ] `biome:check` passes clean
- [ ] Lint passes clean

### Outcome File

Write `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/01-template-management-outcome.md`

_Requirements: REQ-04-01, REQ-04-02, REQ-04-03, REQ-04-04, REQ-04-05_

---

## Task 2: Create `recipient-group.service.ts`

**Estimated Time**: 2-3 hours
_Difficulty: Medium_

### Description

Create `backend/services/certificates/recipient-group.service.ts` implementing the `RecipientGroupService` namespace with group creation, student assignment, variable resolution, and a batch method for DataLoader.

### Steps

1. **Read instruction files**:
   - `backend/services/AGENTS.md`
   - `backend/AGENTS.md`
   - `.agents/instructions/backend.instructions.md`

2. **Read reference files**:
   - `backend/services/billing/billing-management.service.ts` — batch pattern, permission helper
   - `.ai/draft_plans/cert/cgvs_analysis/06-student-recipient.md` — recipient group model, student-to-group binding, per-recipient variables
   - `.ai/draft_plans/cert/cgvs_analysis/01-generation-logic.md` — §5 variable system, §6 recipient assignments

3. **Create the file** with these exported functions:
   - `create(actorUserId, input, tErrors, locale?)` — REQ-04-06
   - `getById(actorUserId, input, tErrors, locale?)` — gated read
   - `assignStudents(actorUserId, input, tErrors, locale?)` — REQ-04-07 (batch, skip duplicates)
   - `resolveVariables(actorUserId, input, tErrors, locale?)` — REQ-04-08 (student-sourced + custom + certificate-sourced)
   - `resolveRecipientGroupIdsForTemplates(templateIds)` — REQ-04-20 (batch, no auth)

4. **Implement variable resolution**:
   - `mapStudentField(studentData, sourceField)` — maps student record fields to variable keys
   - Handle `STUDENT` sourceType → read from student record
   - Handle `VARIABLE` sourceType → read from `RecipientGroupItemVariableValue`
   - Handle `CERTIFICATE` sourceType → placeholder (resolved at generation time)
   - Throw `Error(tErrors.cert.missingRequiredVariable(recipientId, variableName))` for missing required vars

5. **Implement student assignment**:
   - Check existing students, skip duplicates, build `skipped` array
   - Audit log via `AuditService.createManyAuditLogs`

6. **Quality Loop**:
   ```bash
   bun tsgo
   bun biome:check
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"task2","files":["backend/services/certificates/recipient-group.service.ts"]}'
   ```

7. **Instruction Verification**:
   ```bash
   bun run scripts/health/sub-loop.ts backend/services/certificates/recipient-group.service.ts --lifecycle lint
   ```

### Acceptance Criteria

- [ ] Namespace `RecipientGroupService` exported with all 5 functions
- [ ] `assignStudents` returns `{ assignedCount, skipped }` — no throw on duplicates
- [ ] `resolveVariables` returns `Map<string, Record<string, string>>` keyed by studentId
- [ ] `resolveVariables` handles all three `sourceType` cases (STUDENT, VARIABLE, CERTIFICATE)
- [ ] `resolveVariables` throws for missing required variables
- [ ] Batch method `resolveRecipientGroupIdsForTemplates` returns `Map<string, T[] | null>`
- [ ] All functions follow `(actorUserId, input, tErrors, locale?)` signature (except batch)
- [ ] Permission gating via `CERTIFICATES_MANAGE_TEMPLATE`
- [ ] Audit log on student assignment
- [ ] No hardcoded strings — all via `tErrors.cert.*`
- [ ] No `console.*`
- [ ] No `GraphQLError`
- [ ] `@/` path aliases
- [ ] tsgo + biome + lint pass

### Outcome File

Write `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/02-recipient-group-outcome.md`

_Requirements: REQ-04-06, REQ-04-07, REQ-04-08, REQ-04-20_

---

## Task 3: Create `certificate-management.service.ts`

**Estimated Time**: 2-3 hours
_Difficulty: Medium_

### Description

Create `backend/services/certificates/certificate-management.service.ts` implementing the `CertificateManagementService` namespace with listing, getById, revocation, download URL resolution, and a batch method for DataLoader.

### Steps

1. **Read instruction files**:
   - `backend/services/AGENTS.md`
   - `backend/AGENTS.md`
   - `.agents/instructions/backend.instructions.md`

2. **Read reference files**:
   - `backend/services/billing/billing-management.service.ts` — notification dispatch, cache, audit
   - `backend/services/cache/EntityCacheService.ts` — `cachedReadSingleFlight` usage
   - `.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md` — §B.7 (caching), §C.11 (batch), §D.3-D.5

3. **Create the file** with these exported functions:
   - `listCertificates(actorUserId, input, tErrors, locale?)` — REQ-04-14 (paginated, filtered)
   - `getById(actorUserId, input, tErrors, locale?)` — REQ-04-15
   - `revoke(actorUserId, input, tErrors, locale?)` — REQ-04-11 (status→REVOKED, invalidate cache, notify, audit)
   - `getDownloadUrl(actorUserId, input, tErrors, locale?)` — REQ-04-16 (cached, 5-min TTL)
   - `getCertificatesContexts(certificateIds)` — REQ-04-20 (batch, no auth)

4. **Implement revocation** (critical path):
   - `requirePermission(actorUserId, AppPermission.CERTIFICATES_REVOKE, tErrors)`
   - Validate `revocationReason` length >= 5
   - Check not already revoked
   - Update: `status=REVOKED`, `revokedAt=now()`, `revocationReason`
   - `invalidateCertificateWrite(certificateId)`
   - Best-effort notification: `buildCertificateRevokedPayloads` → `dispatchWithPreferences`
   - Best-effort audit: `AuditService.createManyAuditLogs`

5. **Implement download URL**:
   - `cachedReadSingleFlight` with key `ec:cert:dl:${certificateId}`, TTL 300s, tags `[cert:${certificateId}]`
   - Falls through to `StorageService.generateSignedDownloadUrl` on cache miss
   - Fail-open: cache errors don't block the download

6. **Create `cache-helpers.ts`** (if not already created in Task 1):
   - `invalidateCertificateWrite(certificateId)`
   - `invalidateCertificateTemplateWrite(templateId)`
   - Key builders: `certRenderCacheKey`, `certDownloadCacheKey`
   - All invalidations are fail-open (try/catch with logger.error)
   - Design §7 provides the full implementation

7. **Quality Loop**:
   ```bash
   bun tsgo
   bun biome:check
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"task3","files":["backend/services/certificates/certificate-management.service.ts","backend/services/certificates/cache-helpers.ts"]}'
   ```

8. **Instruction Verification**:
   ```bash
   bun run scripts/health/sub-loop.ts backend/services/certificates/certificate-management.service.ts --lifecycle lint
   bun run scripts/health/sub-loop.ts backend/services/certificates/cache-helpers.ts --lifecycle lint
   ```

### Acceptance Criteria

- [ ] Namespace `CertificateManagementService` exported with all 5 functions
- [ ] `revoke` validates reason length, checks existing status, updates fields, invalidates cache
- [ ] `revoke` dispatches `CERTIFICATE_REVOKED` notification (best-effort)
- [ ] `revoke` writes audit log (best-effort)
- [ ] `getDownloadUrl` uses `cachedReadSingleFlight` with 5-min TTL
- [ ] `getDownloadUrl` is fail-open (cache errors don't throw)
- [ ] `listCertificates` supports pagination + filtering
- [ ] Batch `getCertificatesContexts` returns `Map<string, T | null>`
- [ ] `cache-helpers.ts` created with `invalidateCertificateWrite`, `invalidateCertificateTemplateWrite`, key builders
- [ ] Permission before cache (authorization runs before `cachedRead`)
- [ ] No hardcoded strings — all via `tErrors.cert.*`
- [ ] No `console.*`
- [ ] No `GraphQLError`
- [ ] `@/` path aliases
- [ ] tsgo + biome + lint pass on both files

### Outcome File

Write `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/03-certificate-management-outcome.md`

_Requirements: REQ-04-11, REQ-04-14, REQ-04-15, REQ-04-16, REQ-04-17, REQ-04-20_

---

## Task 4: Create `certificate-generation.service.ts`

**Estimated Time**: 3-4 hours
_Difficulty: Hard_

### Description

Create `backend/services/certificates/certificate-generation.service.ts` implementing the `CertificateGenerationService` namespace — the orchestrration engine for certificate generation with idempotency, per-recipient variable resolution, PDF rendering delegation, and notification/audit side-effects.

### Steps

1. **Read instruction files**:
   - `backend/services/AGENTS.md`
   - `backend/AGENTS.md`
   - `.agents/instructions/backend.instructions.md`

2. **Read reference files**:
   - `backend/services/billing/billing-management.service.ts` — `deriveIdempotencyKey` pattern, duplicate key detection
   - `.ai/draft_plans/cert/cgvs_analysis/01-generation-logic.md` — §1 (pipeline), §4-6 (template elements, variable system, recipient assignments)
   - `.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md` — §B.8 (idempotency), §C.12 (notification/audit), §D.1 (generation blueprint)

3. **Create the file** with the export:
   - `generateCertificate(actorUserId, input, tErrors, locale?)` — REQ-04-09, REQ-04-10

4. **Implement the orchestration** (see design §5.2 for full pseudocode):
   - Validate template is `PUBLISHED` (throw `Error(tErrors.cert.templateNotPublished)`)
   - Get latest `TemplateVersion`
   - Resolve recipient group + all items
   - Call `RecipientGroupService.resolveVariables` for per-recipient variables
   - For each recipient in the group:
     a. Derive idempotency key (or use provided key + studentId suffix)
     b. Generate verification code via `randomBytes`
     c. Create certificate record (catch duplicate key → skip)
     d. Trigger `CertificateRendererService.renderPdf()` (delegated to Plan 06)
     e. Link PDF file path to certificate
     f. Roll back certificate on render failure
     g. Invalidate cache
     h. Best-effort notification (`CERTIFICATE_ISSUED` via `dispatchWithPreferences`)
     i. Best-effort audit log
   - Return `{ certificates, skipped }` batch result

5. **Implement helpers**:
   - `deriveCertificateIdempotencyKey({ templateId, templateVersionId, recipientGroupId, studentId })` — `sha256` of colon-joined parts
   - `generateVerificationCode()` — 12-char alphanumeric, `randomBytes`, no ambiguous chars
   - `isDuplicateKeyError(e)` — detect PostgreSQL 23505

6. **PDF Rendering Delegation**:
   - Import `CertificateRendererService` from `@/backend/services/certificates/renderer` (Plan 06 file)
   - If Plan 06 is not yet implemented, the import will fail at type-check time
   - For development before Plan 06, create a **temporary stub** `renderer.ts` with the correct interface and a placeholder implementation that returns `{ filePath: null }` — **delete the stub when Plan 06 lands**
   - Wrap the `renderPdf` call in try/catch — on failure, rollback cert record, add to skipped array

7. **Create `notification-payloads.builders.ts`** (if not already created):
   - `buildCertificateIssuedPayloads(certificateId, studentId, targetUserIds, locale)` — returns `NotificationPayload[]`
   - `buildCertificateRevokedPayloads(certificateId, studentId, revocationReason, targetUserIds, locale)`
   - Design §8 provides the full implementation

8. **Quality Loop**:
   ```bash
   bun tsgo
   bun biome:check
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"task4","files":["backend/services/certificates/certificate-generation.service.ts","backend/services/certificates/notification-payloads.builders.ts"]}'
   ```

9. **Instruction Verification**:
   ```bash
   bun run scripts/health/sub-loop.ts backend/services/certificates/certificate-generation.service.ts --lifecycle lint
   bun run scripts/health/sub-loop.ts backend/services/certificates/notification-payloads.builders.ts --lifecycle lint
   ```

### Acceptance Criteria

- [ ] Namespace `CertificateGenerationService` exported with `generateCertificate`
- [ ] Template `PUBLISHED` status validated before generation
- [ ] Idempotency key derived via `sha256` when not provided (REQ-04-10)
- [ ] Duplicate key (PostgreSQL 23505) detected and recipient skipped (not thrown)
- [ ] Verification code generated via `randomBytes` — 12 chars, no ambiguous chars
- [ ] Per-recipient variable resolution via `RecipientGroupService.resolveVariables`
- [ ] Missing required variables cause recipient to be skipped with `reason: "missing_variable"`
- [ ] PDF render failure rolls back certificate record and skips recipient
- [ ] `CERTIFICATE_ISSUED` notification dispatched (best-effort, fire-and-forget)
- [ ] Audit log written (best-effort)
- [ ] Cache invalidated after each certificate creation
- [ ] Returns `{ certificates, skipped }` batch result
- [ ] `notification-payloads.builders.ts` created with both payload builders
- [ ] No hardcoded strings — all via `tErrors.cert.*`
- [ ] No `console.*`
- [ ] No `GraphQLError`
- [ ] `@/` path aliases
- [ ] tsgo + biome + lint pass on both files

### Outcome File

Write `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/04-certificate-generation-outcome.md`

_Requirements: REQ-04-09, REQ-04-10, REQ-04-17, REQ-04-21, REQ-04-22_

---

## Task 5: Create `certificate-verification.service.ts`

**Estimated Time**: 1-2 hours
_Difficulty: Easy_

### Description

Create `backend/services/certificates/certificate-verification.service.ts` implementing the `CertificateVerificationService` namespace for public certificate verification by code and verification attempt logging.

### Steps

1. **Read instruction files**:
   - `backend/services/AGENTS.md`
   - `backend/AGENTS.md`
   - `.agents/instructions/backend.instructions.md`

2. **Read reference files**:
   - `.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md` — §D.6 (verification blueprint), §B.3 (SSR-safe)
   - `.ai/draft_plans/cert/cgvs_analysis/01-generation-logic.md` — verification code format reference

3. **Create the file** with these exported functions:
   - `verifyCertificate(actorUserId, input, tErrors, locale?, requestIp?)` — REQ-04-12 (public, no permission gating)
   - `logVerification(input)` — REQ-04-13 (best-effort, no auth)

4. **Implement verification**:
   - No `requirePermission` call (public endpoint)
   - `CertificateRepository.findByVerificationCode(verificationCode)`
   - Status mapping: `ISSUED→VALID`, `EXPIRED→EXPIRED`, `REVOKED→REVOKED`, not-found→`NOT_FOUND`
   - Return only public-safe fields (no `studentId`, `filePath`, internal metadata)
   - Call `logVerification` (best-effort)

5. **Implement attempt logging**:
   - `CertificateVerificationAttemptRepository.create({ verificationCode, result, ip, timestamp })`
   - Wrap in try/catch — logging failure does not block verification result

6. **Quality Loop**:
   ```bash
   bun tsgo
   bun biome:check
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"task5","files":["backend/services/certificates/certificate-verification.service.ts"]}'
   ```

7. **Instruction Verification**:
   ```bash
   bun run scripts/health/sub-loop.ts backend/services/certificates/certificate-verification.service.ts --lifecycle lint
   ```

### Acceptance Criteria

- [ ] Namespace `CertificateVerificationService` exported with `verifyCertificate` and `logVerification`
- [ ] `verifyCertificate` does NOT call `requirePermission` (public)
- [ ] Status mapping correct: `ISSUED→VALID`, `EXPIRED→EXPIRED`, `REVOKED→REVOKED`, `not-found→NOT_FOUND`
- [ ] Return object exposes only public-safe fields
- [ ] `verifyCertificate` accepts `requestIp` parameter for logging
- [ ] `logVerification` is best-effort (try/catch, does not throw)
- [ ] No hardcoded strings — all via `tErrors.cert.*`
- [ ] No `console.*`
- [ ] No `GraphQLError`
- [ ] `@/` path aliases
- [ ] tsgo + biome + lint pass

### Outcome File

Write `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/05-certificate-verification-outcome.md`

_Requirements: REQ-04-12, REQ-04-13_

---

## Task 6: Create Barrel `index.ts` + Register in `services/index.ts`

**Estimated Time**: 30 minutes
_Difficulty: Easy_

### Description

Create the barrel `index.ts` in `backend/services/certificates/` re-exporting all service namespaces, cache helpers, and notification payload builders. Register the barrel in the parent `backend/services/index.ts`.

### Steps

1. **Read** `backend/services/index.ts` to understand the existing barrel pattern

2. **Create** `backend/services/certificates/index.ts`:
   ```typescript
   export * from "./template-management.service";
   export * from "./recipient-group.service";
   export * from "./certificate-management.service";
   export * from "./certificate-generation.service";
   export * from "./certificate-verification.service";
   export * from "./cache-helpers";
   export * from "./notification-payloads.builders";
   ```

3. **Edit** `backend/services/index.ts` — add:
   ```typescript
   export * from "@/backend/services/certificates";
   ```
   Place it alphabetically or at the end following existing convention

4. **Quality Loop**:
   ```bash
   bun tsgo
   bun biome:check
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"task6","files":["backend/services/certificates/index.ts","backend/services/index.ts"]}'
   ```

5. **Instruction Verification**:
   ```bash
   bun run scripts/health/sub-loop.ts backend/services/certificates/index.ts --lifecycle lint
   ```

### Acceptance Criteria

- [ ] `backend/services/certificates/index.ts` re-exports all 5 service namespaces + cache helpers + notification builders
- [ ] `backend/services/index.ts` includes `export * from "@/backend/services/certificates"`
- [ ] No export conflicts (e.g., if two namespaces export a function with the same name, rename one or use `export * as`)
- [ ] All types, rebels, and constants from Plan 03 imports surface via barrel
- [ ] tsgo passes (no circular import or re-export conflicts)
- [ ] biome + lint pass

### Outcome File

Write `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/06-barrel-registration-outcome.md`

_Requirements: REQ-04-24 (total package exports follow canonical signature)_

---

## Task 7: Quality Loop — Per-File Verification

**Estimated Time**: 1-2 hours
_Difficulty: Easy_

### Description

Run a comprehensive per-file quality verification across all certificate service files to ensure each passes tsgo → biome → lint sequentially. Fix any issues found.

### Steps

1. **Ensure lint queue server is running**:
   ```bash
   ~/.bun/bin/bun run scripts/lint-queue-server.ts &
   sleep 2
   curl -s http://localhost:${LINT_QUEUE_PORT}/status
   ```

2. **Run per-file verification loop** for each file:
   ```bash
   for file in \
     backend/services/certificates/template-management.service.ts \
     backend/services/certificates/recipient-group.service.ts \
     backend/services/certificates/certificate-management.service.ts \
     backend/services/certificates/certificate-generation.service.ts \
     backend/services/certificates/certificate-verification.service.ts \
     backend/services/certificates/cache-helpers.ts \
     backend/services/certificates/notification-payloads.builders.ts \
     backend/services/certificates/index.ts; do
     echo "=== Verifying: $file ==="
     bun run scripts/health/sub-loop.ts "$file" --lifecycle lint
     if [ $? -ne 0 ]; then
       echo "FAILED: $file"
     fi
   done
   ```

3. **Fix any failures**:
   - tsgo failures → fix type errors in the file
   - biome failures → run `bun biome:check --write <file>` for auto-fix
   - lint failures → fix ESLint issues per error messages

4. **Run full tsgo**:
   ```bash
   bun tsgo
   ```
   Ensure no type errors across the project (not just cert files)

5. **Run full biome:check**:
   ```bash
   bun biome:check
   ```

6. **Verify no import cycles**:
   ```bash
   # If tsgo reports circular import warnings, refactor to break the cycle
   # Common: cache-helpers importing from service files → keep cache-helpers self-contained
   ```

### Acceptance Criteria

- [ ] Every file in `backend/services/certificates/` passes tsgo
- [ ] Every file passes biome:check
- [ ] Every file passes lint (via queue client)
- [ ] `sub-loop.ts` exits 0 for each file with `--lifecycle lint`
- [ ] No circular import warnings
- [ ] Full `bun tsgo` and `bun biome:check` pass across the project

### Outcome File

Write `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/07-quality-loop-outcome.md`

_Requirements: NFR-04-01 (SSR safety), NFR-04-02 (no GraphQLError), NFR-04-03 (types from backend/types), NFR-04-05 (permission before cache)_

---

## Task 8: Knowledge Propagation

**Estimated Time**: 1-2 hours
_Difficulty: Easy_

### Description

Update `backend/services/AGENTS.md` and `docs/services/entity-cache-service.md` with certificate service patterns, cache key conventions, and integration knowledge for future agents.

### Steps

1. **Read current state**:
   - `backend/services/AGENTS.md` — understand existing sections and structure
   - `docs/services/entity-cache-service.md` — understand existing examples

2. **Update `backend/services/AGENTS.md`** — add a new section `## Certificate Services`:

   ```markdown
   ## Certificate Services

   Certificate services live in `backend/services/certificates/` and follow the
   namespace-of-pure-functions pattern. Five namespaces cover the domain:

   - `TemplateManagementService` — template CRUD, version management, publish/archive
   - `RecipientGroupService` — recipient group management, student assignment, variable resolution
   - `CertificateManagementService` — certificate listing, revocation, download URL
   - `CertificateGenerationService` — generation orchestration with idempotency
   - `CertificateVerificationService` — public verification by code

   ### Key Conventions

   - **Service signature**: `(actorUserId, input, tErrors, locale?)` — SSR-safe, no GraphQL context
   - **Permission gating**: `requirePermission(actorUserId, AppPermission.CERTIFICATES_*, tErrors)`
   - **Idempotency**: `sha256(templateId:templateVersionId:recipientGroupId:studentId)` for certificate generation
   - **Cache keys**: `ec:v1:cert:render:${tvId}:${rgId}` (TTL 1h), `ec:v1:cert:dl:${certId}` (TTL 5min)
   - **Cache tags**: `cert:render`, `cert:tmpl:${templateId}`, `cert:${certificateId}`
   - **Cache invalidation**: `invalidateCertificateWrite(certId)`, `invalidateCertificateTemplateWrite(templateId)` — fail-open
   - **Notification**: `dispatchWithPreferences(payloads, userIds, locale).catch(e => logger.error(...))` — fire-and-forget
   - **Audit**: `AuditService.createManyAuditLogs([...])` in try/catch — best-effort
   - **PDF rendering**: Delegated to `CertificateRendererService.renderPdf()` (Plan 06)
   - **Duplicate key detection**: PostgreSQL error code `23505` → skip recipient in generation
   ```

3. **Update `docs/services/entity-cache-service.md`** — add certificate cache examples:

   ```markdown
   ### Certificate Cache Keys

   | Key Format | TTL | Tags | Purpose |
   |---|---|---|---|
   | `ec:v1:cert:render:${templateVersionId}:${recipientGroupId}` | 3600s (1h) | `cert:render`, `cert:tmpl:${templateId}` | Render result cache |
   | `ec:v1:cert:dl:${certificateId}` | 300s (5min) | `cert:${certificateId}` | Download URL cache |

   ### Certificate Cache Invalidation Helpers

   ```typescript
   // From backend/services/certificates/cache-helpers.ts
   invalidateCertificateTemplateWrite(templateId) // → invalidates cert:tmpl:${templateId} tag
   invalidateCertificateWrite(certificateId)       // → invalidates cert:${certificateId} tag
   ```

   Both helpers are **fail-open**: if the cache provider errors, the error is logged and swallowed.
   ```

4. **Update `backend/types/AGENTS.md`** (if it exists):
   - Add naming conventions: `CertificateReturnType`, `TemplateReturnType`, `RecipientGroupReturnType`
   - Note that all certificate types live in `backend/types/cert/` subdirectory (or alongside other types per Plan 03 convention)

5. **Verify no broken markdown** by reading the updated files back

6. **Final commit check**:
   ```bash
   git diff --stat
   # Ensure only AGENTS.md, docs, and outcome files changed in this task
   ```

### Acceptance Criteria

- [ ] `backend/services/AGENTS.md` has a new `## Certificate Services` section with all conventions listed
- [ ] `docs/services/entity-cache-service.md` has certificate cache key table and invalidation helper examples
- [ ] Documentation references the correct file paths, key formats, and tag names
- [ ] No broken markdown (verify by reading back)
- [ ] Documentation matches the actual code (no drift)

### Outcome File

Write `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/08-knowledge-propagation-outcome.md`

_Requirements: REQ-04-23 (Feature 6 — Outcome Knowledge Base & Progress Tracking)_

---

## Summary

| Task | File | Time | Status |
|------|------|------|--------|
| 1 | `template-management.service.ts` | 3-4h | [ ] Not Started |
| 2 | `recipient-group.service.ts` | 2-3h | [ ] Not Started |
| 3 | `certificate-management.service.ts` + `cache-helpers.ts` | 2-3h | [ ] Not Started |
| 4 | `certificate-generation.service.ts` + `notification-payloads.builders.ts` | 3-4h | [ ] Not Started |
| 5 | `certificate-verification.service.ts` | 1-2h | [ ] Not Started |
| 6 | `index.ts` barrel + registration | 30min | [ ] Not Started |
| 7 | Quality loop (all files) | 1-2h | [ ] Not Started |
| 8 | Knowledge propagation (AGENTS.md, docs) | 1-2h | [ ] Not Started |
| **Total** | **8 files** | **14-20h** | |

### Dependency Graph

```
Task 1 (template-management) ──────────┐
Task 2 (recipient-group) ──────────────┤
Task 3 (cert-management + cache-helpers) ──┤
Task 4 (cert-generation + payloads) ───┤   Requires Tasks 1, 2, 3 (imports)
Task 5 (cert-verification) ───────────┤
Task 6 (barrel + registration) ────────┤   Requires Tasks 1-5 (all files exist)
Task 7 (quality loop) ────────────────┤   Requires Task 6 (all files + barrel)
Task 8 (knowledge propagation) ─────────── Requires Tasks 1-7 (all code complete)
```

### Enforcement Checklist (Per Task)

- [ ] Read `backend/services/AGENTS.md` before coding
- [ ] Read `backend/AGENTS.md` before coding
- [ ] Read `.agents/instructions/backend.instructions.md` before coding
- [ ] All errors via `tErrors.cert.*` (no hardcoded strings)
- [ ] No `console.*` — use `logger`
- [ ] No `GraphQLError` in service files
- [ ] All imports use `@/` path aliases
- [ ] Service signature: `(actorUserId, input, tErrors, locale?)`
- [ ] Permission gating via `requirePermission`
- [ ] Cache operations are fail-open
- [ ] Permission check before cache lookup
- [ ] Batch methods return `Map<string, T | null>`
- [ ] Notification side-effects are fire-and-forget
- [ ] Audit side-effects are best-effort (try/catch)
- [ ] `tsgo` passes
- [ ] `biome:check` passes
- [ ] Lint passes (via queue client)
- [ ] `sub-loop.ts --lifecycle lint` exits 0
- [ ] Outcome file written
