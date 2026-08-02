# Plan 04 — Services & Business Logic: Requirements (EARS)

## Document Information

- **Feature Name**: Certificate Generation & Verification — Service Layer
- **Plan Number**: 04 (Services & Business Logic)
- **Version**: 1.0
- **Date**: 2026-08-01
- **Related Documents**:
  - [Design](./design.md)
  - [Tasks](./tasks.md)
- **Depends On**: Plan 03 (Repository Layer) — all repository interfaces, types, and enums must exist
- **Depended On By**: Plan 05 (GraphQL API), Plan 06 (PDF Rendering Engine)
- **Outcome Directory**: `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/`

---

## Overview

This plan defines the **service-layer business logic** for the certificate feature. Five domain service namespaces live in `backend/services/certificates/` and orchestrate template management, certificate generation, verification, recipient-group management, and certificate lifecycle operations (revoke, download). Services are SSR-safe, never throw `GraphQLError`, gate via `PermissionsService`, emit localized errors via `getServerTranslations`, and follow the existing namespace-of-pure-functions pattern documented in `backend/services/AGENTS.md` and the Siraj analysis (`.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md`).

### Service Namespaces

| Namespace | File | Responsibility |
|-----------|------|----------------|
| `TemplateManagementService` | `template-management.service.ts` | Template CRUD, version management, publish/archive status transitions |
| `RecipientGroupService` | `recipient-group.service.ts` | Recipient group creation, student assignment, variable resolution |
| `CertificateManagementService` | `certificate-management.service.ts` | Certificate listing, getById, revocation, download URL resolution |
| `CertificateGenerationService` | `certificate-generation.service.ts` | Generation orchestration: validate template, resolve recipient group + variables, derive idempotency key, create record, trigger PDF rendering (delegated to Plan 06), create verification code |
| `CertificateVerificationService` | `certificate-verification.service.ts` | Verify by code, log verification attempts |

---

## Requirements (EARS Format)

### REQ-04-01: Template Creation

**The system shall** allow an actor with `CERTIFICATES_MANAGE_TEMPLATE` permission to create a certificate template with a name, optional description, layout configuration, and template-variable definitions.

- **Input**: `{ name: string, description?: string, layoutConfig: object, variables: TemplateVariableInput[] }`
- **Output**: `TemplateReturnType` (with `id`, `status: DRAFT`, `version: 1`)
- **Permission**: `AppPermission.CERTIFICATES_MANAGE_TEMPLATE`
- **Validation**:
  - `name` must be 3–255 characters (throw `ValidationError` with `tErrors.cert.templateNameInvalid`)
  - `layoutConfig` must be a non-null JSON object (throw `ValidationError` with `tErrors.cert.invalidLayoutConfig`)
  - Each variable definition must specify a `type` from `TemplateVariableType` enum
- **Side-effects**: Audit log via `AuditService.createManyAuditLogs` (best-effort, fire-and-forget in `try/catch`)
- **Localization**: All error messages via `tErrors.cert.*` namespace

_When_ an actor without `CERTIFICATES_MANAGE_TEMPLATE` permission attempts to create a template, _the system shall_ throw `Error(tErrors.insufficientPermissions)`.

_When_ the template name is fewer than 3 or more than 255 characters, _the system shall_ throw `Error(tErrors.cert.templateNameInvalid)`.

---

### REQ-04-02: Template Editing

**The system shall** allow an actor with `CERTIFICATES_MANAGE_TEMPLATE` permission to edit a template that is in `DRAFT` status.

- **Input**: `{ templateId: string, name?: string, description?: string, layoutConfig?: object, variables?: TemplateVariableInput[] }`
- **Output**: `TemplateReturnType`
- **Permission**: `AppPermission.CERTIFICATES_MANAGE_TEMPLATE`
- **Constraint**: Only `DRAFT` templates can be edited. Editing a `PUBLISHED` template throws `Error(tErrors.cert.templateNotEditable)`.

_When_ the actor attempts to edit a template that does not exist, _the system shall_ throw `NotFoundError("TEMPLATE", tErrors.cert.templateNotFound(templateId))`.

_When_ the actor attempts to edit a `PUBLISHED` template, _the system shall_ throw `Error(tErrors.cert.templateNotEditable)` and instruct the actor to create a new version instead.

---

