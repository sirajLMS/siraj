# Plan 04 — Services & Business Logic: Requirements

> **Feature**: Certificate Module — Services & Business Logic
> **Plan #**: 04
> **Dependencies**: Plan 1 (DB Schema & Enums), Plan 2 (Types & Permissions), Plan 3 (Repository Layer)
> **Stakeholders**: Backend engineering, Product, Compliance
> **Related Docs**:
> - `MASTER_ARCHITECTURE.md` — Overarching certificate feature architecture
> - `siraj_analysis/04-services-graphql-patterns.md` §B (Service Layer), §D (Certificate Integration Blueprint)
> - `siraj_analysis/03-repository-patterns.md` §10 (Summary of patterns)
> - `cgvs_analysis/01-generation-logic.md` §1 (Pipeline), §6 (Recipient), §7 (Lifecycle), §10 (Batch)
> - `backend/services/AGENTS.md` — Authoritative service rules
> - `backend/types/AGENTS.md` — Canonical type definitions

---

## 1. Introduction

### 1.1 Overview

This plan specifies the **service layer** for the certificate feature, living in
`backend/services/cert/`. Services orchestrate business logic: they receive typed
inputs, validate them, enforce permissions, call repositories (Plan 3), trigger
side-effects (PDF rendering delegation to Plan 6, storage to Plan 7, notifications,
audit logs), and return typed outputs. Services are SSR-safe (no GraphQL context
dependency), accept explicit `locale` + `tErrors` parameters, and follow the Siraj
namespace pattern (`export namespace CertificateGenerationService { ... }`).

### 1.2 Business Value

The service layer is the orchestrator: it enforces the certificate generation
pipeline, batch generation with idempotency, revocation, public verification,
template lifecycle (publish/archive/clone/version), recipient group management,
and category tree operations. It guarantees:
- Permission-gated operations (CERT_MANAGE, CERT_GENERATE, CERT_VERIFY, TEMPLATE_MANAGE)
- Translated error messages for all user-facing failures
- Idempotent generation (no duplicate certificates for same template+recipient+version)
- Cache-backed reads for templates, categories, and verification lookups
- Fire-and-forget audit logs and best-effort notification dispatch
- Durable idempotency via DB unique index (preferred over IdempotencyService for cert writes)

### 1.3 Scope

| In Scope | Out of Scope |
|---|---|
| `backend/services/cert/*.service.ts` files | PDF rendering engine (Plan 6) |
| `backend/services/cert/cache.ts` — cache invalidation helpers | Storage signed URLs (Plan 7) |
| `backend/services/cert/index.ts` — barrel + `backend/services/index.ts` update | GraphQL resolvers (Plan 5) |
| `CertificateGenerationService`, `CertificateVerificationService`, `CertificateRevocationService` | Frontend views (Plans 8-19) |
| `TemplateManagementService`, `TemplateElementService`, `TemplateVariableService` | Cron cleanup orchestration (Plan 22) |
| `RecipientGroupService`, `CategoryService` | Seed data (Plan 1) |
| Zod validation schemas for service inputs | Repository layer (Plan 3 — consumed, not modified) |
| Permission checks via `PermissionsService.hasPermission` | Email template rendering (Plan 6) |
| Idempotency key computation (SHA256 over templateId+studentId+groupId+versionId) | Notification provider integration (existing) |
| Entity cache for templates, categories, verification code lookups | |
| Audit log writes (fire-and-forget) via `AuditService.createManyAuditLogs` | |
| Best-effort notification dispatch via `dispatchWithPreferences` | |
| i18n keys for all service error messages | |

### 1.4 Services Covered

| Service Namespace | Responsibility |
|---|---|
| `CertificateGenerationService` | Single certificate generation pipeline, variable resolution, idempotency |
| `CertificateBatchService` | Batch generation for recipient groups, progress tracking, partial failure |
| `CertificateRevocationService` | Revoke issued certificates, invalidate PDF cache, audit, notify |
| `CertificateVerificationService` | Public lookup by code, status check, verification log, public-safe response |
| `CertificateExpiryService` | Check expiry, transition issued→expired |
| `TemplateManagementService` | Template CRUD, publish, archive, clone, version chain |
| `TemplateElementService` | Element CRUD with type-specific validation, reorder (z-index) |
| `TemplateVariableService` | Variable CRUD with type-specific validation, default value validation |
| `RecipientGroupService` | Group CRUD, add/remove students, per-recipient variable values |
| `CategoryService` | Category CRUD, reorder, tree operations, circular reference prevention |

---

## 2. Requirements (EARS Format)

> EARS conventions:
> - **WHEN** `⟨precondition⟩` **THE SYSTEM SHALL** `⟨behavior⟩`
> - **IF** `⟨error-condition⟩` **THE SYSTEM SHALL** `⟨error-behavior⟩`
> - **THE SYSTEM SHALL** `⟨unconditional-behavior⟩`

### 2.1 Service Architecture Conformance

**REQ-SVC-001**: **THE SYSTEM SHALL** expose all service methods as namespaces of exported arrow functions, not classes, matching the Siraj `backend/services/` convention.

**REQ-SVC-002**: **THE SYSTEM SHALL** make all service methods SSR-safe — they must NOT read from any GraphQL context, request store, or Next.js-specific API. Required inputs (`locale`, `tErrors`, `userId`, `permissions`) are passed as explicit parameters.

**REQ-SVC-003**: **WHEN** a service method is invoked **THE SYSTEM SHALL** receive `tErrors` as an explicit parameter (constructed ONCE by the caller — resolver or server component — via `getServerTranslations(locale).errorsTranslations`) and never construct translation strings itself.

