# Plan 04 — Services & Business Logic: Design

> **Feature**: Certificate Module — Services & Business Logic
> **Plan #**: 04
> **Dependencies**: Plan 1 (DB Schema & Enums), Plan 2 (Types & Permissions), Plan 3 (Repository Layer)
> **Authoritative Patterns**:
> - `backend/services/AGENTS.md`
> - `siraj_analysis/04-services-graphql-patterns.md` §B (Service Layer), §D (Certificate Integration Blueprint)
> - `siraj_analysis/03-repository-patterns.md` §10 (Summary)
> - `cgvs_analysis/01-generation-logic.md` §1, §6, §7, §10

---

## 1. Architecture Position

```
App Router (server) → Service → Repository → Database
                         │
                         ├─→ PermissionsService.hasPermission
                         ├─→ AuditService.createManyAuditLogs (fire-and-forget)
                         ├─→ dispatchWithPreferences (best-effort)
                         ├─→ StorageService.linkFileToEntity (Plan 7)
                         ├─→ PdfRenderService.renderCertificate (Plan 6)
                         └─→ Entity Cache (fail-open, permission-gated)

Client → Apollo → GraphQL → Resolver → Service → Repository → Database
```

The service layer sits between the GraphQL resolvers (Plan 5) and the repository
layer (Plan 3). It is the **orchestrator** of business logic: it enforces
permissions, validates inputs via Zod, calls repositories, triggers side-effects
(PDF rendering, storage linking, notifications, audit logs), and returns typed
outputs. This plan implements the certificate-specific services; all patterns are
lifted from existing Siraj services (`StudentService`, `BillingService`,
`CreditService`, `NotificationDispatchService`) and adapted to the certificate
domain per `siraj_analysis/04-services-graphql-patterns.md` §D.

### 1.1 Data Flow Within Services

```
Caller (resolver or server component)
    │
    ├─ construct tErrors via getServerTranslations(locale).errorsTranslations
    │
    ├─ permission check → PermissionsService.hasPermission(userId, AppPermission.X)
    │       └─ fail → throw AuthorizationError, audit log
    │
    ├─ input validation → Zod schema parse
    │       └─ fail → throw ValidationError(tErrors.invalidInput(field))
    │
    ├─ cache lookup (fail-open, for read paths only)
    │       └─ hit → return cached DTO
    │
    ├─ business logic → repository call(s) within db.transaction(runner)
    │       └─ 23505 → catch → throw ConflictError(tErrors.duplicateKey)
    │
    ├─ side-effects:
    │       ├─ PdfRender delegation (Plan 6) — generation pipeline only
    │       ├─ Storage linking (Plan 7) — generation pipeline only
    │       ├─ Notification dispatch — best-effort, fire-and-forget
    │       └─ Audit log write — fire-and-forget (try/catch)
    │
    └─ return typed ReturnType → DTO (or throw typed error)
```

### 1.2 Transaction Boundary

Services CREATE transactions for composite operations. The pattern:
- Service calls `db.transaction(runner)` and passes `tx` to every repository call inside the runner.
- Repositories receive `tx?: DBTransaction` — if absent, they use `db` directly (Plan 3 rule).
- Single-operation service methods (e.g., `getById`) do NOT wrap in a transaction — they pass `undefined` and let the repository use the Neon HTTP fast path.

Composite operations that REQUIRE a transaction:
- `generateCertificate` — idempotency key computation + certificate create + verification code create (steps 6-8, 11)
- `revokeCertificate` — status update + audit entry preparation (steps 4-6)
- `publish` — version snapshot + status update + cache invalidation setup
- `cloneTemplate` — template create + element copy + variable copy
- `rollbackToVersion` — element/variable replace + version increment
- `addStudent` — group item create + variable value set

---

## 2. Design Decisions

### 2.1 Namespace-Not-Class

Each service is `export namespace {Entity}Service { export const method = async (...) => ... }`.
No classes, no `this`, no instances.
**Rationale**: Matches Siraj convention (`StudentService`, `BillingService`,
`CreditService`). Tree-shakable, trivially mockable, no DI container needed.
Private helpers are named non-exported arrow functions inside the namespace
(e.g., `computeIdempotencyKey`, `validateVariableType`, `resolveVariables`).

### 2.2 SSR-Safe — No GraphQL Context

Services accept explicit parameters: `tErrors: CertificateServiceErrors`, `locale: string`,
`userId: string`, and typed inputs. They NEVER read `ctx`, `request`, or Next.js APIs.
**Rationale**: The same service method is called from both GraphQL resolvers
(receives `ctx.user`, `ctx.locale`, `ctx.t`) and App Router server components
(receives `locale` from `getLocale()` and `userId` from auth). Passing explicit
params makes the service testable in isolation and callable from both paths.

### 2.3 tErrors Parameter Pattern

Every service method's first or last parameter (convention: after the typed input)
is `tErrors: CertificateServiceErrors`. The type `CertificateServiceErrors` is the
bound function set from the i18n type schema:
- Defined in `shared/locale/certificates.errors.services.ts`
- Constructed by the caller via `getServerTranslations(locale).errorsTranslations`
- Each key is a function `(params) => string`, already locale-bound

Services NEVER construct translations — they only invoke `tErrors.<key>(args)`.

### 2.4 Zod Validation Schemas (Described in Prose)

Each service method has a Zod schema that validates its input. Schemas are defined
at module scope (not exported) inside each service file. They enforce:
- Required field presence
- String length limits (matching DB column constraints)
- Enum value membership (template/element/variable types)
- Date format validation (ISO 8601)
- Nested object validation (e.g., element config per type)

**Zod error → service error translation**: When `zodSchema.safeParse(input)` returns
`!success`, the service extracts the first issue's path, maps it to a translation
key (via a static field→key map), and throws `ValidationError(tErrors.invalidInput(field))`.

### 2.5 Permission Checks Before Cache

**Rationale**: Cache hit must not bypass authorization. If a user lacks permission,
the cache is never consulted — the permission denial is the only outcome. This
matches the Siraj caching rule in `backend/services/AGENTS.md`.

### 2.6 Fire-and-Forget Side-Effects

Audit logs and notifications are wrapped in `try { ... } catch { logger.warn(...) }`
blocks. **Rationale**: A notification provider outage or audit log DB write failure
must NOT fail certificate generation or revocation. These are best-effort side-effects.
The primary operation (DB write) has already committed before the side-effects run.

### 2.7 Idempotency: DB Unique Index Over IdempotencyService

For certificate generation, the `idempotencyKey` column with a unique index (Plan 1)
is the primary idempotency mechanism. **Rationale**: `IdempotencyService` stores
idempotency records in a separate table with TTL-based expiry — but certificate
creation is a durable write where the idempotency record must persist forever (to
prevent re-generation on retry). The unique index on `certificates.idempotencyKey`
achieves this with zero additional infrastructure. The pre-check (querying for
existing certificate with the same key) is an optimization; the DB unique index is
the authoritative guard.

---

## 3. Service Interface Specifications

### 3.1 CertificateGenerationService

File: `backend/services/cert/certificate-generation.service.ts`

#### `generateCertificate`

**Signature**: `(input: GenerateCertificateInput, locale: string, tErrors: CertificateServiceErrors) => Promise<CertificateReturnType>`

**`GenerateCertificateInput`** (type import from `@/backend/types/certificates/generation.types.ts`):
- `templateId: string` (uuid)
- `studentId: string | null` (null for ad-hoc, non-idempotent generation)
- `recipientName: string`
- `recipientEmail: string | null`
- `recipientGroupId: string | null` (uuid, if from a batch)
- `variableValues: Record<string, string | number | boolean | null>`
- `userId: string` (the caller, for permission check)
- `expiryDate: string | null` (ISO date)

**Pipeline flow** (15 steps per REQ-GEN-001):

