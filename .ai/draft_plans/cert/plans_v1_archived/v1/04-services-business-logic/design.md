# Plan 04 — Services & Business Logic: Technical Design

## Document Information

- **Feature Name**: Certificate Generation & Verification — Service Layer
- **Plan Number**: 04 (Services & Business Logic)
- **Version**: 1.0
- **Date**: 2026-08-01
- **Related Documents**:
  - [Requirements](./requirements.md)
  - [Tasks](./tasks.md)
- **Depends On**: Plan 03 (Repository Layer) — all repo interfaces, types, enums
- **Depended On By**: Plan 05 (GraphQL API), Plan 06 (PDF Rendering Engine)
- **Outcome Directory**: `.ai/draft_plans/cert/plans/04-services-business-logic/outcome/`

---

## Pre-Implementation Checklist

Before writing any service code, verify the following:

- [ ] **Plan 03 complete**: All repository interfaces, types, and enums defined
  - `backend/db/repo/certificate.repo.ts` — `CertificateRepository` namespace
  - `backend/db/repo/template.repo.ts` — `TemplateRepository` namespace
  - `backend/db/repo/recipient-group.repo.ts` — `RecipientGroupRepository` namespace
  - `backend/db/repo/template-version.repo.ts` — `TemplateVersionRepository` namespace
  - `backend/db/repo/certificate-verification-attempt.repo.ts` — `CertificateVerificationAttemptRepository` namespace
- [ ] **Plan 01 enums**: `AppPermission.CERTIFICATES_GENERATE`, `CERTIFICATES_REVOKE`, `CERTIFICATES_MANAGE_TEMPLATE` added to `backend/enum/permissions.ts`
- [ ] **Plan 01 notification enums**: `NotificationEventType.CERTIFICATE_ISSUED`, `CERTIFICATE_REVOKED` added to `backend/enum/notification.ts`
- [ ] **Plan 01 status enums**: `CertTemplateStatus` (`DRAFT`, `PUBLISHED`, `ARCHIVED`), `CertificateStatus` (`ISSUED`, `EXPIRED`, `REVOKED`), `CertificateVerificationResult` (`VALID`, `EXPIRED`, `REVOKED`, `NOT_FOUND`)
- [ ] **Translation keys**: `shared/locale/messages/{ar,en}/errors.cert.ts` with all keys listed in REQ-04-18
- [ ] **Types**: `backend/types/certificate.types.ts`, `backend/types/template.types.ts`, `backend/types/recipient-group.types.ts` define all `*ReturnType`, `*SubmitInput`, `*SelectType` types
- [ ] **EntityCacheService**: `backend/services/cache/EntityCacheService.ts` exposes `cachedReadSingleFlight<T>(key, ttl, loader, tags)` and `invalidate(tagPrefix)`

---

## UX/Navigation Specification

> **Note**: This plan is **service-layer only**. No UI components or routes are created in Plan 04. The following notes describe what the consuming layers (Plan 05 GraphQL, Plan 07+ UI) will build on top of these services.

### Service-Exposed Navigation Surfaces

| Service Method | Consumed By | Navigation Impact |
|---|---|---|
| `TemplateManagementService.create` | Admin template creation page | Redirect to `/[locale]/admin/certificates/templates/[templateId]/edit` after creation |
| `TemplateManagementService.publish` | Template edit page | Navigate from edit view to version list view on publish |
| `CertificateGenerationService.generateCertificate` | Admin generation page | Redirect to certificate list filtered by `recipientGroupId` after generation |
| `CertificateVerificationService.verifyCertificate` | Public verification page `/[locale]/certificates/verify` | Display verification result card (VALID/EXPIRED/REVOKED/NOT_FOUND), no auth required |
| `CertificateManagementService.revoke` | Certificate detail page | Confirmation dialog → status badge updates to `REVOKED` |

### Public Verification Endpoint

The verification service supports a **public** verification page accessible without authentication:

- **URL**: `/[locale]/certificates/verify?code=<verificationCode>`
- **Auth**: No authentication required (service does not gate `verifyCertificate` with permissions)
- **SSR**: Server Component calls `CertificateVerificationService.verifyCertificate` directly

### Admin Certificate Dashboard

- **URL**: `/[locale]/admin/certificates`
- **Auth**: Requires `CERTIFICATES_GENERATE` permission
- **Server Component**: Calls `CertificateManagementService.listCertificates(actorUserId, { page, pageSize }, tErrors, locale)` directly (not via GraphQL)

---

## Outcome & Knowledge Transfer Protocol

This plan implements structured knowledge transfer to ensure implementation decisions and discoveries persist beyond the current task execution.