### REQ-04-03: Template Publishing (Status Transition)

**The system shall** allow an actor with `CERTIFICATES_MANAGE_TEMPLATE` permission to publish a `DRAFT` template, transitioning its status to `PUBLISHED` and creating an immutable template version snapshot.

- **Input**: `{ templateId: string, changelog?: string }`
- **Output**: `TemplateReturnType` with `status: PUBLISHED`
- **Permission**: `AppPermission.CERTIFICATES_MANAGE_TEMPLATE`
- **Actions**:
  1. Validate template exists and is in `DRAFT` status
  2. Create a new `TemplateVersion` record (snapshot of current layout + variables)
  3. Set template `status` to `PUBLISHED`
  4. Invalidate cache via `invalidateCertificateTemplateWrite(templateId)`
  5. Audit log (best-effort)
- **Post-condition**: Published templates are immutable; further edits require creating a new version

_When_ a template in `ARCHIVED` status is targeted for publish, _the system shall_ throw `Error(tErrors.cert.templateArchived)`.

_When_ the template has no defined template variables, _the system shall_ throw `Error(tErrors.cert.templateMissingVariables)`.

---

### REQ-04-04: Template Archiving

**The system shall** allow an actor with `CERTIFICATES_MANAGE_TEMPLATE` permission to archive a `PUBLISHED` template, transitioning its status to `ARCHIVED`.

- **Input**: `{ templateId: string, reason?: string }`
- **Output**: `TemplateReturnType` with `status: ARCHIVED`
- **Permission**: `AppPermission.CERTIFICATES_MANAGE_TEMPLATE`
- **Post-condition**: Archived templates cannot be used for new certificate generation. Existing certificates referencing prior published versions remain valid.

_When_ the template does not exist, _the system shall_ throw `NotFoundError("TEMPLATE", tErrors.cert.templateNotFound(templateId))`.

---

### REQ-04-05: Template Version Management

**The system shall** maintain an immutable version history for each template, where each published version captures the full layout configuration and variable definitions at the time of publishing.

- **Query**: `getTemplateVersions(templateId): TemplateVersionReturnType[]`
- **Query**: `getTemplateVersion(templateId, versionId): TemplateVersionReturnType`
- **Permission**: `AppPermission.CERTIFICATES_MANAGE_TEMPLATE`
- **Constraint**: Version records are append-only; they can never be modified or deleted (only via schema-level cascade on template hard-delete, which is itself disabled by repo policy)

_When_ a new version is published, _the system shall_ increment the template's `version` field and create a new `TemplateVersion` row with the snapshot of `layoutConfig`, `variables`, and `changelog`.

---

### REQ-04-06: Recipient Group Creation

**The system shall** allow an actor with `CERTIFICATES_MANAGE_TEMPLATE` permission to create a recipient group under a specific template.

- **Input**: `{ templateId: string, name: string, description?: string, eventDate?: Date }`
- **Output**: `RecipientGroupReturnType`
- **Permission**: `AppPermission.CERTIFICATES_MANAGE_TEMPLATE`
- **Validation**:
  - `name` must be 3–255 characters (throw `Error(tErrors.cert.recipientGroupNameInvalid)`)
  - Template must exist (throw `NotFoundError("TEMPLATE", tErrors.cert.templateNotFound(templateId))`)

_When_ the template referenced does not exist, _the system shall_ throw `NotFoundError("TEMPLATE", tErrors.cert.templateNotFound(templateId))`.

---

### REQ-04-07: Student Assignment to Recipient Groups

**The system shall** allow an actor with `CERTIFICATES_MANAGE_TEMPLATE` permission to assign one or more students to a recipient group in a batch operation.

- **Input**: `{ recipientGroupId: string, studentIds: string[] }`
- **Output**: `{ assignedCount: number, skipped: Array<{ studentId: string, reason: string }> }`
- **Permission**: `AppPermission.CERTIFICATES_MANAGE_TEMPLATE`
- **Constraint**: A student cannot be added to the same group twice (unique constraint at DB level enforced in Plan 03)
- **Constraint**: A recipient group with students cannot be deleted (validated at service level: `studentCount > 0` → `Error(tErrors.cert.recipientGroupHasStudents)`)

_When_ a student is already in the group, _the system shall_ skip that student and include them in the `skipped` array with `reason: "already_assigned"`.

---