```
1. Load template (with elements + variables) [TemplateRepository.findById, relational]
2. Validate template.status = "published"
   └─ fail → throw tErrors.templateNotPublished(name)
3. Resolve variables: merge defaults with overrides
4. Validate required variables present
   └─ fail → throw tErrors.requiredVariableMissing(name)
5. Validate variable types match declaration
   └─ fail → throw tErrors.invalidVariableValue(name, type)
6. Compute idempotencyKey: SHA256(templateId:studentId:groupId:versionId)
       (null if studentId is null — ad-hoc, no idempotency)
7. Begin db.transaction(runner):
   a. Pre-check: CertificateRepository.findByIdempotencyKey(key, tx)
       └─ exists → return existing cert (early exit, commit no-op)
   b. CertificateRepository.create({ status: "pending", idempotencyKey, ... }, tx)
8. [outside tx] Trigger PdfRenderService.renderCertificate({ certificateId, templateSnapshot, resolvedVariables, locale })
   └─ fail → update status = "failed", audit log, throw tErrors.generationFailed(reason)
9. [outside tx] CertificateRepository.updateStatus(cert.id, "issued")
10. [outside tx] VerificationRepository.create({ certificateId: cert.id, code: nanoid(urlSafe, 16) })
11. [outside tx] StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId: cert.id, usageType: "certificate_pdf", filePath })
12. [fire-and-forget] dispatchWithPreferences(CERTIFICATE_ISSUED, recipient student + parent)
13. [fire-and-forget] AuditService.createManyAuditLogs([CERTIFICATE_GENERATED])
14. Return CertificateReturnType (populated with verification code)
```

**Error contract**:
- `AuthorizationError` — caller lacks `CERT_GENERATE`
- `NotFoundError` — template not found
- `ValidationError` — Zod parse failure or variable validation failure
- `ConflictError` — 23505 on idempotency key (caught, returns existing cert)
- Generic `Error(tErrors.generationFailed(reason))` — PDF rendering failure

---

#### `getById`

**Signature**: `(certificateId: string, userId: string, locale: string, tErrors: CertificateServiceErrors) => Promise<CertificateReturnType>`

**Flow**: Permission check (`CERT_GENERATE` or `CERT_MANAGE`) → `CertificateRepository.findById` → map to DTO → return.
IF not found → throw `NotFoundError("CERTIFICATE", tErrors.certificateNotFound(id))`.

---

### 3.2 CertificateBatchService

File: `backend/services/cert/certificate-batch.service.ts`

#### `generateBatch`

**Signature**: `(input: GenerateBatchInput, locale: string, tErrors: CertificateServiceErrors) => Promise<BatchGenerationResultType>`

**`GenerateBatchInput`**:
- `templateId: string`
- `recipientGroupId: string`
- `userId: string`

**Flow**:
```
1. Permission check: CERT_GENERATE + CERT_MANAGE
2. Load recipient group with items (RecipientGroupRepository.findById, relational)
   └─ not found → throw NotFoundError(tErrors.recipientGroupNotFound(id))
   └─ empty → throw ValidationError(tErrors.recipientGroupEmpty(id))
3. Validate template published (same as generation)
4. Initialize result accumulator: { total, succeeded, failed, alreadyExisted, failures: [] }
5. For each item in group:
   a. Construct GenerateCertificateInput from item (studentId, recipientName, variableValues)
   b. Try: CertificateGenerationService.generateCertificate(input, locale, tErrors)
       └─ success → succeeded++
       └─ ConflictError (23505 / idempotent dup) → alreadyExisted++
       └─ other error → failed++, push { recipientId, reason: error.message }
6. IF failed / total > 0.5 → set partialFailure = true, audit log warning
7. Return BatchGenerationResultType
```

**Error contract**: `AuthorizationError`, `NotFoundError` (group), `ValidationError` (empty group). Individual recipient failures do NOT throw — they are accumulated.

---

### 3.3 CertificateRevocationService

File: `backend/services/cert/certificate-revocation.service.ts`

#### `revokeCertificate`

**Signature**: `(input: RevokeCertificateInput, locale: string, tErrors: CertificateServiceErrors) => Promise<CertificateReturnType>`

**`RevokeCertificateInput`**:
- `certificateId: string`
- `reason: string`
- `notifyRecipient: boolean`
- `userId: string`

**Flow**:
```
1. Permission check: CERT_MANAGE
2. Load certificate → not found → throw NotFoundError
3. Validate status = "issued"
   └─ fail → throw ConflictError(tErrors.certificateNotRevocable(status))
4. db.transaction(runner):
   a. CertificateRepository.update(cert.id, { status: "revoked", revocationReason: reason }, tx)
   b. Prepare audit entry (not yet written — fire-and-forget after commit)
5. [outside tx] invalidateCertificateCache(cert.id) + invalidateVerificationCache(cert.verificationCode)
6. [fire-and-forget] AuditService.createManyAuditLogs([CERTIFICATE_REVOKED])
7. [fire-and-forget, IF notifyRecipient] dispatchWithPreferences(CERTIFICATE_REVOKED)
8. Return updated CertificateReturnType
```

**Error contract**: `AuthorizationError`, `NotFoundError`, `ConflictError` (wrong status).

---

### 3.4 CertificateVerificationService

File: `backend/services/cert/certificate-verification.service.ts`

#### `verifyCertificate`

**Signature**: `(code: string, requestMetadata: VerificationRequestMetadata) => Promise<PublicCertificateVerificationResultType>`

**`VerificationRequestMetadata`**:
- `ip: string`
- `userAgent: string`

**No permission check** — public endpoint.

**Flow**:
```
1. Cache lookup: cert:verify:${code}
   └─ hit AND status = "issued" → return cached result (but STILL log verification event — step 5)
   └─ miss or status = revoked/expired → fall through
2. VerificationRepository.findByCode(code)
   └─ not found → throw NotFoundError(tErrors.invalidVerificationCode())
3. Load certificate + template metadata (public-safe fields only)
4. Determine effective status:
   ├─ status = "issued" AND expiryDate < now → "expired" (include expiryDate message)
   ├─ status = "issued" → "valid"
   ├─ status = "revoked" → "revoked" (include reason)
   └─ status ∈ {draft, pending, failed} → throw ConflictError(tErrors.certificateNotAvailable())
5. VerificationRepository.logVerification({ code, certificateId, ip, userAgent, result: effectiveStatus })
   └─ fire-and-forget (try/catch — log failure does NOT fail verification)
6. Populate cache IF status = "issued" (stable state) — skip caching for revoked/expired
7. Return PublicCertificateVerificationResultType
```

**`PublicCertificateVerificationResultType`** (type import from `@/backend/types/certificates/verification.types.ts`):
- `certificateHolderName: string`
- `templateName: string`
- `issueDate: string` (ISO)
- `expiryDate: string | null`
- `effectiveStatus: "valid" | "revoked" | "expired"`
- `revocationReason: string | null`
- `verifiedAt: string` (ISO timestamp)

**Error contract**: `NotFoundError` (code), `ConflictError` (certificate not available).

---

### 3.5 CertificateExpiryService

File: `backend/services/cert/certificate-expiry.service.ts`

#### `checkExpiry`

**Signature**: `(certificateId: string, locale: string, tErrors: CertificateServiceErrors) => Promise<CertificateReturnType>`

**Flow**:
```
1. Load certificate → not found → throw NotFoundError
2. IF status ≠ "issued" → return as-is (no-op)
3. IF expiryDate = null → return as-is (no expiry)
4. IF expiryDate >= now → return as-is (not yet expired)
5. CertificateRepository.updateStatus(cert.id, "expired")
6. [fire-and-forget] AuditService.createManyAuditLogs([CERTIFICATE_EXPIRED])
7. Return updated CertificateReturnType (status = "expired")
```

**Idempotency**: IF called again on an already-expired certificate, step 2 (status ≠ issued) short-circuits — no double write, no double audit.

---

### 3.6 TemplateManagementService

File: `backend/services/cert/template-management.service.ts`

#### `getById`

**Signature**: `(templateId: string, userId: string, locale: string, tErrors: CertificateServiceErrors) => Promise<TemplateReturnType>`

**Flow**: Permission check (`TEMPLATE_MANAGE` or `CERT_GENERATE`) → cache lookup (`template:${id}`) → IF miss, `TemplateRepository.findById` (relational) → populate cache → return `TemplateReturnType`.

---

#### `list`