### Outcome Directory Structure

```
.ai/draft_plans/cert/plans/04-services-business-logic/outcome/
├── 01-template-management-outcome.md
├── 02-recipient-group-outcome.md
├── 03-certificate-management-outcome.md
├── 04-certificate-generation-outcome.md
├── 05-certificate-verification-outcome.md
├── 06-barrel-registration-outcome.md
├── 07-quality-loop-outcome.md
└── 08-knowledge-propagation-outcome.md
```

### Per-Task Outcome File Template

Each task produces an outcome file with the following sections:

```markdown
# Task <NN> — <Task Name>: Outcome

## Research Findings
- Patterns discovered in existing codebase
- Files referenced and their relevance

## Implementation Decisions
- Key design choices and rationale
- Alternative approaches considered

## Pitfalls & Resolutions
- Issues encountered and how they were resolved
- Workarounds applied

## Carry-Over Points
- Points relevant to subsequent tasks
- Dependencies on other plans
- Items deferred to Plan 05/06
```

### Knowledge Propagation Targets

| Target File | Update Type | Content |
|---|---|---|
| `backend/services/AGENTS.md` | Add certificate section | Certificate service namespace patterns, cache key conventions, idempotency key format |
| `docs/services/entity-cache-service.md` | Add certificate examples | Certificate cache keys (`ec:cert:render:*`, `ec:cert:dl:*`), tags (`cert:render`, `cert:tmpl:*`, `cert:*`), invalidation helpers |
| `backend/types/AGENTS.md` | Add certificate type conventions | Naming patterns for `CertificateReturnType`, `TemplateReturnType`, etc. |

---

## Technical Design

### 1. Service File Layout

All service files live in `backend/services/certificates/`:

```
backend/services/certificates/
├── template-management.service.ts      # TemplateManagementService namespace
├── recipient-group.service.ts          # RecipientGroupService namespace
├── certificate-management.service.ts   # CertificateManagementService namespace
├── certificate-generation.service.ts   # CertificateGenerationService namespace
├── certificate-verification.service.ts # CertificateVerificationService namespace
├── cache-helpers.ts                    # Certificate-specific cache helpers
├── notification-payloads.builders.ts   # Certificate notification payload builders
└── index.ts                             # Barrel re-exporting all services
```

### 2. TemplateManagementService (`template-management.service.ts`)

#### 2.1 Namespace Structure

```typescript
export namespace TemplateManagementService {
  export async function create(
    actorUserId: string,
    input: TemplateSubmitInput,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<TemplateReturnType>;

  export async function update(
    actorUserId: string,
    input: TemplateUpdateInput,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<TemplateReturnType>;

  export async function publish(
    actorUserId: string,
    input: { templateId: string; changelog?: string },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<TemplateReturnType>;

  export async function archive(
    actorUserId: string,
    input: { templateId: string; reason?: string },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<TemplateReturnType>;

  export async function getById(
    actorUserId: string,
    input: { templateId: string },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<TemplateReturnType>;

  export async function listVersions(
    actorUserId: string,
    input: { templateId: string },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<TemplateVersionReturnType[]>;
}
```

#### 2.2 Create Flow

```
1. requirePermission(actorUserId, AppPermission.CERTIFICATES_MANAGE_TEMPLATE, tErrors)
2. Validate input.name length (3-255) → throw Error(tErrors.cert.templateNameInvalid)
3. Validate input.layoutConfig is non-null object → throw Error(tErrors.cert.invalidLayoutConfig)
4. TemplateRepository.createTemplate({ ...input, status: DRAFT, version: 1 })
5. AuditService.createManyAuditLogs([{ action: "TEMPLATE_CREATED", entityId: template.id, actorUserId }])
6. return TemplateReturnType
```

#### 2.3 Publish Flow (Status Transition + Version Snapshot)

```
1. requirePermission(actorUserId, AppPermission.CERTIFICATES_MANAGE_TEMPLATE, tErrors)
2. template = TemplateRepository.getById(input.templateId)
3. if (!template) throw NotFoundError("TEMPLATE", tErrors.cert.templateNotFound(input.templateId))
4. if (template.status === ARCHIVED) throw Error(tErrors.cert.templateArchived)
5. if (template.status !== DRAFT) throw Error(tErrors.cert.templateNotEditable)
6. if (template.variables.length === 0) throw Error(tErrors.cert.templateMissingVariables)
7. version = TemplateVersionRepository.create({
     templateId: template.id,
     versionNumber: template.version,
     layoutConfig: template.layoutConfig,
     variables: template.variables,
     changelog: input.changelog,
   })
8. updatedTemplate = TemplateRepository.updateStatus(template.id, PUBLISHED)
9. invalidateCertificateTemplateWrite(template.id) // cache invalidation
10. AuditService.createManyAuditLogs([{ action: "TEMPLATE_PUBLISHED", entityId: template.id, actorUserId, details: { versionId: version.id } }])
11. return updatedTemplate
```