### REQ-04-08: Template Variable Resolution

**The system shall** resolve template variables for each recipient by mapping student data and per-recipient variable values to the template's variable keys.

- **Input**: `{ recipientGroupId: string, templateVersionId: string }`
- **Output**: `Map<string, Record<string, string>>` — keyed by `studentId`, value is `{ variableKey: resolvedValue }`
- **Resolution logic per variable key**:
  - **Student-sourced** (`sourceType: STUDENT`): Read from student record (e.g., `name` → `student.name`, `email` → `student.email`, `dateOfBirth` → formatted date)
  - **Custom variable** (`sourceType: VARIABLE`): Read from `RecipientGroupItemVariableValue` for the specific `(recipientGroupItemId, templateVariableId)` pair
  - **Certificate-sourced** (`sourceType: CERTIFICATE`): Resolved at generation time (`verificationCode`, `issueDate`) — these are placeholders resolved after certificate creation
- **Permission**: `AppPermission.CERTIFICATES_MANAGE_TEMPLATE`
- **Constraint**: If a required variable has no value for a recipient, throw `Error(tErrors.cert.missingRequiredVariable(recipientId, variableName))`

_When_ a required variable is missing for a recipient, _the system shall_ throw `Error(tErrors.cert.missingRequiredVariable(recipientId, variableName))` and prevent generation for that recipient.

---

### REQ-04-09: Certificate Generation (Orchestration)

**The system shall** allow an actor with `CERTIFICATES_GENERATE` permission to generate certificates for an entire recipient group using a published template.

- **Input**: `{ templateId: string, recipientGroupId: string, idempotencyKey?: string }`
- **Output**: `CertificateBatchReturnType` — `{ certificates: CertificateReturnType[], skipped: Array<{ recipientGroupItemId: string, reason: string }> }`
- **Permission**: `AppPermission.CERTIFICATES_GENERATE`
- **Orchestration steps** (per recipient in the group):
  1. **Validate template is PUBLISHED** — reject if `DRAFT` or `ARCHIVED` (throw `Error(tErrors.cert.templateNotPublished)`)
  2. **Resolve recipient group** — load group and its items (students)
  3. **Resolve template variables per recipient** — via `RecipientGroupService.resolveVariables`
  4. **Derive idempotency key** — if `input.idempotencyKey` is not provided, compute `sha256(templateId:templateVersionId:recipientGroupId:studentId)`
  5. **Generate verification code** — cryptographically random, unique per certificate
  6. **Create certificate record** — `status: ISSUED`, `verificationCode`, `issueDate: now()`, `idempotencyKey`
  7. **Trigger PDF rendering** — delegate to `CertificateRendererService.renderPdf()` (defined in Plan 06); pass resolved variables + verification code + template layout
  8. **Link PDF file to certificate** — via `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId, usageType: "certificate_pdf", filePath })`
  9. **Invalidate cache** — `invalidateCertificateWrite(certificateId)`
  10. **Best-effort notification dispatch** — `NotificationEventType.CERTIFICATE_ISSUED` via `dispatchWithPreferences` (fire-and-forget in `.catch()`)
  11. **Audit log** — via `AuditService.createManyAuditLogs` (best-effort)

_When_ the template is not in `PUBLISHED` status, _the system shall_ throw `Error(tErrors.cert.templateNotPublished)` and not generate any certificates.

_When_ a duplicate `idempotencyKey` is encountered (DB unique constraint violation), _the system shall_ skip that specific recipient and include them in the `skipped` array with `reason: "already_generated"`.

_When_ the PDF rendering step fails for a recipient, _the system shall_ roll back the certificate record for that recipient, log the error via `logger.error`, and include them in the `skipped` array with `reason: "render_failed"`.

_When_ a required template variable is missing for a recipient, _the system shall_ include them in the `skipped` array with `reason: "missing_variable"` and not create a certificate record.

---

### REQ-04-10: Idempotency Key Derivation

**The system shall** derive a deterministic idempotency key from `(templateId, templateVersionId, recipientGroupId, studentId)` when the caller does not provide an explicit `idempotencyKey`.