**Signature**: `(filters: TemplateListFilters, userId: string, locale: string, tErrors: CertificateServiceErrors) => Promise<PaginatedResult<TemplateReturnType>>`

**Flow**: Permission check → `TemplateRepository.findMany` (cursor pagination from Plan 3) → map to DTOs → return. No cache (list queries are dynamic).

---

#### `publish`

**Signature**: `(templateId: string, userId: string, locale: string, tErrors: CertificateServiceErrors) => Promise<TemplateReturnType>`

**Flow**:
```
1. Permission check: TEMPLATE_MANAGE
2. Load template with elements + variables (relational)
   └─ not found → throw NotFoundError
3. Validate completeness:
   ├─ elements.length = 0 → throw ValidationError(tErrors.templateEmpty(name))
   └─ any required variable with no default AND no fallback → throw tErrors.requiredVariableNoDefault(name)
4. db.transaction(runner):
   a. TemplateRepository.createVersionSnapshot(templateId, tx) — deep copy elements + variables into version row
   b. TemplateRepository.update(templateId, { status: "published", currentVersion: currentVersion + 1 }, tx)
5. [outside tx] invalidateTemplateCache(templateId) — also invalidates version chain
6. [fire-and-forget] AuditService.createManyAuditLogs([TEMPLATE_PUBLISHED])
7. Return updated TemplateReturnType
```

---

#### `archive`

**Signature**: `(templateId: string, userId: string, locale: string, tErrors: CertificateServiceErrors) => Promise<TemplateReturnType>`

**Flow**: Permission check → load → update status to `archived` → invalidate cache → audit log → return. Archived templates are rejected by `generateCertificate` (REQ-GEN-002).

---

#### `cloneTemplate`

**Signature**: `(input: CloneTemplateInput, userId: string, locale: string, tErrors: CertificateServiceErrors) => Promise<TemplateReturnType>`

**`CloneTemplateInput`**: `{ templateId: string, newName: string }`

**Flow**:
```
1. Permission check: TEMPLATE_MANAGE
2. Load source template with elements + variables (relational)
3. db.transaction(runner):
   a. TemplateRepository.create({ name: newName, categoryId, status: "draft" }, tx) → newTemplate
   b. TemplateElementRepository.createMany(newTemplate.id, [mapped elements], tx)
   c. TemplateVariableRepository.createMany(newTemplate.id, [mapped variables], tx)
4. [fire-and-forget] AuditService.createManyAuditLogs([TEMPLATE_CLONED])
5. Return TemplateReturnType for newTemplate
```

---

#### `getVersionChain`

**Signature**: `(templateId: string, userId: string, locale: string, tErrors: CertificateServiceErrors) => Promise<TemplateVersionReturnType[]>`

**Flow**: Permission check → cache lookup (`template:${id}:versions`) → IF miss, `TemplateRepository.getVersionChain` → populate cache → return.

---

#### `rollbackToVersion`

**Signature**: `(input: RollbackInput, userId: string, locale: string, tErrors: CertificateServiceErrors) => Promise<TemplateReturnType>`

**`RollbackInput`**: `{ templateId: string, versionId: string }`

**Flow**:
```
1. Permission check: TEMPLATE_MANAGE
2. Load version snapshot via TemplateRepository.findVersionById(versionId)
   └─ not found → throw NotFoundError(tErrors.versionNotFound(versionId))
3. Validate snapshot.templateId = templateId
   └─ mismatch → throw ConflictError(tErrors.versionNotOwned(versionId))
4. db.transaction(runner):
   a. Delete current template elements (TemplateElementRepository.deleteByTemplate, tx)
   b. Delete current template variables (TemplateVariableRepository.deleteByTemplate, tx)
   c. Recreate elements from snapshot (TemplateElementRepository.createMany, tx)
   d. Recreate variables from snapshot (TemplateVariableRepository.createMany, tx)
   e. Increment currentVersion (TemplateRepository.update, tx)
5. [outside tx] invalidateTemplateCache(templateId)
6. [fire-and-forget] AuditService.createManyAuditLogs([TEMPLATE_ROLLBACK])
7. Return updated TemplateReturnType
```

---

### 3.7 TemplateElementService

File: `backend/services/cert/template-element.service.ts`

#### CRUD Methods

**`create`** — Signature: `(input: CreateElementInput, userId, locale, tErrors) => Promise<TemplateElementReturnType>`
- Validates `templateId` exists → `TemplateElementRepository.create` → type-specific validation (REQ-ELEM-001) → audit log.

**`update`** — Signature: `(elementId, patch: Partial<UpdateElementInput>, userId, locale, tErrors) => Promise<TemplateElementReturnType>`
- Type-specific validation on patch → `TemplateElementRepository.update` → audit log.

**`delete`** — Signature: `(elementId, userId, locale, tErrors) => Promise<void>`
- `TemplateElementRepository.softDelete` → audit log.

**`reorderElements`** — Signature: `(templateId: string, orderedElementIds: string[], userId, locale, tErrors) => Promise<TemplateElementReturnType[]>`
```
1. Validate all orderedElementIds belong to templateId
   └─ mismatch → throw ValidationError(tErrors.invalidInput("orderedElementIds"))
2. For each (elementId, index) in orderedElementIds:
   TemplateElementRepository.update(elementId, { zIndex: index }, tx) — batched
3. Invalidate template cache (render order changed)
4. Audit log
5. Return updated elements
```

#### Type-Specific Validation (Private Helper: `validateElementConfig`)

Decision table:

| Element Type | Required Fields | Validation Rule | Error Key |
|---|---|---|---|
| `text` | `content` | Non-empty string | `invalidElementConfig("text", "content")` |
| `image` | `storageUrl` | Must be a valid storage reference (non-empty string) | `invalidElementConfig("image", "storageUrl")` |
| `signature` | `signatureId` | Must be a valid UUID | `invalidElementConfig("signature", "signatureId")` |
| `qr` | `size` | Positive integer ≤ 500 | `invalidElementConfig("qr", "size")` |
| `border` | `width` | Positive integer ≤ 50 | `invalidElementConfig("border", "width")` |
| `datetime` | `format` | Valid date format string (e.g., "YYYY-MM-DD") | `invalidElementConfig("datetime", "format")` |

---

### 3.8 TemplateVariableService

File: `backend/services/cert/template-variable.service.ts`

#### CRUD Methods

**`create`** — Validates `key` uniqueness within template → `TemplateVariableRepository.create` → default value type validation (REQ-VAR-001) → audit log.

**`update`** — Validates `key` uniqueness (IF key is being changed) → default value type validation → `TemplateVariableRepository.update` → audit log.

**`delete`** — `TemplateVariableRepository.softDelete` → audit log.

#### Default Value Type Validation (Private Helper: `validateDefaultValue`)

Decision table:

| Variable Type | Default Value Rule | Error Key |
|---|---|---|
| `text` | Must be string (or null) | `invalidVariableValue(key, "text")` |
| `date` | Must be valid ISO date (or null) | `invalidVariableValue(key, "date")` |
| `number` | Must be finite number (or null) | `invalidVariableValue(key, "number")` |
| `boolean` | Must be true/false (or null) | `invalidVariableValue(key, "boolean")` |
| `select` | Must be in `options` array (or null) | `invalidVariableValue(key, "select")` |

---

### 3.9 RecipientGroupService

File: `backend/services/cert/recipient-group.service.ts`

#### `create` — `(input: CreateRecipientGroupInput, userId, locale, tErrors) => Promise<RecipientGroupReturnType>`
- Permission check: `CERT_MANAGE`
- `RecipientGroupRepository.create` → audit log.

#### `getById` — `(groupId, userId, locale, tErrors) => Promise<RecipientGroupReturnType>`
- Permission check → `RecipientGroupRepository.findById` (relational) → return.

#### `addStudent` — `(input: AddStudentInput, userId, locale, tErrors) => Promise<RecipientGroupItemReturnType>`