#### 2.4 Archive Flow

```
1. requirePermission(actorUserId, AppPermission.CERTIFICATES_MANAGE_TEMPLATE, tErrors)
2. template = TemplateRepository.getById(input.templateId)
3. if (!template) throw NotFoundError("TEMPLATE", tErrors.cert.templateNotFound(input.templateId))
4. if (template.status !== PUBLISHED) throw Error(tErrors.cert.templateNotPublished)
5. updatedTemplate = TemplateRepository.updateStatus(template.id, ARCHIVED)
6. invalidateCertificateTemplateWrite(template.id)
7. AuditService.createManyAuditLogs([{ action: "TEMPLATE_ARCHIVED", ... }])
8. return updatedTemplate
```

### 3. RecipientGroupService (`recipient-group.service.ts`)

#### 3.1 Namespace Structure

```typescript
export namespace RecipientGroupService {
  export async function create(
    actorUserId: string,
    input: RecipientGroupSubmitInput,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<RecipientGroupReturnType>;

  export async function getById(
    actorUserId: string,
    input: { recipientGroupId: string },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<RecipientGroupReturnType>;

  export async function assignStudents(
    actorUserId: string,
    input: { recipientGroupId: string; studentIds: string[] },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<{ assignedCount: number; skipped: Array<{ studentId: string; reason: string }> }>;

  export async function resolveVariables(
    actorUserId: string,
    input: { recipientGroupId: string; templateVersionId: string },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<Map<string, Record<string, string>>>;

  // Batch method for DataLoader
  export async function resolveRecipientGroupIdsForTemplates(
    templateIds: string[]
  ): Promise<Map<string, RecipientGroupReturnType[] | null>>;
}
```

#### 3.2 assignStudents Flow

```
1. requirePermission(actorUserId, AppPermission.CERTIFICATES_MANAGE_TEMPLATE, tErrors)
2. group = RecipientGroupRepository.getById(input.recipientGroupId)
3. if (!group) throw NotFoundError("RECIPIENT_GROUP", tErrors.cert.recipientGroupNotFound(input.recipientGroupId))
4. existingStudents = RecipientGroupRepository.getStudentIds(input.recipientGroupId)
5. newStudents = input.studentIds.filter(id => !existingStudents.includes(id))
6. skipped = input.studentIds.filter(id => existingStudents.includes(id))
   .map(id => ({ studentId: id, reason: "already_assigned" }))
7. RecipientGroupRepository.bulkAddStudents(input.recipientGroupId, newStudents)
8. AuditService.createManyAuditLogs([{ action: "STUDENTS_ASSIGNED", entityId: input.recipientGroupId, actorUserId, details: { count: newStudents.length } }])
9. return { assignedCount: newStudents.length, skipped }
```

#### 3.3 resolveVariables Flow

```
1. requirePermission(actorUserId, AppPermission.CERTIFICATES_MANAGE_TEMPLATE, tErrors)
2. templateVersion = TemplateVersionRepository.getById(input.templateVersionId)
3. if (!templateVersion) throw NotFoundError("TEMPLATE_VERSION", tErrors.cert.templateVersionNotFound)
4. recipientGroupItems = RecipientGroupRepository.getGroupItems(input.recipientGroupId)
5. variableDefinitions = templateVersion.variables
6. result = new Map<string, Record<string, string>>()
7. for each item in recipientGroupItems:
  a. studentData = StudentRepository.getById(item.studentId)
  b. resolvedVars: Record<string, string> = {}
  c. for each varDef in variableDefinitions:
    - if varDef.sourceType === STUDENT:
      resolvedVars[varDef.key] = mapStudentField(studentData, varDef.sourceField)
    - if varDef.sourceType === VARIABLE:
      customValue = RecipientGroupRepository.getItemVariableValue(item.id, varDef.id)
      if (customValue == null && varDef.required):
        throw Error(tErrors.cert.missingRequiredVariable(item.studentId, varDef.key))
      resolvedVars[varDef.key] = customValue ?? varDef.defaultValue ?? ""
    - if varDef.sourceType === CERTIFICATE:
      resolvedVars[varDef.key] = "" // resolved at generation time
  d. result.set(item.studentId, resolvedVars)
8. return result
```

**Student field mapping** (`mapStudentField` helper):