**REQ-SVC-004**: **THE SYSTEM SHALL** import all non-repository types (e.g., `EntitySelectType`, `EntityReturnType`, `EntitySubmitInput`) from `@/backend/types/certificates/*` — no local type definitions in service files.

**REQ-SVC-005**: **THE SYSTEM SHALL** import all repository namespaces from `@/backend/db/repo` (top-level barrel) — no direct schema imports in services.

### 2.2 Permission Enforcement

**REQ-PERM-001**: **WHEN** `CertificateGenerationService.generateCertificate` is invoked **THE SYSTEM SHALL** verify the caller has `CERT_GENERATE` permission via `PermissionsService.hasPermission(userId, AppPermission.CERT_GENERATE)` before proceeding.

**REQ-PERM-002**: **WHEN** `TemplateManagementService.publish`, `archive`, or `cloneTemplate` is invoked **THE SYSTEM SHALL** verify the caller has `TEMPLATE_MANAGE` permission.

**REQ-PERM-003**: **WHEN** `CertificateVerificationService.verifyCertificate` is invoked **THE SYSTEM SHALL** NOT require authentication — verification is public. However, internal verification logs SHALL record the requesting IP and user agent.

**REQ-PERM-004**: **WHEN** `CertificateRevocationService.revokeCertificate` is invoked **THE SYSTEM SHALL** verify the caller has `CERT_MANAGE` permission.

**REQ-PERM-005**: **WHEN** `CertificateGenerationService.generateBatch` is invoked **THE SYSTEM SHALL** verify the caller has both `CERT_GENERATE` and `CERT_MANAGE` permissions.

**REQ-PERM-006**: **IF** the caller lacks the required permission **THE SYSTEM SHALL** throw `tErrors.insufficientPermissions(permissionName)` and write an audit log of the denied attempt.

### 2.3 Certificate Generation Pipeline

**REQ-GEN-001**: **WHEN** `generateCertificate(templateId, recipientData, variableValues, locale)` is invoked **THE SYSTEM SHALL** execute the following pipeline:
1. **Load template** — fetch template with elements and variables via `TemplateRepository.findById` (with relational load for elements + variables).
2. **Validate template published** — IF template status ≠ `published`, throw `tErrors.templateNotPublished(templateName)`.
3. **Resolve variables** — merge template variable defaults with recipient-specific overrides from `variableValues` parameter.
4. **Validate required variables** — IF any required variable has no resolved value, throw `tErrors.requiredVariableMissing(variableName)`.
5. **Validate variable types** — IF any resolved value does not match the variable's declared type, throw `tErrors.invalidVariableValue(variableName, expectedType)`.
6. **Compute idempotency key** — SHA256 over `templateId + studentId + recipientGroupId + versionId`.
7. **Check idempotency** — IF a certificate already exists with the same idempotency key, return the existing certificate (no re-generation).
8. **Create certificate record** — via `CertificateRepository.create` with status = `pending`, idempotency key, recipient data snapshot.
9. **Trigger PDF render** — delegate to Plan 6 PDF rendering engine (call `PdfRenderService.renderCertificate` — interface defined in Plan 6; this plan only defines the delegation boundary).
10. **Update certificate status** — transition `pending` → `issued` via `CertificateRepository.updateStatus`.
11. **Generate verification code** — create a unique, URL-safe verification code via `VerificationRepository.create`.
12. **Link PDF to entity** — via `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId, usageType: "certificate_pdf", filePath })`.
13. **Dispatch notification** — best-effort `dispatchWithPreferences` for `NotificationEventType.CERTIFICATE_ISSUED` to the recipient student/parent.
14. **Write audit log** — fire-and-forget `AuditService.createManyAuditLogs` with event `CERTIFICATE_GENERATED`.
15. **Return certificate record** — `CertificateReturnType` with populated verification code.

**REQ-GEN-002**: **IF** PDF rendering fails (Plan 6 throws) **THE SYSTEM SHALL** update the certificate status to `failed` (via `CertificateRepository.updateStatus`), write an audit log with the error, and re-throw a wrapped `tErrors.generationFailed(reason)` to the caller.

**REQ-GEN-003**: **WHEN** the generation pipeline reaches the idempotency check (step 7) and the DB unique index on `idempotencyKey` throws a `23505` conflict **THE SYSTEM SHALL** catch it, fetch the existing certificate, and return it as a successful idempotent response — NOT re-render the PDF.

**REQ-GEN-004**: **THE SYSTEM SHALL** use a DB transaction (`db.transaction(runner)`) wrapping steps 6-8 (idempotency key computation through certificate creation) to prevent partial writes.

### 2.4 Batch Generation

**REQ-BATCH-001**: **WHEN** `generateBatch(templateId, recipientGroupId, locale)` is invoked **THE SYSTEM SHALL**:
1. Load the recipient group with all items via `RecipientGroupRepository.findById` (with relational items + student + variable values).
2. Validate the template is published (same as REQ-GEN-002).
3. Iterate over each recipient group item and call `CertificateGenerationService.generateCertificate` per item.
4. Track progress: total count, success count, failure count, list of failures with reasons.
5. **Idempotency at batch level**: IF a recipient already has a certificate for the same template+version, skip that recipient (count as "already exists", not failure).
6. Return a `BatchGenerationResultType` with `{ total, succeeded, failed, alreadyExisted, failures: [{ recipientId, reason }] }`.

**REQ-BATCH-002**: **IF** more than 50% of recipients in a batch fail generation **THE SYSTEM SHALL** write a warning audit log and the batch result SHALL include `partialFailure: true` to signal to the caller that manual review is needed.

**REQ-BATCH-003**: **THE SYSTEM SHALL** NOT roll back already-succeeded certificates if some recipients fail — each certificate is an independent unit. The batch operation is "best-effort per recipient, all-or-nothing per certificate."

