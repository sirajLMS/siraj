# Inter-Plan Contracts — Certificate Feature (Siraj)

> **Purpose**: This document resolves all cross-plan inconsistencies discovered during the SWE Expert Review.
> It is the canonical contract for all shared types, service names, permission keys, enum values, pagination patterns,
> and cross-plan dependencies. ALL plans MUST conform to this document. Where a plan's design.md
> `## SWE Expert Review Notes` section conflicts with this document, THIS DOCUMENT wins.

---

## 1. Permission Keys (Canonical)

**Owner**: Plan 02 (Types & Permissions) seeds these into `backend/permissions` table.
**All plans MUST use these exact dot-path keys.**

| AppPermission Key | String Value | Description |
|---|---|---|
| `CertificateView` | `certificates.view` | View certificate lists, details, audit trails |
| `CertificateManage` | `certificates.manage` | Edit certificate metadata, revoke, re-issue |
| `CertificateGenerate` | `certificates.generate` | Generate single certificates |
| `CertificateRevoke` | `certificates.revoke` | Revoke issued certificates |
| `CertificateBatchGenerate` | `certificates.batch_generate` | Batch generate certificates |
| `CertificateTemplateView` | `certificates.templates.view` | View template lists, categories, elements |
| `CertificateTemplateManage` | `certificates.templates.manage` | Create/edit/archive templates, categories, elements |
| `CertificateTemplatePublish` | `certificates.templates.publish` | Publish/template versioning |
| `CertificateRecipientGroupView` | `certificates.recipient_groups.view` | View recipient groups |
| `CertificateRecipientGroupManage` | `certificates.recipient_groups.manage` | Create/edit/delete recipient groups |
| `CertificateVerificationView` | `certificates.verifications.view` | View verification logs (internal) |

**Total: 11 permissions.** No `CERT_*` SCREAMING_SNAKE. No `template.*` or `category.*` shorthand.
**Plans 05, 07, 08, 09, 16, 18 MUST sweep and replace any non-conforming keys.**

---

## 2. Certificate Status Enum (Canonical)

**Owner**: Plan 01 (pgEnum), Plan 02 (TS enum registration).

| Enum Name | DB Values (lowercase) | Notes |
|---|---|---|
| `CertificateStatus` | `pending`, `issued`, `revoked`, `expired`, `failed` | **5 values only.** No `draft`. No `ACTIVE`. |

- `pending` → generation initiated, PDF not yet ready
- `issued` → PDF generated, certificate valid
- `revoked` → manually revoked by admin
- `expired` → past `expiryDate` (set by cron, Plan 22)
- `failed` → generation or rendering failed

**Status Transition Matrix (owned by Plan 04, cited by Plans 16/17/18):**

```
pending → issued     (render success)
pending → failed     (render error)
issued  → revoked    (manual revoke)
issued  → expired    (cron detects expiryDate passed)
failed  → pending    (retry render)
revoked → pending    (re-issue, with reason)
```

**No other transitions are valid.** Plans 16/17/18 MUST cite this matrix, not redefine it.

---

## 3. Certificate Template Status Enum (Canonical)

| Enum Name | DB Values | Notes |
|---|---|---|
| `CertificateTemplateStatus` | `draft`, `published`, `archived` | 3 values. |

---

## 4. All 11 Enums (Complete Catalog)

Plans 01/02 MUST define exactly these 11 enums. No more, no less.