| `sourceField` | Student Attribute | Format |
|---|---|---|
| `name` | `student.name` (Arabic full name) | As-is |
| `email` | `student.email` | As-is |
| `dateOfBirth` | `student.dateOfBirth` | ISO date string |
| `grade` | `student.grade` (from enrollment) | As-is |
| `enrollmentDate` | `student.enrollmentDate` | ISO date string |

### 4. CertificateManagementService (`certificate-management.service.ts`)

#### 4.1 Namespace Structure

```typescript
export namespace CertificateManagementService {
  export async function listCertificates(
    actorUserId: string,
    input: CertificateListInput,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<{ items: CertificateReturnType[]; total: number; page: number; pageSize: number }>;

  export async function getById(
    actorUserId: string,
    input: { certificateId: string },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<CertificateReturnType>;

  export async function revoke(
    actorUserId: string,
    input: { certificateId: string; revocationReason: string },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<CertificateReturnType>;

  export async function getDownloadUrl(
    actorUserId: string,
    input: { certificateId: string },
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<{ downloadUrl: string; expiresAt: Date }>;

  // Batch method for DataLoader
  export async function getCertificatesContexts(
    certificateIds: string[]
  ): Promise<Map<string, CertificateReturnType | null>>;
}
```

#### 4.2 Revoke Flow

```
1. requirePermission(actorUserId, AppPermission.CERTIFICATES_REVOKE, tErrors)
2. Validate revocationReason length >= 5 → throw Error(tErrors.cert.invalidRevocationReason)
3. certificate = CertificateRepository.getById(input.certificateId)
4. if (!certificate) throw NotFoundError("CERTIFICATE", tErrors.cert.certificateNotFound(input.certificateId))
5. if (certificate.status === REVOKED) throw Error(tErrors.cert.certificateAlreadyRevoked)
6. CertificateRepository.update(input.certificateId, {
     status: REVOKED,
     revokedAt: new Date(),
     revocationReason: input.revocationReason,
   })
7. invalidateCertificateWrite(input.certificateId)
8. // Best-effort notification
   try {
     const payloads = buildCertificateRevokedPayloads(certificate.id, certificate.studentId, [certificate.studentId], locale)
     await dispatchWithPreferences(payloads, [certificate.studentId], locale)
       .catch(e => logger.error("cert revoked notification failed", e))
   } catch (e) { logger.error("cert revoked notification payload build failed", e) }
9. // Best-effort audit
   try {
     await AuditService.createManyAuditLogs([{ action: "CERTIFICATE_REVOKED", entityId: input.certificateId, actorUserId, details: { revocationReason: input.revocationReason } }])
   } catch (e) { logger.error("cert revoked audit log failed", e) }
10. return updatedCertificate
```

#### 4.3 getDownloadUrl Flow (Cached)

```
1. requirePermission(actorUserId, AppPermission.CERTIFICATES_GENERATE, tErrors)
2. certificate = CertificateRepository.getById(input.certificateId)
3. if (!certificate) throw NotFoundError("CERTIFICATE", tErrors.cert.certificateNotFound(input.certificateId))
4. if (!certificate.filePath) throw NotFoundError("CERTIFICATE_FILE", tErrors.cert.certificateFileNotFound(input.certificateId))
5. cacheKey = `ec:cert:dl:${input.certificateId}`
6. result = await cachedReadSingleFlight(
     cacheKey,
     300, // 5 min TTL
     async () => {
       const url = await StorageService.generateSignedDownloadUrl(certificate.filePath!, 300)
       return { downloadUrl: url, expiresAt: new Date(Date.now() + 300_000) }
     },
     [`cert:${input.certificateId}`]
   )
7. return result
```

#### 4.4 Batch Methods

```typescript
// getCertificatesContexts — for DataLoader
export async function getCertificatesContexts(
  certificateIds: string[]
): Promise<Map<string, CertificateReturnType | null>> {
  const certificates = await CertificateRepository.loadByIds(certificateIds)
  const map = new Map<string, CertificateReturnType | null>()
  for (const id of certificateIds) {
    const cert = certificates.find(c => c.id === id)
    map.set(id, cert ? mapCertificateToReturnType(cert) : null)
  }
  return map
}
```

> **Note**: Batch methods do NOT take `actorUserId` or `tErrors` — they are pure data access functions called from DataLoader field resolvers. Authorization is handled at the resolver level.

### 5. CertificateGenerationService (`certificate-generation.service.ts`)

#### 5.1 Namespace Structure

```typescript
export namespace CertificateGenerationService {
  export async function generateCertificate(
    actorUserId: string,
    input: GenerateCertificateInput,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<CertificateBatchReturnType>;
}
```