**Flow**:
```
1. Permission check: CERT_MANAGE
2. Validate student exists (StudentRepository.findById)
   └─ not found → throw NotFoundError
3. Validate not already in group (RecipientGroupRepository.isMember)
   └─ already member → throw ConflictError(tErrors.studentAlreadyInGroup(studentId, groupId))
4. Validate variableValues against template variables (validateVariableValues helper):
   For each key in variableValues:
   a. Template variable with that key must exist on the group's template
      └─ fail → throw ValidationError(tErrors.invalidInput(key))
   b. Value must validate against the variable's type
      └─ fail → throw ValidationError(tErrors.invalidVariableValue(key, type))
   c. Required variable (no default) must have a value
      └─ fail → throw ValidationError(tErrors.requiredVariableMissing(key))
5. db.transaction(runner):
   a. RecipientGroupRepository.addItem(groupId, studentId, tx) → item
   b. RecipientGroupRepository.setItemVariableValues(item.id, variableValues, tx)
6. [fire-and-forget] AuditService.createManyAuditLogs([RECIPIENT_ADDED])
7. Return RecipientGroupItemReturnType
```

#### `removeStudent` — `(groupId, studentId, userId, locale, tErrors) => Promise<void>`
- Permission check → `RecipientGroupRepository.removeItem` (soft delete) → audit log.

#### `setVariableValue` — `(input: SetVariableValueInput, userId, locale, tErrors) => Promise<void>`
- Permission check → validate value against template variable type (validateDefaultValue helper) → `RecipientGroupRepository.setItemVariableValues` (upsert) → audit log.

---

### 3.10 CategoryService

File: `backend/services/cert/category.service.ts`

#### `create` — `(input: CreateCategoryInput, userId, locale, tErrors) => Promise<CategoryReturnType>`

**Flow**:
```
1. Permission check: TEMPLATE_MANAGE
2. IF parentId provided:
   a. Validate parent exists (CertificateCategoryRepository.findById)
      └─ not found → throw NotFoundError(tErrors.categoryNotFound(parentId))
   b. No circular reference check (new category can't be its own ancestor — N/A on create, only on move)
3. CertificateCategoryRepository.create
4. invalidateCategoryTreeCache()
5. Audit log
6. Return CategoryReturnType
```

#### `move` — `(categoryId, newParentId, userId, locale, tErrors) => Promise<CategoryReturnType>`

**Flow**:
```
1. Permission check
2. Load category → not found → throw NotFoundError
3. IF newParentId provided:
   a. Validate newParent exists
   b. Check circular reference: newParent must NOT be a descendant of categoryId
      (walk the tree from categoryId; if newParentId is found in descendants → throw)
      └─ circular → throw ConflictError(tErrors.circularReference(categoryId, newParentId))
4. CertificateCategoryRepository.update(categoryId, { parentId: newParentId })
5. invalidateCategoryTreeCache()
6. Audit log
7. Return CategoryReturnType
```

**Circular Reference Detection** (Private Helper: `wouldCreateCycle`):
- Walk the current subtree rooted at `categoryId` (breadth-first via `CertificateCategoryRepository.findDescendants`).
- IF `newParentId` is found in the descendant set → cycle → throw.

#### `delete` — `(categoryId, userId, locale, tErrors) => Promise<void>`

**Flow**:
```
1. Permission check
2. Load category → not found → throw NotFoundError
3. Check for children: CertificateCategoryRepository.countChildren(categoryId)
   └─ count > 0 → throw ConflictError(tErrors.categoryHasChildren(categoryId))
4. Check for templates: TemplateRepository.countByCategory(categoryId)
   └─ count > 0 → throw ConflictError(tErrors.categoryHasTemplates(categoryId, count))
5. CertificateCategoryRepository.softDelete(categoryId)
6. invalidateCategoryTreeCache()
7. Audit log
```

#### `getTree` — `(locale, tErrors) => Promise<CategoryTreeNodeType[]>`

**Flow**:
```
1. Cache lookup: cert:category:tree
   └─ hit → return cached tree
2. CertificateCategoryRepository.findAll (all non-deleted categories)
3. Build tree from flat list (group by parentId, recursive assembly)
4. Populate cache
5. Return tree
```

---

## 4. Cache Design

### 4.1 Cache Key Map

| Service Method | Cache Key | TTL | Invalidation Trigger |
|---|---|---|---|
| `TemplateManagementService.getById` | `template:${templateId}` | 1 hour | publish, archive, clone, rollback, element/variable CRUD |
| `TemplateManagementService.getVersionChain` | `template:${templateId}:versions` | 1 hour | publish, rollback |
| `CertificateVerificationService.verifyCertificate` | `cert:verify:${code}` | 15 minutes | revocation, expiry transition |
| `CategoryService.getTree` | `cert:category:tree` | 2 hours | category create, move, delete |
| PDF render cache (Plan 6) | `ec:cert:pdf:${certificateId}` | 1 hour | revocation, template republish |

### 4.2 Invalidation Strategy

Cache invalidation helpers live in `backend/services/cert/cache.ts`:

| Helper Function | Invalidates | Used By |
|---|---|---|
| `invalidateTemplateCache(templateId)` | `template:${id}`, `template:${id}:versions` | publish, archive, rollback, element CRUD, variable CRUD |
| `invalidateVerificationCache(code)` | `cert:verify:${code}` | revocation |
| `invalidateCertificatePdfCache(certificateId)` | `ec:cert:pdf:${id}` | revocation (Plan 6 triggers) |
| `invalidateCategoryTreeCache()` | `cert:category:tree` | category create, move, delete |

### 4.3 Fail-Open Rule

ALL cache operations are wrapped in try/catch. If the cache service is unavailable
(Redis down, connection timeout), the service falls through to the repository
without error. The service logs a warning via `logger.warn` but does NOT throw.

### 4.4 Permission Before Cache

No service method checks the cache before checking permissions. The pattern is:
```
permission check → cache lookup → repository fallback
```
This ensures that a cache hit cannot bypass authorization.

---

## 5. Error Handling Design

### 5.1 Error Type Hierarchy

All custom error classes extend `Error` and are imported from `@/backend/lib`:

| Error Class | When to Throw | Constructor |
|---|---|---|
| `AuthorizationError` | Caller lacks required permission | `AuthorizationError(permissionName)` |
| `NotFoundError` | Entity not found (by ID, code, etc.) | `NotFoundError(entityLabel, message)` |
| `ValidationError` | Zod parse failure or custom validation | `ValidationError(message, field?)` |
| `ConflictError` | State conflict (23505, already exists, wrong status) | `ConflictError(message, code?)` |

### 5.2 DB Error Translation

| DB Error Code | Service Action | Thrown Error |
|---|---|---|
| `23505` (unique violation) on `certificates.idempotencyKey` | Catch, fetch existing certificate, return (idempotent) | None — returns existing |
| `23505` on other unique indexes | Catch, re-throw | `ConflictError(tErrors.<conflictKey>(params))` |
| `23503` (foreign key violation) | Catch, re-throw | `ValidationError(tErrors.invalidInput(field))` |
| Connection errors | Propagate (let caller retry) | Raw DB error |

### 5.3 Zod Error Translation

When `zodSchema.safeParse(input)` fails, the service:
1. Extracts the first `issue` from `error.issues`.
2. Maps `issue.path[0]` to a translation key via a static field→key map defined at module scope.
3. Throws `ValidationError(tErrors.invalidInput(fieldName))`.

---

## 6. Permissions Design

### 6.1 Permission Keys (defined in Plan 2)

| Permission Key | Required By |
|---|---|
| `TEMPLATE_MANAGE` | Template CRUD, publish, archive, clone, rollback. Element CRUD. Variable CRUD. Category CRUD. |
| `CERT_GENERATE` | Certificate generation (single + batch). Certificate read. |
| `CERT_MANAGE` | Certificate revocation. Recipient group management. Batch generation (also requires CERT_GENERATE). |
| `CERT_VERIFY` | Internal verification log access (NOT required for public `verifyCertificate`). |

### 6.2 Permission Check Pattern

```
async function checkPermission(userId: string, permission: AppPermission, tErrors: CertificateServiceErrors): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(userId, permission);
  if (!hasPermission) {
    // fire-and-forget audit of denial
    try { await AuditService.createManyAuditLogs([{ event: "PERMISSION_DENIED", userId, permission }]); } catch {}
    throw new AuthorizationError(tErrors.insufficientPermissions(permission));
  }
}
```