| # | Enum Name | Values |
|---|---|---|
| 1 | `CertificateStatus` | `pending`, `issued`, `revoked`, `expired`, `failed` |
| 2 | `CertificateTemplateStatus` | `draft`, `published`, `archived` |
| 3 | `CertificateBackgroundType` | `color`, `image`, `gradient` |
| 4 | `CertificateGenerationStatus` | `pending`, `processing`, `completed`, `failed` |
| 5 | `CertificateVerificationMethod` | `qr_code`, `link`, `manual` |
| 6 | `CertificateElementType` | `static_text`, `data_text`, `data_date`, `image`, `qr_code`, `shape` |
| 7 | `CertificateVariableType` | `text`, `number`, `date`, `select` |
| 8 | `CertificateVerificationResult` | `valid`, `revoked`, `expired`, `not_found` |
| 9 | `CertificateSortField` | `created_at`, `issued_at`, `student_name`, `template_name` |
| 10 | `CertificateTemplateSortField` | `created_at`, `updated_at`, `title`, `category` |
| 11 | `CertificateOrientation` | `landscape`, `portrait` |

`FontFamily` is NOT a pgEnum — it is a TS-only string union (Plan 02 owns).

---

## 5. Service Names (Canonical)

**Owner**: Plan 04 defines services. Plan 05 imports them. These MUST match.

| Service Class | File | Namespace |
|---|---|---|
| `CertificateGenerationService` | `backend/services/certificates/generation.service.ts` | `CertificateServices.generation` |
| `CertificateManagementService` | `backend/services/certificates/management.service.ts` | `CertificateServices.management` |
| `CertificateVerificationService` | `backend/services/certificates/verification.service.ts` | `CertificateServices.verification` |
| `TemplateManagementService` | `backend/services/certificates/template.service.ts` | `CertificateServices.template` |
| `TemplateElementService` | `backend/services/certificates/templateElement.service.ts` | `CertificateServices.templateElement` |
| `TemplateVariableService` | `backend/services/certificates/templateVariable.service.ts` | `CertificateServices.templateVariable` |
| `TemplateCategoryService` | `backend/services/certificates/templateCategory.service.ts` | `CertificateServices.templateCategory` |
| `RecipientGroupService` | `backend/services/certificates/recipientGroup.service.ts` | `CertificateServices.recipientGroup` |
| `CertificateRenderService` | `backend/services/certificates/render.service.ts` | `CertificateServices.render` |

- Plan 05 MUST import these exact names. No `CertificateService`. No `TemplateService` alone.
- Plan 06's `RenderService` is renamed to `CertificateRenderService` (§9 below).

---

## 6. Verification Response Shape (Canonical)

**Owner**: Plan 04 (service implementation), Plan 05 (GraphQL type), Plan 19 (public page).

The public verification endpoint MUST return a **constant-shape** response regardless of code validity.
This prevents oracle side-channel attacks (enumerating which codes exist).

```
VerificationResult:
  result: CertificateVerificationResult  // 'valid' | 'revoked' | 'expired' | 'not_found'
  certificate?: {
    recipientName: string      // safe to show (the certificate holder's name)
    templateTitle: string       // template display name
    issueDate: string          // ISO 8601
    expiryDate: string | null   // ISO 8601 or null if no expiry
  }
  // NOT included: revocationReason (PII), studentId, generatedBy, internal notes
```

- `not_found` returns `certificate: null`
- `revoked` returns `certificate` with revoked status (but WITHOUT `revocationReason`)
- `expired` returns `certificate` with expired status
- `valid` returns full certificate info

**Plan 04 MUST NOT throw NotFoundError** — return `result: 'not_found'` instead.
**Plan 04 MUST NOT return `revocationReason`** in the public verification path.

---

## 7. Generation Input Shape (Canonical)

**Owner**: Plan 04 (service), Plan 05 (GraphQL input), Plan 17 (UI dialog).

```
GenerateCertificateInput:
  templateId: string          // UUID
  studentId: string           // UUID
  recipientName?: string       // override student display name
  recipientEmail?: string      // override student email
  variableValues?: Record<string, string>  // key = variableId, value = string
  expiryDate?: string | null  // ISO 8601 or null
  idempotencyKey?: string     // for safe retry

GenerateBatchInput:
  templateId: string
  recipientGroupId: string    // UUID
  variableOverrides?: Record<string, Record<string, string>>  // per-student per-variable
  expiryDate?: string | null
  idempotencyKey?: string
```