#### 5.2 generateCertificate Orchestration

```
1. requirePermission(actorUserId, AppPermission.CERTIFICATES_GENERATE, tErrors)

2. // Validate template
   template = TemplateRepository.getById(input.templateId)
   if (!template) throw NotFoundError("TEMPLATE", tErrors.cert.templateNotFound(input.templateId))
   if (template.status !== PUBLISHED) throw Error(tErrors.cert.templateNotPublished)

3. // Get latest published version
   templateVersion = TemplateVersionRepository.getLatestByTemplateId(input.templateId)
   if (!templateVersion) throw Error(tErrors.cert.templateNotPublished)

4. // Resolve recipient group
   recipientGroup = RecipientGroupRepository.getById(input.recipientGroupId)
   if (!recipientGroup) throw NotFoundError("RECIPIENT_GROUP", tErrors.cert.recipientGroupNotFound(input.recipientGroupId))

5. // Resolve template variables per recipient
   resolvedVariables = await RecipientGroupService.resolveVariables(
     actorUserId,
     { recipientGroupId: input.recipientGroupId, templateVersionId: templateVersion.id },
     tErrors,
     locale
   )
   // Note: This may throw Error(tErrors.cert.missingRequiredVariable) for missing vars
   // — caught and added to skipped array per-recipient

6. // Get recipient group items (student list)
   groupItems = RecipientGroupRepository.getGroupItems(input.recipientGroupId)

7. certificates: CertificateReturnType[] = []
   skipped: Array<{ recipientGroupItemId: string; reason: string }> = []

8. for each item in groupItems:
   a. studentVariables = resolvedVariables.get(item.studentId)
   b. if (!studentVariables):
     skipped.push({ recipientGroupItemId: item.id, reason: "missing_variable" })
     continue

   c. // Derive idempotency key
     idempotencyKey = input.idempotencyKey
       ? `${input.idempotencyKey}:${item.studentId}`
       : deriveCertificateIdempotencyKey({
           templateId: input.templateId,
           templateVersionId: templateVersion.id,
           recipientGroupId: input.recipientGroupId,
           studentId: item.studentId,
         })

   d. // Generate verification code
     verificationCode = generateVerificationCode()

   e. // Create certificate record
     try {
       certificate = await CertificateRepository.create({
         templateId: input.templateId,
         templateVersionId: templateVersion.id,
         recipientGroupId: input.recipientGroupId,
         studentId: item.studentId,
         status: CertificateStatus.ISSUED,
         issueDate: new Date(),
         verificationCode,
         idempotencyKey,
       })
     } catch (e) {
       if (isDuplicateKeyError(e)) {
         skipped.push({ recipientGroupItemId: item.id, reason: "already_generated" })
         continue
       }
       throw e
     }

   f. // Trigger PDF rendering (delegated to Plan 06)
     try {
       const renderedPdf = await CertificateRendererService.renderPdf({
         templateVersionId: templateVersion.id,
         certificateId: certificate.id,
         variables: studentVariables,
         verificationCode,
       })
       // Link PDF file
       await CertificateRepository.update(certificate.id, { filePath: renderedPdf.filePath })
     } catch (e) {
       logger.error("PDF render failed for certificate", certificate.id, e)
       // Roll back certificate record
       await CertificateRepository.delete(certificate.id)
       skipped.push({ recipientGroupItemId: item.id, reason: "render_failed" })
       continue
     }

   g. // Invalidate cache
     invalidateCertificateWrite(certificate.id)

   h. // Best-effort notification
     try {
       const payloads = buildCertificateIssuedPayloads(
         certificate.id,
         item.studentId,
         [item.studentId],
         locale
       )
       await dispatchWithPreferences(payloads, [item.studentId], locale)
         .catch(e => logger.error("cert issued notification failed", e))
     } catch (e) { logger.error("cert issued notification payload build failed", e) }

   i. // Best-effort audit
     try {
       await AuditService.createManyAuditLogs([{
         action: "CERTIFICATE_GENERATED",
         entityId: certificate.id,
         actorUserId,
         details: { templateId: input.templateId, recipientGroupId: input.recipientGroupId }
       }])
     } catch (e) { logger.error("cert generated audit log failed", e) }

   j. certificates.push(certificate)

9. return { certificates, skipped }
```

#### 5.3 Idempotency Key Derivation Helper

```typescript
import { createHash } from "node:crypto";

function deriveCertificateIdempotencyKey(parts: {
  templateId: string;
  templateVersionId: string;
  recipientGroupId: string;
  studentId: string;
}): string {
  return createHash("sha256")
    .update([
      parts.templateId,
      parts.templateVersionId,
      parts.recipientGroupId,
      parts.studentId,
    ].join(":"))
    .digest("hex");
}
```