### 2.5 Certificate Revocation

**REQ-REV-001**: **WHEN** `revokeCertificate(certificateId, reason, userId, locale)` is invoked **THE SYSTEM SHALL**:
1. Load the certificate via `CertificateRepository.findById`.
2. IF not found, throw `tErrors.certificateNotFound(certificateId)`.
3. IF certificate status ≠ `issued`, throw `tErrors.certificateNotRevocable(currentStatus)`.
4. Update certificate status to `revoked` with `revocationReason` via `CertificateRepository.update`.
5. Invalidate cached PDF — call `invalidateCertificateCache(certificateId)` (defined in `cache.ts`).
6. Write audit log — `AuditService.createManyAuditLogs` with event `CERTIFICATE_REVOKED`.
7. Best-effort notification — `dispatchWithPreferences` for `NotificationEventType.CERTIFICATE_REVOKED` (optional, controlled by caller flag).

**REQ-REV-002**: **IF** revocation succeeds, the certificate's verification code SHALL still resolve (see REQ-VER-001) but SHALL report `revoked` status with the reason — the code is NOT deleted. Revocation is a soft state change, not deletion.

**REQ-REV-003**: **THE SYSTEM SHALL** wrap steps 4-6 (status update, cache invalidation setup, audit log write) in a single DB transaction.

### 2.6 Certificate Verification (Public)

**REQ-VER-001**: **WHEN** `verifyCertificate(code, requestMetadata)` is invoked **THE SYSTEM SHALL**:
1. Find the certificate by verification code via `VerificationRepository.findByCode`.
2. IF not found, throw `tErrors.invalidVerificationCode()`.
3. Load the certificate and its template metadata (template name, recipient name, issue date) — only public-safe fields.
4. Determine current effective status:
   - IF status = `issued` AND expiry date exists AND expiry date < now → effective status = `expired`.
   - IF status = `issued` → effective status = `valid`.
   - IF status = `revoked` → effective status = `revoked` (include reason).
   - IF status = `draft` or `pending` or `failed` → throw `tErrors.certificateNotAvailable()`.
5. Log the verification event via `VerificationRepository.logVerification` with `{ code, certificateId, ip, userAgent, result, timestamp }`.
6. Return a `PublicCertificateVerificationResultType` with: certificate holder name, template name, issue date, expiry date (if set), effective status, revocation reason (if revoked), verification timestamp.

**REQ-VER-002**: **THE SYSTEM SHALL** NOT expose internal fields (idempotency key, recipient student ID beyond name, template element config, internal audit fields) in the public verification response.

**REQ-VER-003**: **WHEN** the entity cache has a valid entry for the verification code **THE SYSTEM SHALL** return the cached public-safe result WITHOUT querying the database — but SHALL still log the verification event (the log is always written, cache or not).

### 2.7 Certificate Expiry

**REQ-EXP-001**: **WHEN** `checkExpiry(certificateId)` is invoked **THE SYSTEM SHALL**:
1. Load the certificate via `CertificateRepository.findById`.
2. IF status ∉ {`issued`} → no-op, return current certificate.
3. IF `expiryDate` is null → no expiry, return certificate as-is.
4. IF `expiryDate` < now → update status to `expired` via `CertificateRepository.updateStatus` and write an audit log.
5. Return the updated certificate record.

**REQ-EXP-002**: **THE SYSTEM SHALL** be idempotent — calling `checkExpiry` on an already-expired certificate is a no-op (no double status update, no double audit log).

### 2.8 Template Lifecycle (Publish / Archive / Clone / Version)

**REQ-TPL-001**: **WHEN** `TemplateManagementService.publish(templateId, userId, locale)` is invoked **THE SYSTEM SHALL**:
1. Load the template via `TemplateRepository.findById`.
2. Validate completeness — IF the template has zero elements, throw `tErrors.templateEmpty(templateName)`.
3. IF the template has any required variables with no default values and no fallback, throw `tErrors.requiredVariableNoDefault(variableName)`.
4. Create a version snapshot via `TemplateRepository.createVersionSnapshot` (deep copy of elements + variables into a version row).
5. Update template status to `published` and increment `currentVersion` via `TemplateRepository.update`.
6. Invalidate all cached renders for this template — call `invalidateTemplateCache(templateId)`.
7. Write audit log — `TemplatePublished` event.

**REQ-TPL-002**: **WHEN** `TemplateManagementService.archive(templateId, userId, locale)` is invoked **THE SYSTEM SHALL** update template status to `archived` and prevent new certificate generation (REQ-GEN-002 check will reject archived templates).

**REQ-TPL-003**: **WHEN** `TemplateManagementService.cloneTemplate(templateId, newName, userId, locale)` is invoked **THE SYSTEM SHALL**:
1. Load the source template with elements and variables (relational load).
2. Create a new template with status = `draft`, the given `newName`, and copied `categoryId`.
3. Copy all elements (preserving order, type, content) via `TemplateElementRepository.createMany`.
4. Copy all variables (preserving key, type, default value, required flag) via `TemplateVariableRepository.createMany`.
5. Return the cloned template's `TemplateReturnType`.
6. Write audit log.

**REQ-TPL-004**: **WHEN** `TemplateManagementService.getVersionChain(templateId)` is invoked **THE SYSTEM SHALL** return the ordered list of version snapshots for the template (oldest → newest) via `TemplateRepository.getVersionChain`.

**REQ-TPL-005**: **WHEN** `TemplateManagementService.rollbackToVersion(templateId, versionId, userId, locale)` is invoked **THE SYSTEM SHALL**:
1. Load the version snapshot via `TemplateRepository.findVersionById`.
2. Verify the snapshot belongs to the template — IF not, throw `tErrors.versionNotOwned(versionId)`.
3. Replace the current template's elements and variables with a copy from the snapshot.
4. Increment `currentVersion` and write audit log.
5. Invalidate template cache.