- `variableValues` keys are **variable IDs** (UUID), NOT variable names (Plan 17 B.4)
- All date fields are **ISO 8601 strings**, NOT `Date` objects
- Plan 05's `generateCertificate` mutation input MUST include all fields above (Plan 05 currently omits `studentId`, `recipientName`, `recipientEmail`, `variableValues`, `expiryDate` — MUST fix)

---

## 8. Pagination Pattern (Canonical)

**Owner**: Plan 03 (repo pagination), Plan 05 (GraphQL PageInfo), Plan 08/16 (UI lists).

All certificate list views MUST use **page-number OFFSET pagination** matching the existing `AppDataGrid` component.

```
PageInfo (Laravel-style, matching existing Pothos pagination.objects.ts):
  currentPage: number
  hasMorePages: boolean
  lastPage: number
  perPage: number
  total: number
  startCursor: string | null
  endCursor: string | null

List Input:
  page: number       // 1-based
  perPage: number    // items per page
  search?: string
  filters?: ...
  sort?: ...

List Response:
  items: T[]
  pageInfo: PageInfo
```

- **NO relay-style `Connection` + `edges`/`node` + `after` cursor + Apollo `fetchMore`**
- **NO `limit`/`offset` AND cursor hybrid** — page-number only
- Plan 16 MUST rewrite its pagination design to use `AppDataGrid`'s `mode: "server"`, `page`, `pageSize`, `totalCount`, `onPageChange` API
- Plan 08 MUST use the same pattern for template lists

---

## 9. PDF Rendering Service Name

**Canonical**: `CertificateRenderService` (in `backend/services/certificates/render.service.ts`)

- Plan 04 imports `CertificateRenderService`
- Plan 06 defines `CertificateRenderService` (NOT `RenderService` or `PdfRenderService`)
- Plan 18 imports `CertificateRenderService` for re-render/regenerate

### Font Bundling Strategy

- `@sparticuz/chromium` ships NO Arabic fonts — bundled fonts are MANDATORY
- Font path MUST use bundler asset resolution (NOT hardcoded `./assets/fonts/arabic`)
- Plan 06 MUST specify the exact bundler asset path mechanism (e.g., `import fontUrl from '@/assets/fonts/arabic/Amiri.woff2'`)

### Puppeteer Serverless Mode

- `--single-process` flag MUST be env-gated to serverless only (NOT on long-running deploys)
- `getPage()` MUST detect `VERCEL`/Lambda environment and launch per-invocation (disable 60s idle pool in serverless)
- `maxDuration` MUST be set on any route that triggers rendering

### PDF Metadata

- Puppeteer's `page.pdf()` does NOT support PDF metadata (title/author/subject)
- Plan 06 MUST include a `pdf-lib` post-step to set metadata after Puppeteer generates the PDF

### Cache Key

- Cache key MUST include: `templateId`, `version`, AND `backgroundFileId` (+ its content hash)
- Without `backgroundFileId`, a background image swap returns a stale cached PDF

---

## 10. Batch Generation Pattern (Canonical)

**Owner**: Plan 01 (table), Plan 04 (service), Plan 17 (UI), Plan 22 (cron worker).

Synchronous batch generation over ≥25 certificates WILL exceed serverless function timeouts.
All batch generation MUST use an async job pattern.

### New Table (Plan 01 MUST add)

```
certificate_batch_jobs:
  id: uuid PK
  templateId: uuid FK → certificate_templates
  recipientGroupId: uuid FK → certificate_recipient_groups
  status: CertificateGenerationStatus  // pending/processing/completed/failed
  total: int
  processed: int
  failed: int
  idempotencyKey: text | null
  createdBy: uuid FK → users
  createdAt: timestamptz
  updatedAt: timestamptz
  completedAt: timestamptz | null
  errorDetails: jsonb | null  // per-recipient failure records
```

### Async Flow