#### 5.4 Verification Code Generator

```typescript
import { randomBytes } from "node:crypto";

function generateVerificationCode(): string {
  // 12-character alphanumeric code, uppercase, no ambiguous characters
  const bytes = randomBytes(9); // 72 bits → 12 base32 chars
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}
```

#### 5.5 Interaction with Plan 06 (PDF Rendering)

The generation service calls `CertificateRendererService.renderPdf()` which is **defined in Plan 06**. During Plan 04 development, this function may not yet exist. The service file should:

1. Import from `@/backend/services/certificates/renderer` (or wherever Plan 06 places it)
2. Anticipate the interface: `renderPdf(input: { templateVersionId: string, certificateId: string, variables: Record<string, string>, verificationCode: string }): Promise<{ filePath: string }>`
3. If Plan 06 is not yet implemented, the service's try/catch handler rolls back the certificate record on any error (including import failure)

> **Integration contract**: Plan 06 must-export `CertificateRendererService.renderPdf` with the exact interface above.

### 6. CertificateVerificationService (`certificate-verification.service.ts`)

#### 6.1 Namespace Structure

```typescript
export namespace CertificateVerificationService {
  export async function verifyCertificate(
    actorUserId: string | null, // null for public verification
    input: { verificationCode: string },
    tErrors: ErrorsLabels,
    locale?: string,
    requestIp?: string
  ): Promise<CertificateVerificationResultReturnType>;

  // No permission gating — public endpoint
  export async function logVerification(
    input: { verificationCode: string; result: string; ip?: string }
  ): Promise<void>;
}
```

#### 6.2 verifyCertificate Flow

```
1. // No permission check — public endpoint
2. certificate = await CertificateRepository.findByVerificationCode(input.verificationCode)
3. if (!certificate):
   result = { status: CertificateVerificationResult.NOT_FOUND, certificate: null }
   await logVerification({ verificationCode: input.verificationCode, result: "NOT_FOUND", ip: requestIp })
   return result

4. let status: CertificateVerificationResult
   switch (certificate.status):
     case ISSUED:  status = VALID
     case EXPIRED: status = EXPIRED
     case REVOKED: status = REVOKED
     default:      status = NOT_FOUND

5. // Log attempt (best-effort)
   await logVerification({ verificationCode: input.verificationCode, result: status, ip: requestIp })

6. // Return public-safe fields only
   return {
     status,
     certificate: {
       id: certificate.id,
       templateName: certificate.templateName,
       studentName: certificate.studentName,
       issueDate: certificate.issueDate,
       revocationReason: certificate.revocationReason, // only if REVOKED
       // Do NOT expose: studentId, recipientGroupId, filePath, internal metadata
     }
   }
```

#### 6.3 logVerification Flow

```typescript
export async function logVerification(
  input: { verificationCode: string; result: string; ip?: string }
): Promise<void> {
  try {
    await CertificateVerificationAttemptRepository.create({
      verificationCode: input.verificationCode,
      result: input.result,
      ip: input.ip ?? null,
      timestamp: new Date(),
    });
  } catch (e) {
    // Best-effort — verification result is still returned to user
    logger.error("Failed to log certificate verification attempt", e);
  }
}
```

### 7. Cache Helpers (`cache-helpers.ts`)

```typescript
import { EntityCacheService } from "@/backend/services/cache/EntityCacheService";
import { logger } from "@/backend/lib/logger";

const CACHE_VERSION = 1;

// Tag names
const CERT_RENDER_TAG = "cert:render";
const certTemplateTag = (templateId: string) => `cert:tmpl:${templateId}`;
const certTag = (certificateId: string) => `cert:${certificateId}`;

// Key builders
export const certRenderCacheKey = (templateVersionId: string, recipientGroupId: string) =>
  `ec:${CACHE_VERSION}:cert:render:${templateVersionId}:${recipientGroupId}`;

export const certDownloadCacheKey = (certificateId: string) =>
  `ec:${CACHE_VERSION}:cert:dl:${certificateId}`;

// Invalidation helpers (fail-open)
export async function invalidateCertificateTemplateWrite(templateId: string): Promise<void> {
  try {
    await EntityCacheService.invalidateByTag(certTemplateTag(templateId));
  } catch (e) {
    logger.error("Failed to invalidate certificate template cache", { templateId, error: e });
  }
}

export async function invalidateCertificateWrite(certificateId: string): Promise<void> {
  try {
    await EntityCacheService.invalidateByTag(certTag(certificateId));
  } catch (e) {
    logger.error("Failed to invalidate certificate cache", { certificateId, error: e });
  }
}
```