### 2.9 Template Element CRUD & Reorder

**REQ-ELEM-001**: **WHEN** an element is created or updated **THE SYSTEM SHALL** validate type-specific constraints:
- **text** element: `content` field is required (non-empty string).
- **image** element: `storageUrl` field is required (must be a valid storage reference linked via `StorageService.linkFileToEntity`).
- **signature** element: must reference a valid signature entity ID.
- **qr** element: `size` field must be a positive integer ≤ 500px.
- **border** element: `width` must be a positive integer ≤ 50px.
- **datetime** element: `format` field must be a valid date format string.

**REQ-ELEM-002**: **IF** element type validation fails **THE SYSTEM SHALL** throw `tErrors.invalidElementConfig(elementType, field)` with the specific field and reason.

**REQ-ELEM-003**: **WHEN** `reorderElements(templateId, orderedElementIds)` is invoked **THE SYSTEM SHALL** update the `zIndex` (or `displayOrder`) field of each element to match the provided order, validate all IDs belong to the template, and write an audit log.

### 2.10 Template Variable CRUD

**REQ-VAR-001**: **WHEN** a template variable is created or updated **THE SYSTEM SHALL** validate:
- `key` is unique within the template (no duplicate keys).
- `type` is one of: `text`, `date`, `number`, `boolean`, `select`.
- IF `type` = `select`, `options` array must be non-empty.
- IF `required` = true and `defaultValue` is null, this is allowed (the MUST be provided at generation time).
- IF `required` = false and `defaultValue` is null, this is allowed (variable resolves to empty string at generation).
- IF `defaultValue` is provided, it must validate against the declared `type`:
  - `text` → string
  - `date` → valid ISO date string
  - `number` → finite number
  - `boolean` → true/false
  - `select` → value must be in `options`

**REQ-VAR-002**: **IF** variable key duplicates an existing key in the template **THE SYSTEM SHALL** throw `tErrors.variableKeyConflict(key)`.

### 2.11 Recipient Group Management

**REQ-RGP-001**: **WHEN** `RecipientGroupService.create({ templateId, name, description, userId, locale })` is invoked **THE SYSTEM SHALL** create the group linked to the template and write an audit log.

**REQ-RGP-002**: **WHEN** `addStudent(groupId, studentId, variableValues, userId, locale)` is invoked **THE SYSTEM SHALL**:
1. Validate the student exists (via `StudentRepository.findById`).
2. Validate the student is not already in the group — IF already a member, throw `tErrors.studentAlreadyInGroup(studentId, groupId)`.
3. Validate `variableValues` against the template variables:
   - For each key in `variableValues`, the corresponding template variable must exist.
   - Each value must validate against the variable's declared type (same rules as REQ-VAR-001).
   - Required variables without a default MUST have a value provided here.
4. Create the group item via `RecipientGroupRepository.addItem`.
5. Store variable values via `RecipientGroupRepository.setItemVariableValues`.
6. Write audit log.

**REQ-RGP-003**: **WHEN** `removeStudent(groupId, studentId, userId, locale)` is invoked **THE SYSTEM SHALL** soft-delete the group item and write an audit log.

**REQ-RGP-004**: **WHEN** `setVariableValue(groupId, studentId, variableKey, value, userId, locale)` is invoked **THE SYSTEM SHALL** upsert the variable value for that recipient, validate against the template variable type, and write an audit log.

### 2.12 Category Management

**REQ-CAT-001**: **WHEN** `CategoryService.create({ name, parentId, displayOrder, userId, locale })` is invoked **THE SYSTEM SHALL**:
1. IF `parentId` is provided, validate the parent exists and the resulting tree has no circular reference (the new category cannot be its own ancestor).
2. Create the category via `CertificateCategoryRepository.create`.
3. Invalidate the category tree cache.
4. Write audit log.

**REQ-CAT-002**: **WHEN** `CategoryService.move(categoryId, newParentId, userId, locale)` is invoked **THE SYSTEM SHALL**:
1. Validate the category exists.
2. IF `newParentId` is provided, validate no circular reference: the target parent must NOT be a descendant of the category being moved.
3. Update `parentId` via `CertificateCategoryRepository.update`.
4. Invalidate the category tree cache.
5. Write audit log.

**REQ-CAT-003**: **WHEN** `CategoryService.delete(categoryId, userId, locale)` is invoked **THE SYSTEM SHALL**:
1. IF the category has child categories, throw `tErrors.categoryHasChildren(categoryId)`.
2. IF the category has templates assigned, throw `tErrors.categoryHasTemplates(categoryId, count)` with pluralization.
3. Soft-delete the category via `CertificateCategoryRepository.softDelete`.
4. Invalidate the category tree cache.
5. Write audit log.

**REQ-CAT-004**: **WHEN** `CategoryService.getTree()` is invoked **THE SYSTEM SHALL** return the full category tree (parent → children) using the entity cache. IF the cache is empty or stale, rebuild from `CertificateCategoryRepository.findAll` and populate the cache.

### 2.13 Idempotency

**REQ-IDM-001**: **THE SYSTEM SHALL** compute the idempotency key for certificate generation as `SHA256(templateId + ":" + studentId + ":" + recipientGroupId + ":" + versionId)` — deterministic, URL-safe hex digest.

**REQ-IDM-002**: **THE SYSTEM SHALL** rely on the DB unique index on `certificates.idempotencyKey` (created in Plan 1) as the primary idempotency mechanism, NOT the `IdempotencyService` — because certificate creation is a durable write that must persist the idempotency record even on partial failure.