1. Plan 17: User initiates batch → `generateBatch` mutation creates a `certificate_batch_jobs` row (status: `pending`) and returns immediately
2. Plan 22: Cron worker picks up `pending` jobs → marks `processing` → generates certificates in chunks → updates `processed`/`failed` counts → marks `completed`/`failed`
3. Plan 17: UI polls job status via `certificateBatchJob(id)` query → progress bar reflects real `processed/total`
4. Cancel: setting job status to `failed` with reason `cancelled` — cron worker respects this

- `errorDetails` stores per-recipient failure records: `[{ studentId, code, message }]`
- Plan 17's `recipientIds` field is renamed to `recipientGroupId` (it references a group, not individual IDs)

---

## 11. Optimistic Locking for Template Editor (Canonical)

**Owner**: Plan 01 (schema), Plans 10/11/12/15 (editor mutations).

### Schema Change (Plan 01 MUST add)

- `certificate_templates.expectedVersion: int NOT NULL DEFAULT 1`
- `certificate_templates.updatedAt: timestamptz NOT NULL DEFAULT now()` (if not already present)

### Mutation Contract

All template editor mutations MUST accept `expectedVersion: int` in their input:
- If `template.expectedVersion !== input.expectedVersion`, mutation returns a `ConflictError` (mapped from `DomainError` with code `TEMPLATE_VERSION_CONFLICT`)
- On success, `expectedVersion` is incremented atomically

### Concurrent Edit Protection (Plan 11 canvas + Plan 15 publish)

- Plan 11: Canvas save mutation includes `expectedVersion`. If mismatch, client refetches template and shows merge warning.
- Plan 15: Publish mutation includes `expectedVersion`. If mismatch, publish is blocked — client must refetch and retry.
- Plan 15: Advisory lock (`pg_advisory_xact_lock(templateId)`) during version snapshot to prevent concurrent publishes.

---

## 12. Category Reorder API (Canonical)

**Owner**: Plan 09.

**Problem**: Integer `order` column with no gap-allocation → fraction-exhaustion bug under concurrent reorders.

**Solution**: Switch from raw `order: int` input to positional reorder API.

```
ReorderCategoryInput:
  beforeId: string | null   // move category to before this one (null = move to end)
  afterId: string | null    // move category to after this one (null = move to beginning)
```

- Exactly one of `beforeId`/`afterId` is non-null
- The service recalculates `order` values with gap allocation (e.g., 10000, 20000, 30000 → insert at 15000)
- If gap < 1 (exhausted), service renormalizes all siblings in a single transaction
- Plan 09 MUST rewrite its `reorderCategory` mutation input from `order: Int` to `ReorderCategoryInput`

---

## 13. Verification Rate Limiting (Canonical)

**Owner**: Plan 04 (service), Plan 19 (public page).

### Rate Limit Location

Rate limiting MUST be in the **service layer** (`CertificateVerificationService`), NOT only in the GraphQL resolver.
This is because Server Component `generateMetadata` calls `verifySafe` directly, bypassing the resolver.

### Rate Limit Strategy

1. **Per-IP limit**: e.g., 30 requests per 5 minutes (reuse `backend/lib/ratelimit.ts`)
2. **Per-code limit**: e.g., 10 requests per code per 5 minutes (prevents code enumeration)
3. **On limit exceeded**: Return `result: 'not_found'` (same as invalid code — constant shape, no oracle)

### CDN Caching

- Plan 19 MUST set `revalidate: 3600` (1 hour) on the verification page route
- `generateStaticParams` SHOULD return empty array (dynamic, not pre-rendered)
- Response headers: `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`

---

## 14. Ownership Column for TEACHER Scoping (Canonical)

**Owner**: Plan 01 (schema), Plans 13/14/15 (TEACHER scoping).

### Schema Change (Plan 01 MUST add)

- `certificate_templates.createdById: uuid FK → users NOT NULL`
- `certificate_recipient_groups.createdById: uuid FK → users NOT NULL`

### Scoping Rule