### 8. Notification Payload Builders (`notification-payloads.builders.ts`)

```typescript
import type { Locale } from "@/shared/locale";
import type { NotificationPayload } from "@/backend/types/notification.types";

export function buildCertificateIssuedPayloads(
  certificateId: string,
  studentId: string,
  targetUserIds: string[],
  locale?: Locale
): NotificationPayload[] {
  return targetUserIds.map((userId) => ({
    userId,
    notificationEventType: NotificationEventType.CERTIFICATE_ISSUED,
    title: locale === "ar" ? "تم إصدار شهادة جديدة" : "New Certificate Issued",
    body: locale === "ar"
      ? `تم إصدار شهادة برقم ${certificateId}`
      : `A certificate has been issued (ID: ${certificateId})`,
    metadata: { certificateId, studentId },
  }));
}

export function buildCertificateRevokedPayloads(
  certificateId: string,
  studentId: string,
  revocationReason: string,
  targetUserIds: string[],
  locale?: Locale
): NotificationPayload[] {
  return targetUserIds.map((userId) => ({
    userId,
    notificationEventType: NotificationEventType.CERTIFICATE_REVOKED,
    title: locale === "ar" ? "تم إلغاء شهادة" : "Certificate Revoked",
    body: locale === "ar"
      ? `تم إلغاء الشهادة. السبب: ${revocationReason}`
      : `Certificate has been revoked. Reason: ${revocationReason}`,
    metadata: { certificateId, studentId, revocationReason },
  }));
}
```

### 9. Barrel Export (`index.ts`)

```typescript
export * from "./template-management.service";
export * from "./recipient-group.service";
export * from "./certificate-management.service";
export * from "./certificate-generation.service";
export * from "./certificate-verification.service";
export * from "./cache-helpers";
export * from "./notification-payloads.builders";
```

### 10. Registration in `backend/services/index.ts`

Add the following line to the existing barrel:

```typescript
export * from "@/backend/services/certificates";
```

### 11. Pattern Compliance Summary

| Pattern | Implementation | Reference |
|---|---|---|
| Namespace-of-pure-functions | `export namespace X { export async function method() {} }` | `billing-management.service.ts` |
| Service signature | `(actorUserId, input, tErrors, locale?)` | `04-services-graphql-patterns.md` §B.2 |
| SSR-safe (no `ctx`) | All params explicit, no GraphQL context import | `04-services-graphql-patterns.md` §B.3 |
| Permission gating | `requirePermission(actorUserId, AppPermission.X, tErrors)` | `billing-management.service.ts:43-48` |
| Error style 1 | `throw new Error(tErrors.cert.*)` for validation/permission | `04-services-graphql-patterns.md` §B.4 |
| Error style 2 | `throw new NotFoundError("CERTIFICATE", tErrors.cert.*)` for missing entities | `04-services-graphql-patterns.md` §B.4 |
| Error style 3 | `throw new ValidationError(code, message)` for template input validation | `04-services-graphql-patterns.md` §B.4 |
| No GraphQLError | Services never import or throw `GraphQLError` | `04-services-graphql-patterns.md` §B.4 |
| Idempotency | `createHash("sha256").update(parts.join(":")).digest("hex")` | `billing-management.service.ts` `deriveIdempotencyKey` |
| Cache: `cachedReadSingleFlight` | Key format `ec:${CACHE_VERSION}:cert:render:${tvId}:${rgId}` | `EntityCacheService.ts` |
| Cache: fail-open | All invalidations wrapped in `try/catch` | `EntityCacheService.ts` |
| Permission before cache | Authorization check before `cachedRead` call | `04-services-graphql-patterns.md` §B.7 |
| Batch for DataLoader | `Map<string, T \| null>` return type | `04-services-graphql-patterns.md` §C.11 |
| Notification side-effects | `dispatchWithPreferences(...).catch(e => logger.error(...))` | `billing-management.service.ts` |
| Audit side-effects | `AuditService.createManyAuditLogs([...])` in `try/catch` | `billing-management.service.ts` |
| Logger (not console) | `import { logger } from "@/backend/lib/logger"` | AGENTS.md |
| Path aliases (`@/`) | All imports use `@/backend/...`, `@/shared/...` | AGENTS.md |

### 12. Import Dependencies