**REQ-IDM-003**: **IF** the idempotency key is null (missing student/group/version) **THE SYSTEM SHALL** allow generation without idempotency (rare case for ad-hoc generation outside batch flows) but SHALL log a warning audit entry.

### 2.14 Caching

**REQ-CACHE-001**: **WHEN** `TemplateManagementService.getById` is invoked **THE SYSTEM SHALL** first check the entity cache for `template:${templateId}`. IF cached and not invalidated, return the cached `TemplateReturnType`. IF not cached, load from repository, populate cache, and return.

**REQ-CACHE-002**: **WHEN** `CertificateVerificationService.verifyCertificate` is invoked **THE SYSTEM SHALL** check the cache for `cert:verify:${code}`. IF cached and the certificate's status is `issued` (stable state), return the cached public-safe result. IF status is `revoked` or `expired`, bypass cache (these are less frequent and the reason might have changed).

**REQ-CACHE-003**: **WHEN** `CategoryService.getTree` is invoked **THE SYSTEM SHALL** check the cache for `cert:category:tree`. Cache invalidation occurs on any create/move/delete operation (REQ-CAT-001 through REQ-CAT-003).

**REQ-CACHE-004**: **THE SYSTEM SHALL** follow the Siraj cache rules: cache reads are fail-open (IF the cache is unavailable, fall through to the repository without error). Permission checks MUST happen BEFORE any cache lookup.

**REQ-CACHE-005**: **WHEN** a template is published, archived, cloned, or rolled back **THE SYSTEM SHALL** invalidate the template cache (`template:${templateId}`) and the template's version chain cache.

**REQ-CACHE-006**: **WHEN** a certificate is revoked **THE SYSTEM SHALL** invalidate the certificate's verification cache (`cert:verify:${code}`) and the PDF render cache (`ec:cert:pdf:${certificateId}`).

### 2.15 Error Handling

**REQ-ERR-001**: **THE SYSTEM SHALL** define and use the following error categories:
- `NotFoundError` — entity not found, from `@/backend/lib`. Constructor signature: `NotFoundError(entityLabel, message)`.
- `ValidationError` — input validation failure (Zod parse failure or custom validation). Constructor: `ValidationError(message, field?)`.
- `ConflictError` — duplicate or state conflict (e.g., 23505 unique violation, student already in group). Constructor: `ConflictError(message, code?)`.
- `AuthorizationError` — insufficient permissions. Constructor: `AuthorizationError(permissionName)`.

**REQ-ERR-002**: **ALL** error messages thrown by services SHALL be translated via `tErrors.<key>(params)` — no hardcoded English or Arabic strings in service files.

**REQ-ERR-003**: **WHEN** a repository throws a raw DB error (e.g., `23505`) that reaches the service **THE SYSTEM SHALL** catch it and re-throw as the appropriate typed error (`ConflictError` for 23505) with a translated message.

**REQ-ERR-004**: **WHEN** a Zod validation schema parse fails **THE SYSTEM SHALL** throw `ValidationError` with the first field's translated message (e.g., `tErrors.invalidInput(field)`).

### 2.16 Audit Logging

**REQ-AUDIT-001**: **THE SYSTEM SHALL** write an audit log for every state-changing operation:
- Certificate: generated, revoked, expired (auto)
- Template: published, archived, cloned, version rolled back
- Element: created, updated, deleted, reordered
- Variable: created, updated, deleted
- Recipient group: created, student added, student removed, variable value set
- Category: created, moved, deleted

**REQ-AUDIT-002**: **THE SYSTEM SHALL** wrap audit log writes in try/catch — audit failures MUST NOT fail the primary operation. Logs are fire-and-forget.

### 2.17 Notifications

**REQ-NOTIF-001**: **WHEN** a certificate is successfully generated (status → issued) **THE SYSTEM SHALL** dispatch a `CERTIFICATE_ISSUED` notification to the recipient student and their parent (if linked) via `dispatchWithPreferences`. Notification dispatch is best-effort — failures are logged but do not fail the generation.

**REQ-NOTIF-002**: **WHEN** a certificate is revoked **THE SYSTEM SHALL** dispatch a `CERTIFICATE_REVOKED` notification IF the caller passed `notifyRecipient: true`. Best-effort dispatch.

**REQ-NOTIF-003**: **THE SYSTEM SHALL** add `NotificationEventType.CERTIFICATE_ISSUED` and `NotificationEventType.CERTIFICATE_REVOKED` to the notification event type enum (atomic with Plan 2 type work).

### 2.18 Storage Integration

**REQ-STOR-001**: **WHEN** a certificate PDF is generated **THE SYSTEM SHALL** link the PDF file to the certificate entity via `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId: certificateId, usageType: "certificate_pdf", filePath })`. This is called AFTER the PDF is rendered (Plan 6) and BEFORE the status transitions to `issued`.

**REQ-STOR-002**: **WHEN** a certificate is revoked **THE SYSTEM SHALL** NOT delete the stored PDF — the file remains for audit. Revocation only invalidates the cache, not the file.

---

## 3. i18n Translation Keys

### 3.1 Namespace

All service-layer translation keys live under namespace `certificates.errors.services`.

Type schema file: `shared/locale/certificates.errors.services.ts`
Implementations: `shared/locale/en/certificates.errors.services.ts`, `shared/locale/ar/certificates.errors.services.ts`

Notification-type keys live under namespace `certificates.notifications`.

### 3.2 Error Key Reference