- **Derivation**: `createHash("sha256").update([templateId, templateVersionId, recipientGroupId, studentId].join(":")).digest("hex")`
- **Persistence**: The key is stored on the `certificates.idempotencyKey` column, enforced by a unique index (Plan 03 creates the schema)
- **Duplicate behavior**: A duplicate insert hits the unique constraint; the service catches the Postgres 23505 error and normalizes to a localized `Error(tErrors.cert.duplicateCertificate)`

_When_ the caller provides an explicit `idempotencyKey`, _the system shall_ use it as-is without derivation.

_When_ the derived or provided key already exists in the database, _the system shall_ skip generation for that recipient (idempotent return).

---

### REQ-04-11: Certificate Revocation

**The system shall** allow an actor with `CERTIFICATES_REVOKE` permission to revoke an issued certificate.

- **Input**: `{ certificateId: string, revocationReason: string }`
- **Output**: `CertificateReturnType` with `status: REVOKED`, `revokedAt: Date`, `revocationReason: string`
- **Permission**: `AppPermission.CERTIFICATES_REVOKE`
- **Actions**:
  1. Validate certificate exists and is in `ISSUED` status (or `EXPIRED`)
  2. Set `status` to `REVOKED`
  3. Set `revokedAt` to `now()`
  4. Set `revocationReason` from input
  5. Invalidate cache via `invalidateCertificateWrite(certificateId)`
  6. Best-effort notification dispatch: `NotificationEventType.CERTIFICATE_REVOKED` via `dispatchWithPreferences`
  7. Audit log (best-effort)
- **Post-condition**: Revoked certificates are no longer verifiable as valid; verification returns `REVOKED` status

_When_ the certificate does not exist, _the system shall_ throw `NotFoundError("CERTIFICATE", tErrors.cert.certificateNotFound(certificateId))`.

_When_ the certificate is already `REVOKED`, _the system shall_ throw `Error(tErrors.cert.certificateAlreadyRevoked)`.

_When_ the `revocationReason` is empty or fewer than 5 characters, _the system shall_ throw `Error(tErrors.cert.invalidRevocationReason)`.

---

### REQ-04-12: Certificate Verification by Code

**The system shall** allow any actor (including unauthenticated/public users) to verify a certificate by its verification code.

- **Input**: `{ verificationCode: string }`
- **Output**: `CertificateVerificationResultReturnType` — `{ status: CertificateVerificationResult, certificate: CertificateReturnType | null }`
- **Permission**: None (public verification endpoint; resolver uses `{ loggedIn: true }` at minimum per Siraj pattern, or no auth scope for truly public access)
- **Lookup**: `CertificateRepository.findByVerificationCode(verificationCode)`
- **Status mapping**:
  | Certificate Status | Verification Result |
  |---|---|
  | `ISSUED` | `VALID` |
  | `EXPIRED` | `EXPIRED` |
  | `REVOKED` | `REVOKED` |
  | Not found | `NOT_FOUND` |
- **Side-effect**: Log the verification attempt (IP, timestamp, result) via `CertificateRepository.logVerificationAttempt`

_When_ the verification code does not match any certificate, _the system shall_ return `{ status: "NOT_FOUND", certificate: null }` and log the attempt.

_When_ the certificate status is `ISSUED`, _the system shall_ return `{ status: "VALID", certificate: <safe public fields> }` and log the attempt.

_When_ the certificate status is `REVOKED`, _the system shall_ return `{ status: "REVOKED", certificate: <safe public fields with revocationReason> }` and log the attempt.

---

### REQ-04-13: Verification Attempt Logging

**The system shall** log every verification attempt, recording the verification code queried, the result, the requester IP (if available), and the timestamp.

- **Side-effect**: `CertificateRepository.logVerificationAttempt({ verificationCode, result, ip, timestamp })`
- **Constraint**: This is a best-effort write; if logging fails, verification still returns the result to the user
- **Purpose**: Audit trail for fraud detection and analytics

---

### REQ-04-14: Certificate Listing (Paginated)

**The system shall** allow an actor with `CERTIFICATES_GENERATE` permission to list certificates with pagination, filtering, and sorting.

- **Input**: `{ page: number, pageSize: number, filters?: CertificateFilterArgs, sortBy?: string, sortOrder?: "asc" | "desc" }`
- **Output**: `{ items: CertificateReturnType[], total: number, page: number, pageSize: number }`
- **Permission**: `AppPermission.CERTIFICATES_GENERATE`
- **Filters**: `status`, `templateId`, `studentId`, `issueDateFrom`, `issueDateTo`
- **Batch support**: `getCertificatesContexts(certificateIds: string[]): Map<string, CertificateReturnType | null>` for DataLoader