```typescript
// Types
import type {
  CertificateReturnType,
  CertificateBatchReturnType,
  CertificateListInput,
  CertificateVerificationResultReturnType,
  GenerateCertificateInput,
} from "@/backend/types/certificate.types";
import type {
  TemplateReturnType,
  TemplateVersionReturnType,
  TemplateSubmitInput,
  TemplateUpdateInput,
} from "@/backend/types/template.types";
import type {
  RecipientGroupReturnType,
  RecipientGroupSubmitInput,
} from "@/backend/types/recipient-group.types";
import type { ErrorsLabels } from "@/shared/locale";

// Repositories (Plan 03)
import { CertificateRepository } from "@/backend/db/repo/certificate.repo";
import { TemplateRepository } from "@/backend/db/repo/template.repo";
import { TemplateVersionRepository } from "@/backend/db/repo/template-version.repo";
import { RecipientGroupRepository } from "@/backend/db/repo/recipient-group.repo";
import { CertificateVerificationAttemptRepository } from "@/backend/db/repo/certificate-verification-attempt.repo";

// Permissions
import { PermissionsService } from "@/backend/services/permissions/permissions.service";
import { AppPermission } from "@/backend/enum/permissions";

// Cache
import { EntityCacheService } from "@/backend/services/cache/EntityCacheService";

// Notification
import { dispatchWithPreferences } from "@/backend/services/notification/dispatch.service";
import { NotificationEventType } from "@/backend/enum/notification";

// Audit
import { AuditService } from "@/backend/services/audit/audit.service";

// Logger
import { logger } from "@/backend/lib/logger";

// Storage (Plan 02 or existing)
import { StorageService } from "@/backend/services/storage/storage.service";

// Errors
import { NotFoundError } from "@/backend/lib/errors";

// Node crypto
import { createHash, randomBytes } from "node:crypto";
```

### 13. Error Handling Patterns

#### 13.1 Validation Error (Style 1)

```typescript
if (input.name.length < 3 || input.name.length > 255) {
  throw new Error(tErrors.cert.templateNameInvalid);
}
```

#### 13.2 Not Found Error (Style 2)

```typescript
const template = await TemplateRepository.getById(input.templateId);
if (!template) {
  throw new NotFoundError("TEMPLATE", tErrors.cert.templateNotFound(input.templateId));
}
```

#### 13.3 Permission Denied

```typescript
async function requirePermission(
  actorUserId: string,
  permission: AppPermission,
  tErrors: ErrorsLabels
): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, permission);
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
}
```

#### 13.4 Duplicate Key (Idempotency)

```typescript
function isDuplicateKeyError(e: unknown): boolean {
  return (
    e instanceof Error &&
    // PostgreSQL unique violation
    (e.message.includes("duplicate key") ||
      (e as { code?: string }).code === "23505")
  );
}
```

### 14. Feature 6 — Outcome Knowledge Base & Progress Tracking

#### 14.1 Outcome Directory

Each task in `tasks.md` corresponds to an outcome file in the `outcome/` directory. The outcome files serve as:

1. **Implementation journal**: Record decisions, pattern discoveries, and deviations from design
2. **Knowledge transfer**: Future agents read these to understand *why* code was written a certain way
3. **Progress tracking**: The orchestrator checks outcome files to determine task completion

#### 14.2 Knowledge Propagation

Task 8 explicitly propagates knowledge to:

| Target | Method | Content |
|---|---|---|
| `backend/services/AGENTS.md` | Add new section | Certificate service conventions: namespace pattern, 5 namespaces, cache key format, idempotency key format, fail-open cache, fire-and-forget notifications |
| `docs/services/entity-cache-service.md` | Add examples | Certificate cache keys and tags with real examples, `invalidateCertificateWrite` and `invalidateCertificateTemplateWrite` helper signatures |
| Shared knowledge base | Outcome files | Per-task implementation decisions and pitfalls |

#### 14.3 Cross-Plan Knowledge Carry-Over

| From Plan 04 | To Plan | Knowledge |
|---|---|---|
| Service function signatures | Plan 05 (GraphQL) | Resolvers call `(actorUserId, input, ctx.t().errorsTranslations, ctx.locale)` |
| `CertificateRendererService.renderPdf` interface | Plan 06 (PDF) | Must export `renderPdf({ templateVersionId, certificateId, variables, verificationCode })` returning `{ filePath }` |
| Batch methods `getCertificatesContexts` | Plan 05 (GraphQL) | DataLoader field resolver calls batch method, returns `Map<string, T \| null>` |
| Cache tag taxonomy | Plan 07 (if caching UI) | Tags `cert:render`, `cert:tmpl:*`, `cert:*` for cache invalidation hooks |
| Notification event types | Plan 05 (GraphQL) | Subscriptions can listen for `CERTIFICATE_ISSUED`, `CERTIFICATE_REVOKED` events |