| Key | Params | English | Arabic |
|---|---|---|---|
| `templateNotFound` | `id: string` | `Template not found: {id}` | `لم يتم العثور على القالب: {id}` |
| `templateNotPublished` | `name: string` | `Template "{name}" is not published` | `القالب "{name}" غير منشور` |
| `templateEmpty` | `name: string` | `Template "{name}" has no elements — cannot publish` | `القالب "{name}" لا يحتوي على عناصر — لا يمكن النشر` |
| `requiredVariableNoDefault` | `variableName: string` | `Required variable "{variableName}" has no default value` | `المتغير المطلوب "{variableName}" لا يحمل قيمة افتراضية` |
| `certificateNotFound` | `id: string` | `Certificate not found: {id}` | `لم يتم العثور على الشهادة: {id}` |
| `certificateNotRevocable` | `currentStatus: string` | `Certificate cannot be revoked — current status: {currentStatus}` | `لا يمكن إلغاء الشهادة — الحالة الحالية: {currentStatus}` |
| `certificateNotAvailable` | — | `This certificate is not available for verification` | `هذه الشهادة غير متاحة للتحقق` |
| `certificateRevoked` | — | `This certificate has been revoked` | `تم إلغاء هذه الشهادة` |
| `certificateExpired` | `expiryDate: string` | `This certificate expired on {expiryDate}` | `انتهت صلاحية هذه الشهادة في {expiryDate}` |
| `invalidVerificationCode` | — | `Invalid verification code` | `رمز التحقق غير صالح` |
| `duplicateCertificate` | `studentName: string` | `Certificate already exists for {studentName}` | `توجد شهادة بالفعل لـ {studentName}` |
| `generationFailed` | `reason: string` | `Certificate generation failed: {reason}` | `فشل في إنشاء الشهادة: {reason}` |
| `batchGenerationPartialFailure` | `failedCount: number, totalCount: number` | `Batch generation had {failedCount} of {totalCount} failures` | `فشل في إنشاء {failedCount} من أصل {totalCount} شهادة` |
| `alreadyGenerated` | `studentName: string` | `Certificate already generated for {studentName} — skipped` | `تم إنشاء الشهادة بالفعل لـ {studentName} — تم التخطي` |
| `requiredVariableMissing` | `variableName: string` | `Required variable "{variableName}" is missing` | `المتغير المطلوب "{variableName}" غير متوفر` |
| `invalidVariableValue` | `variableName: string, expectedType: string` | `Variable "{variableName}" must be of type {expectedType}` | `المتغير "{variableName}" يجب أن يكون من نوع {expectedType}` |
| `invalidElementConfig` | `elementType: string, field: string` | `Element of type "{elementType}" has invalid "{field}" field` | `عنصر من نوع "{elementType}" لديه حقل "{field}" غير صالح` |
| `invalidInput` | `field: string` | `Invalid input for field "{field}"` | `إدخال غير صالح للحقل "{field}"` |
| `variableKeyConflict` | `key: string` | `Variable key "{key}" already exists in template` | `مفتاح المتغير "{key}" موجود بالفعل في القالب` |
| `studentAlreadyInGroup` | `studentId: string, groupId: string` | `Student {studentId} is already in group {groupId}` | `الطالب {studentId} موجود بالفعل في المجموعة {groupId}` |
| `recipientGroupNotFound` | `id: string` | `Recipient group not found: {id}` | `لم يتم العثور على مجموعة المستفيدين: {id}` |
| `recipientGroupEmpty` | `id: string` | `Recipient group {id} has no members` | `مجموعة المستفيدين {id} لا تحتوي على أعضاء` |
| `categoryNotFound` | `id: string` | `Category not found: {id}` | `لم يتم العثور على الفئة: {id}` |
| `categoryHasChildren` | `id: string` | `Cannot delete category {id} — it has child categories` | `لا يمكن حذف الفئة {id} — تحتوي على فئات فرعية` |
| `categoryHasTemplates` | `id: string, count: number` | one: `Cannot delete category {id} — 1 template assigned` · other: `Cannot delete category {id} — {count} templates assigned` | zero: `لا يمكن حذف الفئة {id} — لا توجد قوالب معينة` · one: `لا يمكن حذف الفئة {id} — قالب واحد معين` · two: `لا يمكن حذف الفئة {id} — قالبان معينان` · few: `لا يمكن حذف الفئة {id} — {count} قوالب معينة` · many: `لا يمكن حذف الفئة {id} — {count} قالباً معيناً` · other: `لا يمكن حذف الفئة {id} — {count} قالب معين` |
| `circularReference` | `categoryId: string, parentId: string` | `Circular reference detected — category {categoryId} cannot be child of {parentId}` | `تم اكتشاف مرجع دائري — الفئة {categoryId} لا يمكن أن تكون فرعاً من {parentId}` |
| `versionNotFound` | `versionId: string` | `Template version not found: {versionId}` | `لم يتم العثور على إصدار القالب: {versionId}` |
| `versionNotOwned` | `versionId: string` | `Version {versionId} does not belong to this template` | `الإصدار {versionId} لا ينتمي إلى هذا القالب` |
| `insufficientPermissions` | `permissionName: string` | `Insufficient permissions — requires {permissionName}` | `صلاحيات غير كافية — يتطلب {permissionName}` |
| `elementNotFound` | `id: string` | `Template element not found: {id}` | `لم يتم العثور على عنصر القالب: {id}` |
| `variableNotFound` | `id: string` | `Template variable not found: {id}` | `لم يتم العثور على متغير القالب: {id}` |

### 3.3 Notification Key Reference

Namespace: `certificates.notifications`

| Key | Params | English | Arabic |
|---|---|---|---|
| `certificateIssuedTitle` | — | `Certificate Issued` | `تم إصدار الشهادة` |
| `certificateIssuedBody` | `studentName: string, templateName: string` | `A certificate has been issued for {studentName} ({templateName}).` | `تم إصدار شهادة لـ {studentName} ({templateName}).` |
| `certificateRevokedTitle` | — | `Certificate Revoked` | `تم إلغاء الشهادة` |
| `certificateRevokedBody` | `studentName: string, reason: string` | `The certificate for {studentName} has been revoked. Reason: {reason}` | `تم إلغاء شهادة {studentName}. السبب: {reason}` |