- TEACHER role: `WHERE createdById = ctx.userId` (per-row ownership, matching codebase idiom)
- ADMIN role: no filter (sees all)
- The `createdById` column doubles as audit trail (who created this template/group)

---

## 15. Error Classes (Canonical)

**Owner**: Plan 04 (service layer).

The codebase (`backend/lib/errors.ts`) exports only:
- `DomainError` (base)
- `NotFoundError`
- `UnauthorizedError`
- `ForbiddenError`

Plans MUST NOT invent: `ValidationError`, `ConflictError`, `AuthorizationError`, `TemplateInUseError`, `GenerationFailedError`, `PermissionError`.

### Error Mapping Table

| Condition | Error Class | Code (for i18n) |
|---|---|---|
| Template not found | `NotFoundError` | `errors.certificates.templateNotFound` |
| Certificate not found | `NotFoundError` | `errors.certificates.certificateNotFound` |
| Permission denied | `ForbiddenError` | `errors.certificates.permissionDenied` |
| Not authenticated | `UnauthorizedError` | `errors.certificates.notAuthenticated` |
| Version conflict | `DomainError` | `errors.certificates.templateVersionConflict` |
| Template in use (archive blocked) | `DomainError` | `errors.certificates.templateInUse` |
| Generation failed | `DomainError` | `errors.certificates.generationFailed` |
| Storage full | `DomainError` | `errors.certificates.storageFull` |
| Validation failed | `DomainError` | `errors.certificates.validationFailed` |

All error messages MUST use `getServerTranslations(locale)` (single arg) or `ctx.t().errorsTranslations` (GraphQL resolver).

---

## 16. i18n Error Labels Extension (Canonical)

**Owner**: Plan 03 (types layer), all plans (usage).

The `tErrors` parameter in services is of type `ErrorsLabels` (from `shared/locale/types/message.ts`).
Plan 03 MUST extend `ErrorsLabels` with namespaced certificate keys:

Structure: `errors.certificates.<errorKey>` (e.g., `errors.certificates.templateNotFound`)

Each locale file (`shared/locale/{en,ar}/errors.ts`) MUST add these keys.
The `certificates` sub-object in `errors` is owned collectively by all plans (each plan adds its own keys).

---

## 17. GraphQL Barrel Naming (Canonical)

**Owner**: Plan 05 (documents), Plans 10/12 (imports).

The GraphQL documents barrel MUST use `certificates/` (plural, matching `docs/<domain>/` convention):

```
frontend/common/graphql/sharedDocuments/certificates/
  ├── certificate.documents.ts
  ├── certificateTemplate.documents.ts
  ├── certificateCategory.documents.ts
  ├── certificateRecipientGroup.documents.ts
  ├── certificateVerification.documents.ts
  └── index.ts   // barrel export
```

- Plan 10 says `cert/` → MUST sweep to `certificates/`
- Plan 12 says `certificates/` → already correct
- All `import { ... } from "@/frontend/common/graphql/sharedDocuments/certificates"` 

---

## 18. DPI Standard (Canonical)

**Owner**: MASTER_ARCHITECTURE (this section).

All plans MUST use **96 DPI** (CSS pixel standard) for template dimensions.

| Paper Size | Pixel Dimensions (96 DPI) |
|---|---|
| A4 Portrait | 794 × 1123 |
| A4 Landscape | 1123 × 794 |
| Letter Portrait | 816 × 1056 |
| Letter Landscape | 1056 × 816 |

- Plan 10 already uses 794×1123 ✅
- Plan 11 uses 595×842 (72 DPI) → MUST update to 794×1123
- PDF export MUST scale from 96 DPI to 72 DPI (PDF point standard) via `scale: 72/96`

---

## 19. Rotation Range (Canonical)

All element rotation values MUST be `0..360` (degrees, normalized).

- Plan 11: already `0-360` ✅
- Plan 12: uses `-360..360` → MUST normalize to `0..360` (normalize on input: `rot = ((rot % 360) + 360) % 360`)