This helper is defined once per service file (private, non-exported) and called at the top of each method.

---

## 7. Audit Logging Design

### 7.1 Audit Event Types

| Event Type | Triggered By |
|---|---|
| `CERTIFICATE_GENERATED` | `generateCertificate` success |
| `CERTIFICATE_GENERATION_FAILED` | `generateCertificate` PDF failure |
| `CERTIFICATE_REVOKED` | `revokeCertificate` success |
| `CERTIFICATE_EXPIRED` | `checkExpiry` status transition |
| `TEMPLATE_PUBLISHED` | `publish` success |
| `TEMPLATE_ARCHIVED` | `archive` success |
| `TEMPLATE_CLONED` | `cloneTemplate` success |
| `TEMPLATE_ROLLBACK` | `rollbackToVersion` success |
| `ELEMENT_CREATED` / `ELEMENT_UPDATED` / `ELEMENT_DELETED` / `ELEMENT_REORDERED` | TemplateElementService |
| `VARIABLE_CREATED` / `VARIABLE_UPDATED` / `VARIABLE_DELETED` | TemplateVariableService |
| `RECIPIENT_GROUP_CREATED` / `RECIPIENT_ADDED` / `RECIPIENT_REMOVED` / `VARIABLE_VALUE_SET` | RecipientGroupService |
| `CATEGORY_CREATED` / `CATEGORY_MOVED` / `CATEGORY_DELETED` | CategoryService |
| `PERMISSION_DENIED` | Any permission check failure |

### 7.2 Audit Log Entry Structure

Each audit entry contains:
- `userId` — the actor
- `event` — the event type from the table above
- `entityType` — e.g., `"certificate"`, `"template"`, `"recipient_group"`, `"category"`
- `entityId` — the entity's UUID
- `metadata` — JSON object with event-specific details (e.g., `{ templateId, studentId, idempotencyKey }` for generation)
- `timestamp` — server timestamp

### 7.3 Fire-and-Forget Pattern

```
try {
  await AuditService.createManyAuditLogs([entry]);
} catch (error) {
  logger.warn("Audit log write failed", { event: entry.event, entityId: entry.entityId, error });
}
```

The primary operation has already committed. Audit failure is logged but does NOT propagate.

---

## 8. Notifications Design

### 8.1 Notification Event Types

| Event Type | Dispatched By | Recipients | Template Namespace |
|---|---|---|---|
| `CERTIFICATE_ISSUED` | `generateCertificate` success | Student + parent (if linked) | `certificates.notifications.certificateIssued*` |
| `CERTIFICATE_REVOKED` | `revokeCertificate` (IF `notifyRecipient: true`) | Student + parent | `certificates.notifications.certificateRevoked*` |

### 8.2 Dispatch Pattern

```
try {
  await dispatchWithPreferences({
    eventType: NotificationEventType.CERTIFICATE_ISSUED,
    recipientIds: [studentId, parentId].filter(Boolean),
    templateData: { studentName, templateName },
    locale,
  });
} catch (error) {
  logger.warn("Notification dispatch failed", { eventType, studentId, error });
}
```

Notifications use `dispatchWithPreferences` — this respects each recipient's notification preferences (email, SMS, in-app) per the existing Siraj notification system.

---

## 9. Idempotency Design

### 9.1 Idempotency Key Formula

```
idempotencyKey = SHA256(
  templateId + ":" +
  (studentId ?? "null") + ":" +
  (recipientGroupId ?? "null") + ":" +
  (versionId ?? "null")
).toString("hex")
```

- The key is deterministic — the same inputs always produce the same key.
- The key is URL-safe (hex digest, no special chars).
- IF `studentId` is null (ad-hoc generation), the key is NOT computed (null idempotencyKey) — generation proceeds without idempotency guarantee.

### 9.2 Pre-Check + DB Guard (Belt and Suspenders)

1. **Pre-check** (optimization, inside transaction): `CertificateRepository.findByIdempotencyKey(key, tx)` — IF found, return existing certificate. This avoids the DB insert attempt entirely.
2. **DB guard** (authoritative): The unique index on `certificates.idempotencyKey` catches any race condition where two concurrent requests with the same key both pass the pre-check. The `23505` error is caught and the existing certificate is fetched and returned.

### 9.3 Why Not IdempotencyService

`IdempotencyService` (existing Siraj pattern) stores idempotency records in a
separate table with TTL-based expiry. For certificate generation:
- The idempotency record must persist **forever** (a certificate should never be
  re-generated, even years later on retry).
- The certificate record itself IS the idempotency record — the unique index
  on `idempotencyKey` provides the guarantee with zero additional infrastructure.
- TTL-based expiry would allow re-generation after the TTL lapses, which is
  incorrect for durable certificates.

---

## 10. File Inventory

### 10.1 Service Files Created

| File | Namespace | Methods |
|---|---|---|
| `backend/services/cert/certificate-generation.service.ts` | `CertificateGenerationService` | `generateCertificate`, `getById` |
| `backend/services/cert/certificate-batch.service.ts` | `CertificateBatchService` | `generateBatch` |
| `backend/services/cert/certificate-revocation.service.ts` | `CertificateRevocationService` | `revokeCertificate` |
| `backend/services/cert/certificate-verification.service.ts` | `CertificateVerificationService` | `verifyCertificate` |
| `backend/services/cert/certificate-expiry.service.ts` | `CertificateExpiryService` | `checkExpiry` |
| `backend/services/cert/template-management.service.ts` | `TemplateManagementService` | `getById`, `list`, `publish`, `archive`, `cloneTemplate`, `getVersionChain`, `rollbackToVersion` |
| `backend/services/cert/template-element.service.ts` | `TemplateElementService` | `create`, `update`, `delete`, `reorderElements`, `listByTemplate` |
| `backend/services/cert/template-variable.service.ts` | `TemplateVariableService` | `create`, `update`, `delete`, `listByTemplate` |
| `backend/services/cert/recipient-group.service.ts` | `RecipientGroupService` | `create`, `getById`, `addStudent`, `removeStudent`, `setVariableValue` |
| `backend/services/cert/category.service.ts` | `CategoryService` | `create`, `update`, `move`, `delete`, `getTree` |
| `backend/services/cert/cache.ts` | (helpers, not a namespace) | `invalidateTemplateCache`, `invalidateVerificationCache`, `invalidateCertificatePdfCache`, `invalidateCategoryTreeCache` |
| `backend/services/cert/index.ts` | (barrel) | re-exports all service namespaces |

### 10.2 Files Modified

| File | Modification |
|---|---|
| `backend/services/index.ts` | Add `export * from "./cert";` |
| `shared/locale/certificates.errors.services.ts` | New type schema (created in this plan) |
| `shared/locale/en/certificates.errors.services.ts` | New English implementation |
| `shared/locale/ar/certificates.errors.services.ts` | New Arabic implementation |
| `shared/locale/certificates.notifications.ts` | New type schema |
| `shared/locale/en/certificates.notifications.ts` | New English implementation |
| `shared/locale/ar/certificates.notifications.ts` | New Arabic implementation |

---

## 11. ZIP Code Validation Schemas (Prose Description)

No implementation code. Each service method's Zod schema is described:

### 11.1 GenerateCertificateInput Schema

Validates:
- `templateId`: string, uuid format
- `studentId`: string uuid OR null
- `recipientName`: string, min 1 char, max 200 chars
- `recipientEmail`: string email format OR null
- `recipientGroupId`: string uuid OR null
- `variableValues`: record of string → union(string | number | boolean | null)
- `userId`: string, uuid
- `expiryDate`: string ISO date OR null

### 11.2 RevokeCertificateInput Schema

Validates:
- `certificateId`: string uuid
- `reason`: string, min 1 char, max 500 chars
- `notifyRecipient`: boolean
- `userId`: string uuid

### 11.3 AddStudentInput Schema

Validates:
- `groupId`: string uuid
- `studentId`: string uuid
- `variableValues`: record of string → union(string | number | boolean | null)
- `userId`: string uuid

### 11.4 CreateElementInput Schema (per type)