### 3.4 Pluralization Rules

| Locale | Rule | Example |
|---|---|---|
| `en` | `one` / `other` | `categoryHasTemplates`: one → `1 template`, other → `{count} templates` |
| `ar` | `zero / one / two / few / many / other` | `categoryHasTemplates`: six CLDR forms (see table above) |

### 3.5 Translation Type Schema Location

The type schema for `certificates.errors.services` SHALL be defined in
`shared/locale/certificates.errors.services.ts` (type) with implementations in
`shared/locale/en/certificates.errors.services.ts` and
`shared/locale/ar/certificates.errors.services.ts`.

The type schema for `certificates.notifications` SHALL be defined in
`shared/locale/certificates.notifications.ts` with implementations in
`shared/locale/en/certificates.notifications.ts` and
`shared/locale/ar/certificates.notifications.ts`.

All files are created as part of this plan's task scope (i18n is inline).

> Note: The shared/locale system is compile-time TypeScript. Each key is a function
> `(params...) => string` declared in the type schema and implemented in each locale
> file. The `tErrors` parameter type is the bound function set: an object with one
> method per key, already locale-bound. Services construct it via
> `getServerTranslations(locale).errorsTranslations`.

---

## 4. Acceptance Criteria

### 4.1 Service Architecture
- **AC-1**: Every service file exports exactly one `namespace {Entity}Service` with no class definitions and no inline schema redefinitions.
- **AC-2**: `bun tsgo` passes with zero new type errors in any cert service file.
- **AC-3**: `bun biome:check` passes on every cert service file.
- **AC-4**: `bun run lint` passes on every cert service file (via lint queue client).
- **AC-5**: No service file imports from `@/app/**`, `@/frontend/**`, or reads from any GraphQL context.

### 4.2 Permission Enforcement
- **AC-6**: `CertificateGenerationService.generateCertificate` throws `AuthorizationError` when the caller lacks `CERT_GENERATE`.
- **AC-7**: `CertificateVerificationService.verifyCertificate` succeeds WITHOUT authentication (public).
- **AC-8**: `CertificateRevocationService.revokeCertificate` throws `AuthorizationError` when the caller lacks `CERT_MANAGE`.
- **AC-9**: `TemplateManagementService.publish/archive/cloneTemplate` throws `AuthorizationError` when the caller lacks `TEMPLATE_MANAGE`.
- **AC-10**: Every permission-denied path writes an audit log of the attempt.

### 4.3 Generation Pipeline
- **AC-11**: `generateCertificate` follows the 15-step pipeline (REQ-GEN-001) in order — no skipped steps.
- **AC-12**: IF template status ≠ `published`, generation throws `tErrors.templateNotPublished`.
- **AC-13**: IF a required variable has no resolved value, generation throws `tErrors.requiredVariableMissing`.
- **AC-14**: IF a variable value does not match the declared type, generation throws `tErrors.invalidVariableValue`.
- **AC-15**: IF the idempotency key already exists (23505 or pre-check), generation returns the existing certificate WITHOUT re-rendering the PDF.
- **AC-16**: IF PDF rendering fails, certificate status transitions to `failed` and audit log is written.
- **AC-17**: The idempotency key computation (step 6) through certificate creation (step 8) is wrapped in `db.transaction(runner)`.

### 4.4 Batch Generation
- **AC-18**: `generateBatch` processes all recipients in the group and returns `{ total, succeeded, failed, alreadyExisted, failures }`.
- **AC-19**: Recipients with an existing certificate for the same template+version are skipped and counted as `alreadyExisted`, NOT `failed`.
- **AC-20**: IF >50% of recipients fail, the batch result includes `partialFailure: true`.
- **AC-21**: Succeeded certificates in a batch are NOT rolled back when other recipients fail.

### 4.5 Revocation
- **AC-22**: `revokeCertificate` updates status to `revoked` with reason, invalidates caches, writes audit log.
- **AC-23**: Revoked certificate's verification code still resolves and reports `revoked` status + reason.
- **AC-24**: Revoking a non-`issued` certificate throws `tErrors.certificateNotRevocable`.

### 4.6 Verification
- **AC-25**: `verifyCertificate` returns public-safe fields only (no internal IDs beyond holder name).
- **AC-26**: `verifyCertificate` logs every verification event (IP, UA, result) even when cache hit.
- **AC-27**: Expired certificates (status = issued but expiry < now) report `expired` effective status without a DB write.
- **AC-28**: Revoked certificates report `revoked` status with the reason.

### 4.7 Expiry
- **AC-29**: `checkExpiry` transitions `issued` → `expired` when `expiryDate < now`.
- **AC-30**: `checkExpiry` is idempotent — calling on an already-expired certificate is a no-op.

### 4.8 Template Lifecycle
- **AC-31**: `publish` rejects empty templates (zero elements) with `tErrors.templateEmpty`.
- **AC-32**: `publish` creates a version snapshot (deep copy of elements + variables).
- **AC-33**: `publish` invalidates cached renders for the template.
- **AC-34**: `archive` prevents new certificate generation (REQ-GEN-002 check rejects).
- **AC-35**: `cloneTemplate` copies all elements and variables to a new `draft` template.
- **AC-36**: `rollbackToVersion` replaces current elements/variables with the snapshot, increments version, invalidates cache.