---

### REQ-04-15: Certificate getById

**The system shall** allow an actor with `CERTIFICATES_GENERATE` permission to retrieve a single certificate by ID.

- **Input**: `{ certificateId: string }`
- **Output**: `CertificateReturnType`
- **Permission**: `AppPermission.CERTIFICATES_GENERATE`
- **Error**: `NotFoundError("CERTIFICATE", tErrors.cert.certificateNotFound(certificateId))` if not found

---

### REQ-04-16: Certificate Download URL Resolution

**The system shall** allow an actor with `CERTIFICATES_GENERATE` permission (or the certificate's recipient/student/parent) to request a download URL for the certificate's PDF file.

- **Input**: `{ certificateId: string }`
- **Output**: `{ downloadUrl: string, expiresAt: Date }`
- **Permission**: `AppPermission.CERTIFICATES_GENERATE` OR ownership via `StorageService.checkCertificateFileAccess(userId, certificateId, filePath)`
- **Cache**: Download URL cached via `cachedReadSingleFlight` with key `ec:cert:dl:${certificateId}`, TTL 300s (5 min), tags `[cert:${certificateId}]`
- **Invalidation**: `invalidateCertificateWrite(certificateId)` on revocation or re-render

_When_ the certificate file does not exist, _the system shall_ throw `NotFoundError("CERTIFICATE_FILE", tErrors.cert.certificateFileNotFound(certificateId))`.

---

### REQ-04-17: EntityCacheService Integration

**The system shall** cache certificate render results and template reads via `EntityCacheService.cachedReadSingleFlight` with identity-scoped keys and tag-based invalidation.

- **Cache keys**:
  - Render results: `ec:cert:render:${templateVersionId}:${recipientGroupId}` — TTL 3600s (1h)
  - Certificate download URL: `ec:cert:dl:${certificateId}` — TTL 300s (5 min)
- **Cache tags**:
  - `cert:render` — all render results
  - `cert:tmpl:${templateId}` — per-template (invalidated on template publish/archive)
  - `cert:${certificateId}` — per-certificate (invalidated on revoke/re-render)
- **Named invalidation helpers** (in `backend/services/certificates/cache-helpers.ts`):
  - `invalidateCertificateTemplateWrite(templateId)` — invalidates `cert:tmpl:${templateId}` tag
  - `invalidateCertificateWrite(certificateId)` — invalidates `cert:${certificateId}` tag
- **Fail-open contract**: All cache reads and invalidations wrap provider errors in `try/catch` and fall through to the underlying data source
- **Permission gate before cache**: Authorization checks must execute *before* `cachedRead`/`cachedReadSingleFlight` lookups

_When_ the cache provider is unavailable or errors, _the system shall_ fall through to the database loader and not throw.

---

### REQ-04-18: Localized Error Messages

**The system shall** use `getServerTranslations(locale, "cert")` from `@/shared/locale/server-graphql` for all user-facing error messages in service-layer functions.

- **Pattern**: Service functions accept `tErrors: ErrorsLabels` and `locale?: string` as explicit parameters
- **Translation keys** (to be added to `shared/locale/messages/{ar,en}/errors.cert.ts`):
  - `cert.templateNotFound(templateId)` → "Template not found: {templateId}"
  - `cert.templateNameInvalid` → "Template name must be between 3 and 255 characters"
  - `cert.templateNotEditable` → "Only draft templates can be edited"
  - `cert.templateNotPublished` → "Template must be published before generating certificates"
  - `cert.templateArchived` → "Template is archived and cannot be used"
  - `cert.templateMissingVariables` → "Template has no defined variables"
  - `cert.recipientGroupNameInvalid` → "Recipient group name must be between 3 and 255 characters"
  - `cert.recipientGroupNotFound(recipientGroupId)` → "Recipient group not found: {recipientGroupId}"
  - `cert.recipientGroupHasStudents` → "Cannot delete a recipient group that has students"
  - `cert.certificateNotFound(certificateId)` → "Certificate not found: {certificateId}"
  - `cert.certificateAlreadyRevoked` → "Certificate is already revoked"
  - `cert.invalidRevocationReason` → "Revocation reason must be at least 5 characters"
  - `cert.certificateFileNotFound(certificateId)` → "Certificate file not found: {certificateId}"
  - `cert.duplicateCertificate` → "A certificate with these parameters already exists"
  - `cert.missingRequiredVariable(recipientId, variableName)` → "Required variable '{variableName}' is missing for recipient {recipientId}"
  - `cert.invalidLayoutConfig` → "Invalid layout configuration"
- **Hardcoded strings are FORBIDDEN** — every error must use `tErrors.cert.*` keys

---

### REQ-04-19: Permission Gating

**The system shall** gate all certificate operations via `PermissionsService.hasPermission` or `PermissionsService.hasAnyPermission` using the following permission keys (defined in Plan 01 enum):

| Permission Key | Operations Gated |
|---|---|
| `AppPermission.CERTIFICATES_GENERATE` | Generate certificates, list certificates, get certificate by ID |
| `AppPermission.CERTIFICATES_REVOKE` | Revoke certificate |
| `AppPermission.CERTIFICATES_MANAGE_TEMPLATE` | Create/edit/publish/archive templates, manage recipient groups, assign students, resolve variables |

- **Super admin**: Automatically allowed by the `authScopes.permission` callback (`ctx.isSuperAdmin || ctx.permissions.includes(key)`)
- **Pattern**: `requirePermission(actorUserId, AppPermission.X, tErrors)` helper in each service file (mirrors `billing-management.service.ts:43-48`)

_When_ an actor lacks the required permission, _the system shall_ throw `Error(tErrors.insufficientPermissions)`.

---

### REQ-04-20: Batch Service Methods for DataLoader

**The system shall** expose batch versions of single-entity lookup methods to support Pothos DataLoader batching from GraphQL field resolvers.

- **`CertificateManagementService.getCertificatesContexts(certificateIds: string[]): Promise<Map<string, CertificateReturnType | null>>`** — batch lookup by IDs
- **`RecipientGroupService.resolveRecipientGroupIdsForTemplates(templateIds: string[]): Promise<Map<string, RecipientGroupReturnType[] | null>>`** — batch resolve groups per template
- **Naming convention**: `resolve{Entity}IdsForUsers` / `get{Entity}Contexts` per `backend/services/AGENTS.md`
- **Return type**: Always `Map<string, T | null>` — null for missing entities

_When_ a batch lookup encounters a missing ID, _the system shall_ return `null` for that key in the Map rather than throwing.

---

### REQ-04-21: Notification Side-Effects

**The system shall** dispatch notifications as best-effort fire-and-forget side-effects after successful certificate generation and revocation.

- **Generation**: `NotificationEventType.CERTIFICATE_ISSUED` — dispatched to the student/parent via `dispatchWithPreferences`
  - Payloads built via `buildCertificateIssuedPayloads(certificateId, studentId, targetUserIds, locale)` (notification-payloads.builders.ts addendum)
  - Wrapped in `.catch(e => logger.error("cert issued notification failed", e))`
- **Revocation**: `NotificationEventType.CERTIFICATE_REVOKED` — dispatched to the student/parent
  - Payloads built via `buildCertificateRevokedPayloads(certificateId, studentId, revocationReason, targetUserIds, locale)`
  - Wrapped in `.catch(e => logger.error("cert revoked notification failed", e))`
- **Constraint**: Notification failures must NOT roll back the main write operation
- **New notification event types** (added to `NotificationEventType` enum in Plan 01): `CERTIFICATE_ISSUED`, `CERTIFICATE_REVOKED`

_When_ the notification dispatch fails, _the system shall_ log the error and continue; the certificate record remains valid.

---

### REQ-04-22: Audit Side-Effects

**The system shall** write audit logs for template publishing, template archiving, certificate generation, and certificate revocation via `AuditService.createManyAuditLogs`.

- **Template publish**: Audit `{ action: "TEMPLATE_PUBLISHED", entityId: templateId, actorUserId, details: { versionId } }`
- **Template archive**: Audit `{ action: "TEMPLATE_ARCHIVED", entityId: templateId, actorUserId, details: { reason } }`
- **Certificate generation**: Audit `{ action: "CERTIFICATE_GENERATED", entityId: certificateId, actorUserId, details: { templateId, recipientGroupId } }`
- **Certificate revocation**: Audit `{ action: "CERTIFICATE_REVOKED", entityId: certificateId, actorUserId, details: { revocationReason } }`
- **Constraint**: Audit log writes are best-effort (wrapped in `try/catch`); failures are logged but do not roll back

---

### REQ-04-23: Feature 6 — Outcome Knowledge Base & Progress Tracking

**The system shall** track implementation outcomes and propagate knowledge to future agents and documentation.

- **Outcome directory**: `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/`
- **Per-task outcome files**: Each completed task must produce `<task-id>-outcome.md` documenting:
  - Research findings and pattern references
  - Implementation decisions and rationale
  - Pitfalls encountered and resolutions
  - Carry-over points for subsequent tasks
- **Knowledge propagation**: Task 8 updates `backend/services/AGENTS.md` with certificate service patterns and `docs/services/entity-cache-service.md` with certificate cache key patterns
- **Feature knowledge**: The services established here serve as the reference for how all future certificate-related services should be structured (namespace pattern, permission gating, idempotency, cache, notification/audit side-effects)

---

### REQ-04-24: Service Function Signature Compliance

**The system shall** follow the canonical service function signature pattern for all public service methods.

- **Signature**: `async function methodName(actorUserId: string, input: InputType, tErrors: ErrorsLabels, locale?: string): Promise<ReturnType>`
- **Parameters**:
  - `actorUserId: string` — the authenticated user performing the action
  - `input: <Entity>SubmitInput` — typed input from `backend/types/`
  - `tErrors: ErrorsLabels` — localized error translations (from `ctx.t().errorsTranslations` in resolvers, or `getServerTranslations(locale)` in SSR)
  - `locale?: string` — optional locale override (defaults to `"ar"`)
- **Return types**: Always `Promise<T>` where `T` is from `backend/types/cert/*.types.ts`
- **Constraint**: Services must never read GraphQL context (`ctx`); they receive everything as explicit parameters (SSR-safe)

_When_ a service function needs locale-bound strings for notification payloads, _the system shall_ pass `locale` to `dispatchWithPreferences` and payload builders, defaulting to `"ar"`.

---

## Non-Functional Requirements

### NFR-04-01: SSR Safety
All service functions must be callable from Next.js Server Components and Server Actions without a GraphQL context. No service function may import from `@/backend/graphql/` or depend on `ctx`.

### NFR-04-02: No GraphQLError in Services
Services must throw `Error(tErrors.cert.*)`, `NotFoundError(entity, message)`, `ForbiddenError(message)`, or `ValidationError(code, message)`. Never `GraphQLError`. The GraphQL route layer translates these to GraphQL errors.

### NFR-04-03: Type Imports from backend/types/
All service function signatures must use types from `@/backend/types` (e.g., `CertificateReturnType`, `TemplateReturnType`, `GenerateCertificateInput`). Never create ad-hoc local type definitions.

### NFR-04-04: Fail-Open Cache
All cache reads and invalidations must wrap provider errors in `try/catch` and fall through to the database. A cache outage must never crash a user request.

### NFR-04-05: Permission Before Cache
Authorization checks must execute *before* any `cachedRead` or `cachedReadSingleFlight` lookup. Unauthorized users must never receive cached payloads.

---

## Acceptance Criteria

1. All five service namespaces exist as `export namespace X { ... }` in `backend/services/certificates/`
2. Every public method follows the `(actorUserId, input, tErrors, locale?)` signature
3. All error messages use `tErrors.cert.*` keys (no hardcoded strings)
4. Permission gating via `PermissionsService.hasPermission` before any data access
5. Certificate generation validates `PUBLISHED` template status before proceeding
6. Idempotency key derivation via `sha256(templateId:templateVersionId:recipientGroupId:studentId)` when not provided
7. Revocation sets `status=REVOKED`, `revokedAt`, `revocationReason`, and invalidates cache
8. Verification maps `ISSUED→VALID`, `EXPIRED→EXPIRED`, `REVOKED→REVOKED`, not-found→`NOT_FOUND`
9. Batch methods return `Map<string, T | null>` for DataLoader support
10. No `GraphQLError` thrown from any service function
11. All cache operations are fail-open
12. Notification and audit side-effects are fire-and-forget (best-effort)
13. Barrel `index.ts` re-exports all services and is registered in `backend/services/index.ts`