Validates:
- `templateId`: string uuid
- `type`: enum { "text", "image", "signature", "qr", "border", "datetime" }
- `config`: discriminated union by `type` — each variant has type-specific required fields (see REQ-ELEM-001 decision table)
- `zIndex`: number, integer, min 0
- `userId`: string uuid

---

## 12. Drawings & Flows

### 12.1 Certificate Status State Machine

```
                    ┌─────────┐
                    │  draft  │ (template status, not certificate)
                    └─────────┘

                    ┌─────────┐
  generate cert ──→ │ pending │ ──PDF render fails──→ ┌─────────┐
                    └─────────┘                       │ failed  │
                         │                            └─────────┘
                   PDF render
                    success ↓
                    ┌─────────┐
                    │ issued  │ ──revoke──→ ┌─────────┐
                    └─────────┘             │ revoked │
                         │                  └─────────┘
                   expiryDate
                    passes  ↓
                    ┌─────────┐
                    │ expired │
                    └─────────┘
```

### 12.2 Template Status State Machine

```
  create ──→ ┌────────┐
             │ draft  │ ←── clone (creates new draft)
             └────────┘
                  │
              publish ↓
             ┌──────────┐
             │published │ ──archive──→ ┌──────────┐
             └──────────┘               │ archived │
                  │                     └──────────┘
              rollback ↓
             ┌──────────┐
             │published │ (incremented version)
             └──────────┘
```

---

## 13. AGENTS.md & Instruction File References

### 13.1 AGENTS.md Files

| File | Applies To |
|---|---|
| `AGENTS.md` (root) | All files — logging, path aliases, i18n |
| `backend/services/AGENTS.md` | All service files — canonical service rules |
| `shared/AGENTS.md` | `shared/locale/` files — i18n system rules |
| `backend/types/AGENTS.md` | Type import patterns |

### 13.2 Instruction Files

| File | Applies To |
|---|---|
| `.github/instructions/backend.instructions.md` | All `backend/**/*.ts` files |

### 13.3 Relevant Quality Commands

```bash
bun tsgo                    # Type check — safe for parallel
bun biome:check             # Format + lint — safe for parallel
bun run lint                # Lint queue client — safe (serialized behind queue server)
bun run scripts/health/sub-loop.ts <file> --lifecycle lint  # Per-file progressive verification
```

---

## 14. Handoff

### 14.1 To Plan 5 (GraphQL API)

Plan 5 wraps these services in Pothos resolvers:
- Import from `@/backend/services` (top-level barrel)
- Construct `tErrors` via `ctx.t().errorsTranslations`
- Pass `userId` from `ctx.user.id`, `locale` from `ctx.locale`
- Map service `ReturnType`s to Pothos object types

### 14.2 To Plan 6 (PDF Rendering Engine)

Plan 6 implements `PdfRenderService.renderCertificate`:
- Input: `{ certificateId, templateSnapshot, resolvedVariables, locale }`
- Output: `{ filePath, renderMetadata }`
- Plan 4 calls this at step 9 of the generation pipeline (outside the transaction)

### 14.3 To Plan 7 (Storage & File Management)

Plan 7 implements `StorageService.linkFileToEntity`:
- Input: `{ referenceTable, referenceId, usageType, filePath }`
- Plan 4 calls this at step 12 of the generation pipeline (outside the transaction)

### 14.4 To Plan 22 (Cron Cleanup)

Plan 22 invokes `CertificateExpiryService.checkExpiry` for all `issued` certificates with
an `expiryDate` in the past. Plan 22 owns the cron scheduling; Plan 4 owns the expiry logic.

---

## Reality Check Notes

> Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Verified Correct
- **Service path `backend/services/cert/`** ✅ — matches the codebase domain-folder convention (`backend/services/{auth, billing, student, ...}`). Each domain is a folder, not a flat file.
- **`{entity}.service.ts` naming** ✅ — matches e.g. `backend/services/student/student-management.service.ts`, `student-lifecycle.service.ts` (multiple service files per domain folder).
- **`export namespace XService { ... }` pattern** ✅ — matches `StudentManagementService`, `StorageService`, `IdempotencyService`.
- **`tErrors` as an explicit service parameter** ✅ — matches `StudentManagementService.editQuota(actorUserId, studentId, tErrors: ErrorsLabels, ...)`; services do NOT call i18n helpers themselves. Design §2.3 (`tErrors` Parameter Pattern) is consistent with the codebase.
- **`PermissionsService.hasPermission`** ✅ — referenced correctly (e.g. `StorageService.requireStorageManage` uses exactly this).
- **`db.transaction(runner)` + `tx?: DBTransaction` propagation** ✅ — consistent with repo/service conventions.
- **`IdempotencyService` (flat, root-level `backend/services/idempotency.service.ts`)** ✅ — exists; uses `CacheDbRepository.insertIfNotExists` + 24h TTL. Plan's preference for DB unique-index idempotency over this service is architecturally sound and noted.
- **`@/backend/lib/logger` import** ✅ — exists at `backend/lib/logger.ts`.
- **Fire-and-forget audit + `dispatchWithPreferences` (best-effort notificationdispatcher)** ✅ — both exist and match `backend/services/notification/notification-dispatch.helpers`.

### Corrections Made
- **`getServerTranslations` signature** — corrected. The actual `getServerTranslations(locale)` in `backend/graphql/gqlContext.ts` → `@/shared/locale/server-graphql.ts` takes **ONE** argument (`locale`). There is no `(locale, "namespace")` two-arg form. `tErrors` is extracted from a property on the returned `Translations` object. All occurrences of `getServerTranslations(locale, "certificates.errors.services")` were changed to `getServerTranslations(locale).errorsTranslations`. (Import location `@/shared/locale/server-graphql` per `backend/services/AGENTS.md` is correct; `gqlContext.ts` imports `getServerTranslations` from `@/shared/locale` which re-exports it.)
- **`ctx.t("certificates.errors.services")` → `ctx.t().errorsTranslations`** — `BaseContext.t` is `() => Translations` (no namespace argument, see `backend/graphql/gqlContext.ts:30`). Resolvers access the error namespace via `ctx.t().errorsTranslations` (verified across `backend/graphql/pothos/{scheduling,billing,auth}/...`). Fixed in Plan 04 §14.1 handoff and `requirements.md` final note.
- **`REQ-SVC-003` wording** — reworded. The original said "a service method … SHALL construct `tErrors`"; the codebase invariant is the *caller* (resolver/server component) constructs `tErrors` once and passes it in — services never construct it. Corrected to reflect caller-construction, matching `StudentManagementService` pattern.

### Status (no change needed)
- Enum registration requirement is a **Pothos-layer** concern — fully addressed in Plan 05; Plan 04 correctly does not introduce enum Pothos registration (it references `AppPermission` values from Plan 2). ✅
- `backend/services/index.ts` barrel re-export update (§3.1) ✅ — matches the `export * from "@/backend/services/<domain>"` pattern in the existing `index.ts` (22 domain re-exports).

---

## SWE Expert Review Notes

> Second-pass architectural + codebase-reality review (2026-08-02). Supersedes spec
> body where conflicts are noted below. Treat the corrections below as binding
> constraints on implementation.

### A. Architectural Soundness

1. **Transaction boundary is correct** ✅ — `generateCertificate` wraps only steps
   6–8 (idempotency-key compute + pre-check + cert create) in `db.transaction(runner)`,
   then performs PDF render / verification-code creation / storage linking / side-effects
   OUTSIDE the tx. This is the right call: Neon HTTP transactions do not span network
   I/O (Puppeteer), and the `failed` status is recoverable. The `pending → issued`
   transition is a two-phase step that survives a crash between the tx and the render.

2. **Idempotency pattern is correct** ✅ — `SHA256(templateId:studentId:groupId:versionId)`
   + DB unique index is the durable guard; pre-check is an optimization; `23505` is
   caught and mapped to the existing certificate. Sounder than TTL-based
   `IdempotencyService` for durable certs. **Caveat:** the key formula must include the
   template `currentVersion` (REQ-IDM-001 says `versionId`) so that re-publishing a
   template with a bumped version legitimately allows re-generation of the same
   student+group. Confirm `versionId` here = `template.currentVersion`, not the
   snapshot `versionId` — otherwise republish breaks dedupe.