### 4.9 Element & Variable CRUD
- **AC-37**: Type-specific validation is enforced for each element type (text→content, image→storageUrl, qr→size, etc.).
- **AC-38**: `reorderElements` updates `zIndex`/`displayOrder` in the provided order and validates all IDs belong to the template.
- **AC-39**: Variable `key` uniqueness is enforced within a template.
- **AC-40**: Variable `defaultValue` validates against the declared `type`.

### 4.10 Recipient Group
- **AC-41**: `addStudent` validates variable values against template variable types.
- **AC-42**: `addStudent` rejects duplicate student membership with `tErrors.studentAlreadyInGroup`.
- **AC-43**: `removeStudent` soft-deletes the group item.
- **AC-44**: `setVariableValue` upserts the value and validates against the variable type.

### 4.11 Category Management
- **AC-45**: `create` with a `parentId` validates no circular reference.
- **AC-46**: `move` rejects moves that would create circular references (target parent is a descendant).
- **AC-47**: `delete` rejects categories with children or assigned templates.
- **AC-48**: `getTree` uses the entity cache and rebuilds on miss.

### 4.12 Idempotency
- **AC-49**: Idempotency key is SHA256 over `templateId:studentId:recipientGroupId:versionId`.
- **AC-50**: DB unique index on `idempotencyKey` catches duplicates even if the pre-check misses (race condition).

### 4.13 Caching
- **AC-51**: Cache reads are fail-open — cache unavailability does NOT throw.
- **AC-52**: Permission checks happen BEFORE cache lookups.
- **AC-53**: Template cache is invalidated on publish, archive, clone, rollback.
- **AC-54**: Verification cache is bypassed for `revoked`/`expired` certificates.
- **AC-55**: Category tree cache is invalidated on any category create/move/delete.

### 4.14 Error Handling
- **AC-56**: All error messages are translated via `tErrors` — no hardcoded strings.
- **AC-57**: Raw DB errors (23505) are caught and re-thrown as `ConflictError` with translated message.
- **AC-58**: Zod validation failures throw `ValidationError` with translated field message.

### 4.15 Audit & Notifications
- **AC-59**: Every state-changing operation writes an audit log (fire-and-forget).
- **AC-60**: Audit log failures do NOT fail the primary operation.
- **AC-61**: `CERTIFICATE_ISSUED` notification is dispatched on successful generation (best-effort).
- **AC-62**: `CERTIFICATE_REVOKED` notification is dispatched on revocation when `notifyRecipient: true`.

### 4.16 i18n
- **AC-63**: The type schema `shared/locale/certificates.errors.services.ts` declares every key in §3.2 as a function with the correct param signature.
- **AC-64**: The English implementation covers every key with correct interpolation.
- **AC-65**: The Arabic implementation covers every key with correct interpolation and six-form pluralization for `categoryHasTemplates`.
- **AC-66**: No service file constructs a translation string directly — all use `tErrors.<key>(params)`.

---

## 5. AGENTS.md & Instruction File References

Files created/modified in this plan must comply with:

### 5.1 AGENTS.md Files

| File | Applies To |
|---|---|
| `AGENTS.md` (root) | All files — logging, path aliases, i18n, theme |
| `backend/services/AGENTS.md` | All service files — canonical service rules |
| `shared/AGENTS.md` | `shared/locale/` files — i18n system rules |
| `backend/types/AGENTS.md` | If any type re-exports touch `backend/types/` |

### 5.2 Instruction Files

| File | Applies To |
|---|---|
| `.agents/instructions/backend.instructions.md` | All `backend/**/*.ts` files |

### 5.3 Relevant Quality Commands

```bash
bun tsgo                    # Type check — safe for parallel
bun biome:check             # Format + lint — safe for parallel
bun run lint                # Lint queue client — safe for parallel (serialized behind queue server)
bun run scripts/health/sub-loop.ts <file> --lifecycle lint  # Per-file progressive verification
```

---

## 6. Outcome & Knowledge Transfer Protocol

### 6.1 Deviation Log

Any pattern deviation from `siraj_analysis/04-services-graphql-patterns.md` §B/§D
discovered during implementation SHALL be documented inline as a comment in the
relevant file AND logged to the session `todos` table with a `deviation` label.

### 6.2 Knowledge Artifacts for Plan 21

| Artifact | Target Location |
|---|---|
| Certificate service namespace list | `docs/certificates/service-patterns.md` (created in Plan 21) |
| Generation pipeline flow reference | `docs/certificates/service-patterns.md` |
| Idempotency key formula | `docs/certificates/service-patterns.md` |
| Cache key/invalidation map | `docs/certificates/service-patterns.md` |
| i18n error keys for service layer | `shared/locale/` type schema + en/ar implementations (done in this plan) |

### 6.3 Handoff to Plan 5 (GraphQL)

The GraphQL resolvers (Plan 5) consume the services via:
- Import from `@/backend/services` (top-level barrel)
- Construct `tErrors` via `ctx.t().errorsTranslations` (already bound to `ctx.locale`)
- Pass `userId` from `ctx.user.id` and `locale` from `ctx.locale`
- Wrap service results in Pothos object types (Plan 5 owns the GraphQL schema, not this plan)

### 6.4 Handoff to Plan 6 (PDF Rendering)

Plan 6 implements `PdfRenderService.renderCertificate`. This plan (Plan 4) calls it
at step 9 of the generation pipeline (REQ-GEN-001). The interface contract:
- **Input**: `{ certificateId, templateSnapshot, resolvedVariables, locale }`
- **Output**: `{ filePath, renderMetadata }`
- **Error contract**: IF rendering fails, Plan 6 throws — Plan 4 catches and transitions the certificate to `failed`.

### 6.5 Handoff to Plan 7 (Storage)

Plan 7 implements `StorageService.linkFileToEntity`. This plan (Plan 4) calls it at
step 12 of the generation pipeline. The interface contract is defined in Plan 7.