---

## 20. Installed Libraries (Canonical)

These libraries are already installed in `package.json` and MUST be used instead of reinventing:

| Library | Used By Plan | Replaces |
|---|---|---|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Plans 11, 12 | Bespoke canvas drag-drop, layer reorder |
| `react-zoom-pan-pinch` | Plan 11 | Bespoke canvas zoom/pan |
| `html-to-image` | Plan 15 | Bespoke client-side preview snapshot |
| `react-color` | Plans 10, 12 | MUI ColorPicker (does NOT exist in MUI v9) |
| `@pdfme/common` + `schemas` + `ui` | Plan 11 (optional) | Bespoke canvas rendering (evaluate suitability) |
| `pdf-lib` | Plan 06 | PDF metadata post-step |
| `sharp` | Plan 07 | Image dimension validation |
| `date-fns` | Plans 13, 18 | Relative date parsing (but NOT Hijri — use Intl) |
| `qrcode` | Plans 06, 18 | QR code generation (NOT yet installed — Plan 01 T_include must add) |

**`qrcode` is NOT currently installed.** Plan 01 (or Plan 06's first task) MUST add `qrcode` + `@types/qrcode` to `package.json` before any QR task executes.

---

## 21. EnvConfigCategory for Cron (Canonical)

**Owner**: Plan 22.

`EnvConfigCategory` union is: `email|sms|push|fx|cache|redis|storage|auth|app|meeting|billing|general`

**Decision**: Use `"general"` for cert cron env config. Do NOT add `"cron"` to the enum (avoid bloating the union for one consumer).

Also: `environment.d.ts` is at the **repo root** (`/environment.d.ts`), NOT `backend/lib/environment.d.ts`.

---

## 22. Download Security (Canonical)

**Owner**: Plan 07 (signed URL + audit), Plan 18 (download UI).

The codebase uses a `signedUrls` table with **one-shot atomic claim**:
- `claimSignedUrl(token, tx)` does `SELECT FOR UPDATE SKIP LOCKED`, sets `used = true`, returns URL
- Single-use, not a long-lived S3 presign
- `expiresAt` enforces time limit

### Download Flow

1. Plan 18: User clicks "Download" → `requestDownloadUrl(certificateId)` mutation → service creates a `signedUrls` row with `entityType: 'certificate_pdf'`, `entityId: certificateId`, `expiresAt: now + 300s`
2. Plan 18: Client receives the one-shot token → redirects to download endpoint
3. Plan 07: Download endpoint calls `claimSignedUrl(token)` → asserts `used === false` and `expiresAt > now` → returns file stream → fires **DOWNLOAD audit event** on successful claim
4. If already `used = true` or expired → returns 410 Gone

**Plan 18 MUST NOT** treat this as a 5-min S3 presign. It is one-shot.
**Plan 07 MUST** fire an audit event on successful download claim (hard task).

---

## 23. Apollo Cache Contract (Canonical)

**Owner**: Plan 05 (operation names), Plans 16/17/18 (cache eviction).

### Canonical Operation Names

| Operation | Name | Used By |
|---|---|---|
| Certificate list query | `CertificateList` | Plan 16 |
| Certificate metrics query | `CertificateMetrics` | Plan 16 |
| Certificate detail query | `CertificateDetail` | Plan 18 |
| Certificate batch job query | `CertificateBatchJob` | Plan 17 |
| Generate certificate mutation | `GenerateCertificate` | Plan 17 |
| Generate batch mutation | `GenerateBatch` | Plan 17 |
| Revoke certificate mutation | `RevokeCertificate` | Plan 16, 18 |
| Batch archive templates mutation | `BatchArchiveTemplates` | Plan 08 |

### Cache Eviction Rules

- `GenerateCertificate` / `GenerateBatch`: evict `CertificateList` and `CertificateMetrics` from ROOT_QUERY only. **DO NOT** evict `CertificateDetail` (Plan 18 is cache-first).
- `RevokeCertificate`: evict `CertificateList` + `CertificateDetail` (both must reflect new status).
- Plans 16/17/18 MUST use `refetchQueries({ include: ['CertificateList', 'CertificateMetrics'] })` (or `CertificateDetail` for revoke).
- Operation names MUST be frozen — no plan may rename them without updating this contract.

---

## 24. Template Version Snapshot (Canonical)

**Owner**: Plan 01 (schema), Plan 15 (publish flow).

### Version Snapshot Deep Copy

Publishing a template creates a deep copy (snapshot) of the template + elements + variables.
This MUST be transactionally bounded:

1. Acquire `pg_advisory_xact_lock(templateId)` (reuse `student.repository.ts:acquireStudentLock` idiom)
2. `SELECT ... FOR UPDATE` on `certificate_templates` row (pessimistic lock)
3. Deep copy template → `certificate_templates` row with `version = MAX(version) + 1`, `status = 'published'`
4. Deep copy all `certificate_template_elements` → new templateId
5. Deep copy all `certificate_template_variables` → new templateId
6. Commit transaction (releases advisory + row locks)

### Idempotency

- Publish mutation accepts `idempotencyKey` — if a publish with same key already exists for this template+version, return existing result instead of creating a duplicate.
- Double-click on "Publish" MUST NOT create two versions.

---

## 25. DPI and FTS Reference (Canonical)

### Full-Text Search

- Certificate FTS index is on `verificationCode` (NOT `recipientName` — that column doesn't exist on `certificates`)
- Recipient name search: `ILIKE` on `students.name` via JOIN, OR Plan 01 adds a denormalized `recipientName` snapshot column on `certificates`
- FTS config: `'simple'` (Arabic search via `'simple'` config has limitations — benchmark before production)

### GIN Index

- `cert_fts_idx` on `certificates` USING `gin(to_tsvector('simple', verificationCode))`

---

## 26. Notification Events (Canonical)

**Owner**: Plan 01 (enum/values), Plan 04 (service dispatch).

Plan 01 MUST add to the existing notification event enum (or Plan 02 extends it):
- `CERTIFICATE_ISSUED` — fired when certificate status transitions to `issued`
- `CERTIFICATE_REVOKED` — fired when certificate status transitions to `revoked`
- `CERTIFICATE_BATCH_COMPLETED` — fired when batch job status transitions to `completed`

These MUST be added to the notification event enum in `backend/enum/` (Plan 02's responsibility, referencing Plan 01 for db pgEnum).

---

## 27. Soft-Delete Pairing Requirement (Canonical)

**Owner**: Plan 03 (repository), Plan 02 (types).

Extending `SOFT_DELETE_TABLES` in `soft-delete.repository.ts` with cert tables **requires** also extending:
- `Types.SoftDeletableTableName` union type (in Plan 02's types)
- `SoftDeletableEntityMap` interface (in Plan 02's types)

Without both, `softDelete<T extends Types.SoftDeletableTableName>` will NOT compile.

Cert tables to add to soft-delete: `certificates`, `certificate_templates`, `certificate_categories`, `certificate_recipient_groups`.

---

## Summary of Required Plan Updates

| Plan | Required Updates (from this contract) |
|---|---|
| 01 | Add: `certificate_batch_jobs` table, `createdById` columns, `slug`+`idempotencyKey` columns, `expectedVersion` column, notification event enum values, `qrcode` in package.json tasks |
| 02 | Sweep permission keys to 11 `certificates.*` values; extend `SoftDeletableTableName` + `SoftDeletableEntityMap`; add `CERTIFICATE_ISSUED/REVOKED/BATCH_COMPLETED` to notification event enum; extend `ErrorsLabels` with cert keys |
| 03 | Use `defineRelations` graph API (not legacy `relations()`); FTS on `verificationCode` not `recipientName`; barrel exports as relative; soft-delete pairing with Plan 02 types |
| 04 | Service names match §5; verification returns constant-shape (§6); `tErrors` is `ErrorsLabels` not custom; use only existing error classes (§15); async batch via `certificate_batch_jobs` (§10); rate limit in service (§13); strip `revocationReason` (§6) |
| 05 | Unify requirements.md with design.md (same query/mutation/permission names); import service names from §5; `generateCertificate` input includes all §7 fields; verification returns §6 shape; page-number pagination (§8); barrel as `certificates/` (§17) |
| 06 | Service name → `CertificateRenderService`; font bundler asset path; serverless launch-per-invocation; pdf-lib metadata post-step; cache key includes `backgroundFileId` (§9); `qrcode` library |
| 07 | Two-hop access resolver (cert→student→user); duration clamp 1-60min; dimension validation via `sharp`; DOWNLOAD audit on signed URL claim (§22); storage-full error mapping |
| 08 | Missing filters (orientation, owned-by-me); sort selector; cursor reset on sort change; `batchArchive` returns updated templates; permission keys from §1 |
| 09 | Switch to positional reorder API `{beforeId?, afterId?}` (§12); split view+manage permissions; `categoryTemplates` pagination per §8; restore/hard-delete lifecycle |
| 10 | `cert/` → `certificates/` barrel (§17); resolve DPI with §18; replace MUI ColorPicker with `react-color` (§20); single-flight save with `expectedVersion` (§11); optimistic locking |
| 11 | DPI 794×1123 not 595×842 (§18); adopt `@dnd-kit`, `react-zoom-pan-pinch` (§20); `selectedIds: string[]` not `Set<string>`; `expectedVersion` on save (§11); theme color not hardcoded |
| 12 | `cert/` → `certificates/` barrel (§17); rotation 0..360 (§19); use `@dnd-kit/sortable` for layer reorder (§20); use `react-color` (§20); `UpdateElementProperties` undo command; z-index renormalization; a11y section |
| 13 | Centralize system variable keys; relative-date parser grammar spec; resolved-value shape contract; `createdById` scoping (§14) |
| 14 | `UNIQUE(groupId, studentId)`; server-side variable value validation; `variableStatus` N+1 batch; `createdById` scoping (§14) |
| 15 | Advisory lock during publish (§24); `expectedVersion` on publish (§11); publish idempotency key (§24); version-snapshot deep copy transactional (§24) |
| 16 | Sweep `CERTIFICATES_*` → `certificates.*` (§1); sweep `draft` status → remove (§2); page-number pagination matching `AppDataGrid` (§8); `StatusBadge` category API; `MetricCard` variant API; `MobileCardList` per-feature build; `getServerUserContext` page signature |
| 17 | Async batch via `certificate_batch_jobs` (§10); `recipientIds` → `recipientGroupId`; `variableOverrides` key by variableId; ISO 8601 strings not Date objects (§7); cache eviction per §23 |
| 18 | Sweep `ACTIVE` → canonical 5-value enum (§2); `CERTIFICATES_*` → `certificates.*` (§1); one-shot signed URL (§22); audit trail pagination; `AccessDenied` → `DashboardNotFoundContent`; UUID-validate `[id]`; QR baked at generation time |
| 19 | Rate limit in service layer (§13); per-code attempt cap (§13); CDN cache headers (§13); OG image; constant-shape response (§6) |
| 20 | Do NOT import `getServerTranslations` in tests (use literal English); add missing edge cases (storage-failure, idempotency, empty-template) |
| 21 | Follow canonical doc structure (`## Why`, `## NOT to do`, `## Rollout`); `docs/certificates/` OR cross-link to `docs/<domain>/`; re-sync CRON_PATTERNS.md if Plan 22 changes |
| 22 | `EnvConfigCategory` use `"general"` not `"cron"` (§21); `environment.d.ts` at repo root (§21); dry-run mode; per-day idempotent aggregation; alerting on partial-success; `maxDuration` on routes |