3. **Service↔repository separation is correct** ✅ — services import only from
   `@/backend/db/repo`, never schema.

### B. Correctness defects against the ACTUAL codebase (must fix)

4. **`tErrors` type is `ErrorsLabels`, NOT `CertificateServiceErrors`.** Verified at
   `shared/locale/types/message.ts:259` (`errorsTranslations: ErrorsLabels`), imported
   from `@/shared/locale/types/errors`. Real services declare `tErrors: ErrorsLabels`
   (see `backend/services/teacher/teacher-dashboard.service.ts:16`,
   `teacher-onboarding.service.ts:48`, `billing/…`). **The whole plan's
   `tErrors: CertificateServiceErrors` type (§2.3, §3.1–§3.10, §6.2, REQ-SVC-003)
   must change to `tErrors: ErrorsLabels`**, and the per-key subscript style
   (`tErrors.templateNotPublished(name)`, `tErrors.requiredVariableMissing(name)`)
   must be expressed as **cert-scoped keys added to `ErrorsLabels`** (the codebase
   already nests namespaces, e.g. `tErrors.credit.insufficientBalance(...)`,
   `tErrors.insufficientPermissions`). Therefore cert errors should live under
   `tErrors.certificates.*` (e.g. `tErrors.certificates.templateNotPublished(name)`),
   defined by EXTENDING `ErrorsLabels` in `shared/locale/types/errors` + en/ar
   implementations — NOT a new standalone `CertificateServiceErrors` type.
   The brand-new `shared/locale/certificates.errors.services.ts` namespace proposed
   in §3/T01 must instead be wired into the existing `ErrorsLabels` aggregate.

5. **Error classes in §5.1 are partly fictitious.** `backend/lib/errors.ts` exports
   ONLY `DomainError`, `NotFoundError(entity, message)`, `UnauthorizedError(message)`,
   `ForbiddenError(message)`. `ValidationError`, `ConflictError`, `AuthorizationError`,
   `TemplateInUseError`, `GenerationFailedError` DO NOT EXIST in the codebase. The real
   convention (verified across `billing/`, `teacher/`, `storage/`) is
   `throw new Error(tErrors.<key>(args))` — NOT typed error classes. **Required fixes:**
   - Either (a) add `ValidationError`, `ConflictError` to `backend/lib/errors.ts`
     extending `DomainError` (mirroring `NotFoundError`), keep `AuthorizationError`→
     reuse the existing `ForbiddenError`, and drop `TemplateInUseError`/`GenerationFailedError`
     in favor of `ConflictError`/`DomainError`; OR (b) follow the dominant codebase
     convention and `throw new Error(tErrors.certificates.<key>(...))` everywhere,
     relying on Plan 05 to map `error.message` + an optional `error.code` to GraphQL
     extensions. Option (b) is closer to the existing codebase and is recommended.
   - Plan 05 §8 error-mapping table also invents `PermissionError`/`TemplateInUseError`/
     `GenerationFailedError` — must be reconciled with whatever Plan 04 finalizes here.

6. **`NotFoundError` constructor signature mismatch.** Real ctor is
   `NotFoundError(entity: string, message: string)` producing `code = \`${entity}_NOT_FOUND\``.
   Plan 04 writes `NotFoundError(entityLabel, message)` (OK) but also `NotFoundError("CERTIFICATE", …)`
   — fine. Just ensure the `entity` arg is the label token, not a localized phrase.

7. **`NotificationEventType.CERTIFICATE_ISSUED` / `CERTIFICATE_REVOKED` do NOT exist.**
   Verified: no matches in `backend/enum/` or `shared/`. Plan 04 §8.1 uses them in
   `dispatchWithPreferences({ eventType: NotificationEventType.CERTIFICATE_ISSUED })`.
   **Required:** add `CERTIFICATE_ISSUED`, `CERTIFICATE_REVOKED` to the
   `NotificationEventType` enum in `backend/enum/` (Plan 2 owns this) and to the
   `NotificationEventTypePothosObject` registration in `shared/enum.pothos.ts`.
   Flag to Plan 2 maintainers; do NOT assume they exist.

8. **Plan 04 has no read-side enumeration service methods that Plan 05 calls.**
   Plan 05 resolvers delegate to `CertificateService.list`, `listVerifications`,
   `RecipientGroupService.list`, `TemplateService.list` — but Plan 04 §3.1 spec of
   `CertificateGenerationService` exposes only `generateCertificate` + `getById`, and
   the File Inventory §10.1 omits any `list` method on
   `CertificateGenerationService`/`CertificateBatchService`. Yet Plan 05
   `certificates` query needs `CertificateService.list(...)`. **Required:** explicitly
   add `CertificateService.list(filters, pagination, userId, tErrors, locale)` and
   `listVerifications(...)` to the service inventory (§10.1) and a corresponding
   requirements section. Today Plan 04's own `getById` uses permission
   `CERT_GENERATE or CERT_MANAGE`, but Plan 05's `certificateById` query is gated
   `CERT_VIEW`/`CERTIFICATES_VIEW`. Add a read-dedicated `CERT_VIEW` permission
   requirement (see permission reconciliation below).

### C. Permission-key reconciliation (Plan 04 ↔ Plan 05 ↔ Plan 2)

9. **Three divergent permission vocabularies exist across the plans.**
   - Plan 04 uses: `TEMPLATE_MANAGE`, `CERT_GENERATE`, `CERT_MANAGE`, `CERT_VERIFY`.
   - Plan 05 `design.md`/`tasks.md` uses: `CERT_VIEW`, `CERT_GENERATE`, `CERT_MANAGE`,
     `CERT_TEMPLATE_MANAGE`, `CERT_TEMPLATE_VIEW`, `CERT_TEMPLATE_PUBLISH`,
     `CERT_CATEGORY_MANAGE`, `CERT_RECIPIENT_GROUP_MANAGE`, `CERT_STYLE_PRESET_MANAGE`,
     `CERT_REVOKE`.
   - Plan 05 `requirements.md` (REQ-05-004/005/007) uses a **pluralized** set:
     `CERTIFICATES_VIEW`, `CERTIFICATES_TEMPLATES_VIEW`, `CERTIFICATES_TEMPLATES_MANAGE`,
     `CERTIFICATES_TEMPLATES_PUBLISH`, `CERTIFICATES_CATEGORIES_MANAGE`,
     `CERTIFICATES_RECIPIENT_GROUPS_MANAGE`, `CERTIFICATES_GENERATE`,
     `CERTIFICATES_BULK_GENERATE`, `CERTIFICATES_REVOKE`.
   Only **one** set can become the canonical `AppPermission` enum (Plan 2 owns it).
   **Required fix:** Plan 2 must publish the final `AppPermission.*` names; until then
   this plan (and Plan 05) must reference the **`CERT_*` short forms** consistently (they
   match the existing enum convention `TEACHER_VIEW_DASHBOARD`, `STORAGE_MANAGE`,
   `SCHEDULE_VIEW_ASSIGNED`). The pluralized `CERTIFICATES_*` names in Plan 05
   `requirements.md` should be discarded. Additionally Plan 04 is **missing** the
   read-only `CERT_VIEW` permission (currently lumping read under `CERT_GENERATE`/
   `CERT_MANAGE`), and is missing `CERT_TEMPLATE_VIEW`, `CERT_CATEGORY_MANAGE`,
   `CERT_TEMPLATE_PUBLISH`, `CERT_STYLE_PRESET_MANAGE`, `CERT_BULK_GENERATE`. Add them
   to §6.1 and align §3 method permission notes.

### D. GraphQL ↔ Service contract mismatches (cross-plan, blocking)

10. **`generateCertificate` input mismatch (Plan 04 ↔ Plan 05).** Plan 04's
    `GenerateCertificateInput` (§3.1) REQUIRES `studentId`, `recipientName`,
    `recipientEmail`, `recipientGroupId`, `variableValues`, `userId`, `expiryDate`.
    Plan 05's `GenerateCertificateInput` (REQ-05-006) is `{ templateId, recipientGroupId,
    idempotencyKey }` — missing `studentId`, `recipientName`, `recipientEmail`,
    `variableValues`, `expiryDate`. **Required:** Plan 05's input type must carry every
    field Plan 04 needs; the service cannot synthesize `studentId`/`recipientName`. Either
    (a) make `GenerateCertificateSubmitInput` in Plan 2 the full bag Plan 04 expects, and
    have Plan 05's `GenerateCertificateInput` mirror it; or (b) restrict single-generation
    to `recipientGroupId`-driven items only and drop the ad-hoc single path from Plan 04.
    Recommend (a).

11. **Public verification result shape mismatch (Plan 04 ↔ Plan 05).** Plan 04 §3.4
    returns a flat `PublicCertificateVerificationResultType` with
    `certificateHolderName`, `templateName`, `issueDate`, `expiryDate`,
    `effectiveStatus: "valid"|"revoked"|"expired"`, `revocationReason`, `verifiedAt`.
    Plan 05 REQ-05-008 returns `{ result: VALID|REVOKED|NOT_FOUND|EXPIRED, certificate:
    { id, verificationCode, status, issueDate, expiryDate, recipientName, templateName },
    verifiedAt, verificationId }` — a NESTED sub-object + a `NOT_FOUND` value that Plan 04
    models as a thrown `NotFoundError`. **Required:** agree on ONE shape. Recommend
    adopting Plan 05's "result-enum + nullable certificate sub-object" (so the public
    endpoint NEVER throws on a wrong code — it returns `NOT_FOUND`, which is also safer
    against info leakage / oracle enumeration). Plan 04 §3.4 must stop throwing
    `NotFoundError` for an unknown code and instead return `result: "not_found"`; the
    `effectiveStatus` field is dropped in favor of the top-level `result` enum. Update
    REQ-VER-001/002 and `PublicCertificateVerificationResultType` accordingly.

### E. Scalability / batch / async

12. **Synchronous batch loop will break at ~1000 certificates (the stated target).**
    Plan 04 `CertificateBatchService.generateBatch` iterates the recipient group and
    calls `generateCertificate` per item in-process. Each item launches/renders a
    Puppeteer PDF (Plan 06), sequentially inside one request. At 1000 items × ~1.5s
    render + DB writes this is a 25+ minute synchronous job that will exceed any
    serverless function timeout (Vercel default 10–60s, max 300s) and hold one DB
    connection for the duration. **Required:** define an async batch path:
    - For batches ≤ `BATCH_SYNC_MAX` (e.g. 50): stay synchronous and return
      `BatchGenerationResultType` directly (current design).
    - For batches > `BATCH_SYNC_MAX`: persist a `certificate_batch_jobs` row with
      `status = queued`, return immediately with `{ batchJobId, status: "queued" }`,
      and process via the cron worker (Plan 22) or a queue. Add `certificateBatchJobs`
      table to Plan 1 and a `CERT_BATCH_ASYNC_THRESHOLD` env. Plan 04 §3.2 + §10.1 must
      add `getBatchStatus(batchJobId)` (Plan 05 already calls
      `CertificateGenerationService.getBatchStatus` — currently undefined).
    - Progress events (`onProgress`) only make sense in-process; for async they should
      be persisted to the batch-job row and read via `getBatchStatus` polling or a
      subscription.

13. **No retry / no partial-failure recovery for the `failed` certificates.**
    A certificate stuck in `pending` or `failed` (render crash mid-batch) has no
    re-render entry point. **Required:** add `CertificateGenerationService.retryRender(certificateId,
    userId, tErrors, locale)` that re-runs steps 8–13 of the pipeline on an existing
    `pending`/`failed` certificate (idempotent — re-uses the same idempotency key),
    exposed as a mutation in Plan 05. Also `CertificateBatchService.generateBatch` should
    surface a `failedCertificateIds: string[]` so the UI can offer per-row retry.

14. **Verification cache can serve stale "valid" shortly after expiry.** TTL=15min on
    `cert:verify:${code}` means a code queried at 23:59 (valid) is cached and served as
    "valid" until 00:14 even after the `expiryDate` passes. Cache should ONLY be
    populated for `issued && (expiryDate is null || expiryDate > now + TTL)`; for
    soon-to-expire certs, shorten TTL to `min(15min, expiryDate - now)` or skip caching.

### F. i18n / Arabic

15. **`getServerTranslations` is single-arg.** Verified at
    `shared/locale/server-graphql.ts:3` (`function getServerTranslations(locale: string)`).
    Every cert error key must be reachable through `getServerTranslations(locale).errorsTranslations`
    — i.e. by extending `ErrorsLabels`. Do NOT add `getServerTranslations(locale, "ns")`
    two-arg calls anywhere (Plan 06 design §348/§360 still does — fix there).

16. **Arabic pluralization rule is correctly cited** ✅ (CLDR six forms
    zero/one/two/few/many/other). Ensure `categoryHasTemplates(count)` and
    `batchGenerationPartialFailure(count)` actually dispatch on all six, and that the
    `many` form stretches to 11–99 (CLDR Arabic `many`). Plan 04 T01 §9 requires this —
    confirm in the en/ar impl files.

### G. Security of the public verification path

17. **`verifyCertificate` returns `revocationReason` to anonymous callers.** This is an
    info-leak (reasons often contain staff notes / PII). Either redact the reason to a
    generic localized "revoked" string, or expose only a public-safe `revocationSummary`
    field (e.g. "revoked by the academy"). Update REQ-VER-002 + §3.4 field list.

18. **No rate limiting on the service side.** Plan 05 owns rate limiting via middleware,
    but the service is SSR-callable, so a server-component or server-action caller bypasses
    GraphQL middleware. **Required:** add a cheap in-process guard in
    `CertificateVerificationService.verifyCertificate` (e.g. via the existing
    `backend/lib/ratelimit.ts` `RateLimiter` with `prefix: "cert:verify:ip"`) keyed on the
    IP passed in `requestMetadata`, fail-open. This makes the public path safe regardless
    of entry point.

### H. Remaining risks (accept and track)

- **Audit log writes are fire-and-forget** ✅ — acceptable for audit; consider a
  durable outbox if audit completeness is a compliance requirement (out of scope here).
- **`dispatchWithPreferences` is best-effort** ✅ — but a missed "certificate issued"
  notification is silently lost. At minimum log the recipientIds + eventType at WARN so
  ops can backfill. Already covered by §2.6 / §8.2.
- **`recipientName`/`recipientEmail` are free-text inputs** to single generation, with
  only Zod length validation. There is no normalization (trim, casefold email) or
  canonical-student-id cross-check when `studentId` is provided. Add: if `studentId` is
  provided, derive `recipientName`/`recipientEmail` from `StudentRepository.findById`
  and IGNORE caller-supplied values for those fields (auditable), to prevent spoofing.
- **PDF render runs outside the transaction** — by design — so a crash after the `pending`
  row is created but before `updateStatus("issued")` leaves an orphan row. Mitigated by
  the `retryRender` entry point above + Plan 22 cron that sweeps `pending` rows older
  than N minutes.

### Action checklist (implementer must reconcile)

1. Replace `CertificateServiceErrors` → `ErrorsLabels` (extend, not replace) across Plan 04.
2. Add `ValidationError`, `ConflictError` to `backend/lib/errors.ts` (or adopt `throw new Error(tErrors...)`).
3. Add `CERTIFICATE_ISSUED`/`CERTIFICATE_REVOKED` to `NotificationEventType` (Plan 2).
4. Finalize `AppPermission` names with Plan 2; use `CERT_*` short forms everywhere.
5. Add `CertificateService.list`, `listVerifications`, `getBatchStatus`,
   `retryRender` to Plan 04 service inventory + requirements.
6. Make Plan 05 `GenerateCertificateInput` carry the full Plan 04 input bag.
7. Adopt Plan 05's `result`-enum verification shape; Plan 04 stops throwing on unknown code.
8. Add async batch path + `certificate_batch_jobs` table (Plan 1) + threshold env.
9. Make verification result reason public-safe (no raw `revocationReason`).
10. Add IP rate-limit guard inside the verification service (not only GraphQL middleware).
