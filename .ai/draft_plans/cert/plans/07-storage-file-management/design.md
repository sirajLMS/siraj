# Design — Plan 07: Storage & File Management

> **Plan**: 07 — Storage & File Management
> **Depends On**: Plan 4 (Services & Business Logic)
> **Related Docs**: MASTER_ARCHITECTURE.md; cgvs_analysis/05-storage-system.md §6-§9, §14; siraj_analysis/07-storage-file-system.md §2-§9, §15; siraj_analysis/03-repository-patterns.md §9

---

## 1. Architecture Overview

### Layer Position

This plan operates entirely in the **backend data and service layers** — no frontend or App Router changes (except the cron API route). It extends the existing Siraj storage subsystem without creating a parallel system.

```
Plan 6 (PDF Rendering) ──buffer──→ CertificateStorageService.saveCertificatePdf()
                                              │
                                    ┌─────────┼──────────────────┐
                                    ▼         ▼                  ▼
                          Provider upload   createFileAndGet    linkFileToCertificate
                          (local/GCP/Vercel) (storageFiles row) (certificateFiles junction)
```

```
Client (background upload) ──→ prepareUpload mutation ──→ signedUrls token ──→ PUT /api/storage/upload/{id}
                                                                                           │
                                                                    createFileAndGet + linkFileToTemplate
                                                                    (storageFiles row)   (certificateFiles junction)
```

### Data Flow — Certificate PDF Save

```
CertificateStorageService.saveCertificatePdf(certificateId, templateId, pdfBuffer, tx?)
  │
  ├─ 1. Validate buffer (non-empty, %PDF signature, ≤ 50MB)
  ├─ 2. Construct path: certificates/{templateId}/{certificateId}.pdf
  ├─ 3. getStorageService().uploadFile(filePath, buffer, "application/pdf")
  │      └─ Provider writes bytes (local: fs.writeFile; GCP: bucket.file().save(); Vercel: put())
  ├─ 4. StorageService.createFileAndGet(filePath, false)
  │      └─ Upsert into storageFiles (idempotent on path)
  ├─ 5. StorageDbRepository.linkFileToCertificate({ fileId, certificateId, usageType: "certificate_pdf", tx })
  │      └─ Insert into certificateFiles junction
  └─ 6. Return { filePath, fileId }
     └─ On error at step 5: compensating deleteFile (cleanup orphan bytes)
```

### Data Flow — Template Background Upload

```
Client ──→ prepareUpload GraphQL mutation (path, contentType, fileSize, contentHash)
               │
         existing storage flow (unchanged):
         │ validateUpload → create signedUrls token → return URL
         │
Client ──→ PUT /api/storage/upload/{token} (file bytes)
               │
         existing upload route (unchanged):
         │ claimSignedUrl (SKIP LOCKED) → validate headers → streamToFile → createFileAndGet
         │
CertificateStorageService.linkTemplateBackground(templateId, filePath, oldFilePath?)
  │
  ├─ 1. linkFileToTemplate({ templateId, fileId, usageType: "template_background" })
  ├─ 2. If oldFilePath exists: unregisterFileUsage(oldFilePath, "template_background", templateId)
  └─ 3. Return { filePath, fileId }
```

### Data Flow — Certificate Download

```
Client ──→ Certificate download mutation (Plan 5 GraphQL)
              │
         CertificateStorageService.generateDownloadUrl(certificateId, userId)
              │
         ├─ 1. Fetch certificate → check status (revoked → error)
         ├─ 2. checkUserAccessThroughEntity(userId, certificate)
         │      └─ super admin → allow
         │      └─ user_files ownership → allow
         │      └─ certificate ownership (student/parent/teacher) → allow
         │      └─ else → 403
         ├─ 3. Resolve provider:
         │      ├─ Local: return { url: `${baseUrl}/api/storage/files/${filePath}`, expiresAt: null }
         │      │         (auth handled by file serving route's checkFileAccess)
         │      ├─ GCP:   return { url: bucket.file(filePath).getSignedUrl(read, 15min), expiresAt }
         │      └─ Vercel: return { url: blob download URL, expiresAt }
         └─ 4. Return { url, expiresAt }
```

---

## 2. Design Decisions

### DD-07-01: Reuse Existing Storage Provider — No New Provider

**Decision**: Use the existing `getStorageService()` provider factory (`backend/storage/storage.service.ts`) — no certificate-specific storage provider.

**Rationale**: The existing system already supports `local`, `gcp`, `vercel` providers with a clean adapter pattern. Certificate files are just files at specific paths; they don't need a different storage backend.

**Alternative Considered**: A dedicated `CertificateStorageProvider` that wraps the existing one with certificate-specific path resolution. Rejected — it adds a layer without value; path conventions can be enforced in the service layer.

### DD-07-02: New `certificateFiles` Junction Table — Not Reusing `studentFiles`

**Decision**: Create a dedicated `certificateFiles` junction table with FK to `certificates.id`, following the existing 10-junction pattern (mirror of `studentFiles`, `invoiceFiles`, etc.).

**Rationale**: The analysis (siraj_analysis/07-storage-file-system.md §15) explicitly recommends: "Add a `certificate_files` junction in `backend/db/schema/storage/storage.ts` mirroring e.g. `studentFiles` (FK to new `certificates` table, `onDelete: cascade`)." This provides referential integrity (proper FK, cascade delete) that the CGVS polymorphic `file_usage` approach lacks.

**Alternative Considered**: Reusing the existing `studentFiles` junction with `usageType: "certificate_pdf"` to link certificate PDFs to students. Rejected — this would require the student row to exist at the time of linking and doesn't handle template background images (which are linked to templates, not students). A dedicated junction for `certificates` is cleaner.

### DD-07-03: Template Background Uses `certificateFiles` with `certificateId = NULL` Pattern — NO

**Decision**: Template background images are NOT stored in `certificateFiles`. Instead, they use a separate `certificateTemplateFiles` junction with FK to `certificateTemplates.id`.

**Rationale**: The `certificateFiles` junction FK references `certificates.id`. Template backgrounds belong to templates, not certificates. Mixing them in one junction would require a nullable `certificateId` plus a nullable `templateId`, which violates the clean one-entity-per-junction pattern. Following the existing convention (each entity gets its own junction), `certificateTemplateFiles` is the correct place.

**Updated Decision**: Two junction tables:
1. `certificateFiles` — links to `certificates` (for PDFs)
2. `certificateTemplateFiles` — links to `certificateTemplates` (for background images)

Both are added to the `ValidReferenceTable` union and the `performJunctionInsert` switch.

### DD-07-04: Download URLs — Local Uses Auth Route, GCP Uses Native Signed URLs

**Decision**: For local provider, download is handled by the existing `GET /api/storage/files/[[...path]]/route.ts` with auth + `checkFileAccess` (no new signed URL). For GCP, use native v4 signed URLs (15-min expiry).

**Rationale**: The file serving route already authenticates + checks access via `StorageService.checkFileAccess(userId, filePath)`. The `certificateFiles` junction row provides the ownership link for `checkFileAccess` to succeed. For GCP, the native signed URL is the standard pattern (already used for uploads). Creating a second `signedUrls`-table-based download system would duplicate auth logic.

**Alternative Considered**: Adding a download-specific `signedUrls` entry type. Rejected — `signedUrls` table is designed for upload tokens (with `contentHash` validation); download flows don't need hash verification and the existing file serving route already handles auth.

### DD-07-05: Certificate PDFs Stored as Non-Protected Files

**Decision**: `storageFiles.isProtected = false` for certificate PDFs. Access control is by junction ownership, not the `isProtected` flag.

**Rationale**: The analysis (siraj_analysis/07-storage-file-system.md §8) warns: "Certificate PDFs that should be per-user gated must NOT live under `public/` or `avatars/` and must have a `*_files` junction row so `checkFileAccess` can grant based on ownership." The `isProtected` flag is checked in the file serving route to decide whether to require auth. Since certificate PDFs live under `certificates/` (not under `public/`), the route's protected-path branch always requires auth and calls `checkFileAccess`. The junction row provides ownership.

### DD-07-06: File Cleanup — DB Row First, Bytes After

**Decision**: `cleanupOrphanedCertificateFiles()` first deletes the `storageFiles` row (which cascades to `certificateFiles` junction), then deletes the physical bytes via `getStorageService().deleteFile(filePath)`.

**Rationale**: Order matters for idempotency. If the DB row is deleted but the byte deletion fails, the next cleanup run will not find the row in `storageFiles` (so it won't try to delete again) — the orphaned bytes would persist. To handle this, a secondary scan of the storage provider's `certificates/` directory (via `listFiles`) can compare against `storageFiles` paths and delete any physical files without a DB row. This is a Phase 2 enhancement; the primary cleanup targets DB row orphans first.

### DD-07-07: Cron Endpoint Guarded by `cronSecret`

**Decision**: `POST /api/cron/storage-cleanup` requires `Authorization: Bearer ${cronSecret}` header matching the `CRON_SECRET` env var.

**Rationale**: Follows the existing pattern noted in the analysis (siraj_analysis/07-storage-file-system.md §9.4) — `cronSecret` is already in `backend/lib/env.ts` and guards cron endpoints. The certificate domain's cron endpoint should follow the same auth pattern. Plan 22 (Cron Jobs & Cleanup) handles the scheduling configuration (Vercel cron config or external scheduler).

---

## 3. Interface Contracts

### 3.1 `CertificateStorageService` Namespace

Location: `backend/services/storage/certificate-storage.service.ts`
Export: `namespace CertificateStorageService { ... }`

| Method Signature | Returns | Description |
|---|---|---|
| `saveCertificatePdf(certificateId: string, templateId: string, pdfBuffer: Buffer, tx?: DBTransaction)` | `Promise<{ filePath: string, fileId: string }>` | Validate PDF, upload bytes via provider, create `storageFiles` row, link to `certificateFiles` junction |
| `generateDownloadUrl(certificateId: string, userId: string)` | `Promise<{ url: string, expiresAt: Date | null }>` | Permission check + provider-specific download URL |
| `revokeCertificateFile(certificateId: string)` | `Promise<void>` | Mark certificate as revoked (does NOT delete file; blocks download) |
| `linkTemplateBackground(templateId: string, filePath: string, oldFilePath?: string)` | `Promise<{ fileId: string }>` | Link background image to template via `certificateTemplateFiles`; unregister old if provided |
| `unlinkTemplateBackground(templateId: string, filePath: string)` | `Promise<void>` | Unregister background image from template |
| `validateBackgroundImage(file: { mimeType: string, size: number })` | `{ valid: boolean, error?: string }` | Check MIME type (png/jpeg/webp) and size (≤ 10 MB) |
| `validatePdfBuffer(buffer: Buffer)` | `{ valid: boolean, error?: string }` | Check PDF signature (`%PDF`) and size (≤ 50 MB) |
| `requireTemplateManagePermission(userId: string, tErrors: TranslationErrors)` | `void` (throws on deny) | Delegate to `StorageService.requireStorageManage` pattern for `CERTIFICATES_TEMPLATES_MANAGE` |
| `checkCertificateFileAccess(userId: string, certificateId: string)` | `Promise<{ allowed: boolean, error?: string }>` | Extend `checkUserAccessThroughEntity` for certificate ownership |
| `getCertificateStorageStats()` | `Promise<{ totalFiles: number, totalSizeBytes: number, pdfCount: number, backgroundCount: number, orphanedCount: number }>` | Provider `storageStatistics` for `certificates/` prefix + orphan scan |
| `cleanupOrphanedCertificateFiles()` | `Promise<{ orphanedFilesDeleted: number }>` | Scan `storageFiles` under `certificates/` with no junction → delete row + bytes |

### 3.2 `StorageDbRepository` Extensions

Location: `backend/db/repo/storage/storage.repository.ts` (existing file, extended)

| Method Signature | Returns | Description |
|---|---|---|
| `linkFileToCertificate(input: { fileId: string, certificateId: string, usageType: string }, tx?: DBTransaction)` | `Promise<CertificateFileSelectType>` | Insert into `certificateFiles` junction |
| `linkFileToTemplate(input: { fileId: string, templateId: string, usageType: string }, tx?: DBTransaction)` | `Promise<CertificateTemplateFileSelectType>` | Insert into `certificateTemplateFiles` junction |
| `getCertificateFiles(certificateId: string, usageType?: string, tx?: DBTransaction)` | `Promise<LinkedFileReturnType[]>` | Join `certificateFiles` ⨝ `storageFiles` |
| `getTemplateFiles(templateId: string, usageType?: string, tx?: DBTransaction)` | `Promise<LinkedFileReturnType[]>` | Join `certificateTemplateFiles` ⨝ `storageFiles` |
| `fetchCertificateUsages(filePath: string)` | `Promise<FileUsageInfo[]>` | Fan-out query for `getFileUsages` (certificate arm) |
| `fetchCertificateTemplateUsages(filePath: string)` | `Promise<FileUsageInfo[]>` | Fan-out query for `getFileUsages` (template arm) |

Existing methods that are EXTENDED (not new):
- `getFileUsages` — add `fetchCertificateUsages` + `fetchCertificateTemplateUsages` to the parallel fan-out
- `isFileInUse` — add `UNION ALL` arm for `certificateFiles` + `certificateTemplateFiles`
- `registerFileUsage` — add `case "certificates"` and `case "certificate_templates"` to `performJunctionInsert` switch
- `unregisterFileUsage` — add `certificateFiles` + `certificateTemplateFiles` to `deleteUsagesFromAllTables`
- `cleanupExpiredFiles` — add `certificateFiles` + `certificateTemplateFiles` to the 12-way LEFT JOIN

### 3.3 `ValidReferenceTable` Union Extension

Location: `backend/types/storage/storage.types.ts` (existing file, extended)

The `ValidReferenceTable` union type is extended to include `"certificates"` and `"certificate_templates"`. This is a type-only change; it affects:
- `registerFileUsage` input type
- `FileUsageInfo.referenceTable` output type
- `performJunctionInsert` switch exhaustiveness

### 3.4 Types

Location: `backend/types/certificates/certificate-storage.types.ts` (new file)

| Type Name | Source |
|---|---|
| `CertificateFileSelectType` | `$inferSelect` from `certificateFiles` schema |
| `CertificateFileInsertType` | `$inferInsert` from `certificateFiles` schema |
| `CertificateTemplateFileSelectType` | `$inferSelect` from `certificateTemplateFiles` schema |
| `CertificateTemplateFileInsertType` | `$inferInsert` from `certificateTemplateFiles` schema |
| `CertificateStorageStats` | `{ totalFiles: number, totalSizeBytes: number, pdfCount: number, backgroundCount: number, orphanedCount: number }` |
| `CertificateDownloadUrlResult` | `{ url: string, expiresAt: Date | null }` |
| `BackgroundImageValidation` | `{ valid: boolean, error?: string }` |
| `PdfBufferValidation` | `{ valid: boolean, error?: string }` |

---

## 4. Storage Directory Structure

```
<LOCAL_STORAGE_PATH or GCP_BUCKET_ROOT>/
└── certificates/
    ├── templates/
    │   └── {templateId}/
    │       └── background.{ext}          ← PNG/JPEG/WebP (max 10 MB)
    └── {templateId}/
        └── {certificateId}.pdf            ← PDF (max 50 MB)
```

### Path Conventions

| File Type | Path Pattern | MIME Type | Max Size | Junction | `usageType` |
|-----------|-------------|-----------|----------|----------|-------------|
| Certificate PDF | `certificates/{templateId}/{certificateId}.pdf` | `application/pdf` | 50 MB | `certificateFiles` | `"certificate_pdf"` |
| Template background | `certificates/templates/{templateId}/background.{ext}` | `image/png`, `image/jpeg`, `image/webp` | 10 MB | `certificateTemplateFiles` | `"template_background"` |

### Path Construction Rules

- All path segments use UUID values from database IDs — no user-supplied names, no sanitization needed (UUIDs are safe path segments)
- The `certificates/` prefix is the root of the certificate storage namespace — everything under it is certificate-domain
- Files under `certificates/` are NOT under `public/` — they go through the auth-protected branch of the file serving route
- The template ID is used as a subdirectory for certificate PDFs so re-renders replace files in place (same path → `onConflictDoUpdate` keeps the same `storageFiles` row)

---

## 5. Signed URL Lifecycle

### Upload Signed URLs (Existing — Reused for Background Images)

```
1. Client calls prepareUpload mutation (path, contentType, fileSize, contentHash)
2. Service: validateUpload → SignedUrlRepository.createSignedUrl (15-min expiry)
3. Service returns { id, url, uploadType }
   ├─ Local: url = `${baseUrl}/api/storage/upload/${id}`
   ├─ GCP: url = native GCS v4 signed URL
   └─ Vercel: url = `${baseUrl}/api/storage/vercel-upload`
4. Client PUTs file to url (with Content-Type, Content-MD5 headers)
5. Route: claimSignedUrl (SELECT FOR UPDATE SKIP LOCKED) → validate headers → streamToFile → createFileAndGet
6. Token marked `used = true` atomically
7. Lazy cleanup: if strategy is "lazy" or "both", deleteExpired runs during next prepareUpload
```

### Download URLs (New — Certificate Specific)

```
1. Client calls certificate download mutation (certificateId)
2. CertificateStorageService.generateDownloadUrl(certificateId, userId)
   ├─ Check certificate status (revoked → error)
   ├─ checkCertificateFileAccess(userId, certificateId)
   └─ Resolve provider:
      ├─ Local: return { url: `${baseUrl}/api/storage/files/${filePath}`, expiresAt: null }
      │         (auth by file serving route's checkFileAccess via certificateFiles junction)
      ├─ GCP: return { url: bucket.file(filePath).getSignedUrl({ action: "read", expires: <now + 15min> }), expiresAt }
      └─ Vercel: return { url: blob.url, expiresAt }
3. Client fetches URL → receives PDF bytes
4. For GCP/Vercel: URL expires after 15 min (configurable via CERTIFICATE_DOWNLOAD_URL_DURATION)
5. For local: URL does not expire (auth is per-request), but certificate status is checked each time
```

### Revocation

- `revokeCertificateFile(certificateId)` does NOT delete the file or the signed URL
- It sets `certificate.status = "revoked"` (handled by Plan 4's certificate service)
- `generateDownloadUrl` checks status before returning any URL — revoked certificates produce an error, not a URL
- For GCP/Vercel, an already-issued signed URL cannot be revoked (it lives until expiry); the 15-min window is the maximum exposure. If immediate revocation is needed, the `storageFiles` row can be deleted (oranges the junction → `checkFileAccess` fails)

---

## 6. Cleanup Strategy

### Three Cleanup Mechanisms

| Mechanism | Trigger | What It Cleans | Scope |
|-----------|---------|---------------|-------|
| Lazy signed-URL GC | During each `prepareUpload` call (if strategy = `lazy` or `both`) | Expired `signedUrls` rows | All domains (unchanged) |
| Cron: signed-URL GC | `POST /api/cron/storage-cleanup` (guarded by `cronSecret`) | Expired `signedUrls` rows | All domains |
| Cron: orphan file GC | `POST /api/cron/storage-cleanup` | `storageFiles` rows with no junction in ANY of the 12 junction tables | All domains (includes `certificateFiles` + `certificateTemplateFiles`) |

### Orphan Detection Logic

```
cleanupExpiredFiles() (extended):
  SELECT sf.* FROM storageFiles sf
  LEFT JOIN user_files uf ON uf.fileId = sf.id
  LEFT JOIN teacher_files tf ON tf.fileId = sf.id
  ... (all existing 10 junctions) ...
  LEFT JOIN certificate_files cf ON cf.fileId = sf.id
  LEFT JOIN certificate_template_files ctf ON ctf.fileId = sf.id
  WHERE uf.id IS NULL
    AND tf.id IS NULL
    ... AND all existing junctions NULL ...
    AND cf.id IS NULL
    AND ctf.id IS NULL
  → DELETE matching storageFiles rows
```

### `cleanupOrphanedCertificateFiles()` (Certificate-Specific)

```
1. Query storageFiles WHERE path LIKE 'certificates/%'
2. For each row: check if certificateFiles OR certificateTemplateFiles junction exists
3. If NO junction exists: delete storageFiles row (cascade deletes junction rows if any), then delete bytes
4. Return { orphanedFilesDeleted: count }
```

This is a narrower scan than `cleanupExpiredFiles()` — it only looks at `certificates/` prefix rather than the entire `storageFiles` table. It is called by the cron endpoint alongside `cleanupExpiredFiles()`.

### Env Switches

| Env Var | Values | Effect |
|---------|--------|--------|
| `SIGNED_URL_CLEANUP_STRATEGY` | `lazy` (default), `cron`, `both`, `disabled` | Controls signed-URL cleanup mechanism |
| `CLEANUP_ENABLED` | `true` (default), `false` | Global switch for cleanup cron endpoint; if false, endpoint returns 200 without cleanup |
| `CRON_SECRET` | string (required) | Authentication for cron endpoints |
| `CERTIFICATE_DOWNLOAD_URL_DURATION` | number (minutes, default 15) | GCP/Vercel signed download URL expiry |

---

## 7. Permission Model

### Upload Permissions

| Operation | Required Permission | Check Location |
|-----------|-------------------|----------------|
| Template background upload | `CERTIFICATES_TEMPLATES_MANAGE` | `CertificateStorageService.requireTemplateManagePermission` |
| Certificate PDF save (from rendering) | Internal (trusted context) | Plan 4 generation pipeline already checks `CERTIFICATES_GENERATE` |

### Download Permissions

`checkCertificateFileAccess(userId, certificateId)` resolves in order:

1. Super admin → allow
2. `user_files` row with `userId` → allow (direct user ownership of the file)
3. Certificate's student is the user's child (parent relationship) → allow
4. Certificate's student is taught by the user (teacher relationship) → allow
5. Certificate's student IS the user (student account) → allow
6. Otherwise → deny (403)

### Implementation Note

The existing `StorageService.checkFileAccess(userId, filePath)` already checks steps 1-2. Steps 3-5 require extending `checkUserAccessThroughEntity` to include the certificate → student → parent/teacher/self relationship chain. This extension lives in `CertificateStorageService`, not in the generic `StorageService`, to avoid coupling generic storage with certificate-domain entity relationships.

---

## 8. Integration Points

### Plan 1 (DB Schema & Enums) — Dependency

- `certificateFiles` and `certificateTemplateFiles` junction tables must be defined in `backend/db/schema/certificates/` (Plan 1 scope) or `backend/db/schema/storage/` (this plan adds them to the storage schema barrel)
- The tables follow the exact shape of existing junctions: `{ id, fileId, certificateId|templateId, usageType, createdAt }`

### Plan 3 (Repository Layer) — Dependency

- `StorageDbRepository` extensions (junction insert, fan-out, cleanup) are part of this plan but touch the existing `storage.repository.ts`
- The `ValidReferenceTable` union extension is a type change in `backend/types/storage/storage.types.ts` (Plan 2 scope) — this plan defines the requirement; Plan 2 implements the type

### Plan 4 (Services & Business Logic) — Dependency

- `CertificateService.generateCertificate` calls `CertificateStorageService.saveCertificatePdf`
- `CertificateService.revokeCertificate` calls `CertificateStorageService.revokeCertificateFile`
- `CertificateService.deleteCertificate` (hard delete) relies on `certificateFiles` `onDelete: cascade`
- `TemplateService.updateTemplate` calls `CertificateStorageService.linkTemplateBackground` / `unlinkTemplateBackground`

### Plan 6 (PDF Rendering Engine) — Integration

- Plan 6's rendering engine produces a `Buffer` and passes it to `CertificateStorageService.saveCertificatePdf`
- The contract: `saveCertificatePdf(certificateId, templateId, pdfBuffer, tx?) → { filePath, fileId }`
- No file-system path knowledge leaks to Plan 6 — the path convention is owned by this plan

### Plan 22 (Cron Jobs & Cleanup) — Integration

- This plan creates the `POST /api/cron/storage-cleanup` endpoint and service methods
- Plan 22 wires the scheduling (Vercel cron config or external scheduler) to call this endpoint
- Plan 22 may also add additional cron logic (expired certificate detection, etc.)

---

## 9. Error Handling Strategy

### Error Categories

| Category | Example | Handling |
|----------|---------|---------|
| Validation error | PDF too large, invalid MIME type | Throw localized `CertificateStorageError` with i18n error key; caller (GraphQL resolver or service) translates |
| Permission error | User not authorized to download | Throw `ForbiddenError` with `errors.certificates.storage.permissionDenied` |
| Not found error | Certificate or template not found | Throw `NotFoundError` with `errors.certificates.storage.certificateNotFound` or `templateNotFound` |
| Provider error | Upload fail, provider unavailable | Throw `StorageProviderError` with `errors.certificates.storage.storageProviderError`; log full error via `logger.error` |
| Cleanup error | File deletion fail | Log warning via `logger.warn`; do not throw (cleanup is best-effort) |

### Compensating Actions

| Scenario | Compensating Action |
|----------|-------------------|
| Provider upload succeeds, `createFileAndGet` fails | `getStorageService().deleteFile(filePath)` — delete orphaned bytes |
| Provider upload succeeds, `linkFileToCertificate` fails | `getStorageService().deleteFile(filePath)` + `StorageDbRepository.deleteFile(filePath)` — delete bytes + DB row |
| Batch cleanup: some files deleted, some fail | Per-file try/catch; failures logged as warnings; successful deletions are still committed |

### Error Class Hierarchy

```
CertificateStorageError (new)
├── CertificateUploadError
├── CertificateDownloadError
├── CertificatePermissionError
└── CertificateCleanupError
```

All errors carry an `i18nKey: string` property that resolves to the `errors.certificates.storage.*` keys defined in the i18n catalog.

---

## 10. i18n Design

### Namespace Structure

```
Translation
└── Dashboard
    └── Certificates
        └── Storage
            ├── pageTitle
            ├── uploadBackground.*
            ├── download.*
            ├── fileLabels.*
            ├── cleanup.*
            ├── stats.*
            └── errors.*
```

### Server-Side Access

| Context | Import | Function |
|---------|--------|----------|
| Service layer | `@/shared/locale/server-graphql` | `getServerTranslations(locale).dashboardTranslations.certificateStorage` |
| Cron API route | `@/shared/locale/server-graphql` | `getServerTranslations(locale).dashboardTranslations.certificateStorage` |
| GraphQL resolvers (Plan 5) | `ctx.t()` | `ctx.t().errorsTranslations.certificates.storage` |

### Pluralization Implementation

Arabic pluralization follows the standard 6-form rule (zero/one/two/few/many/other), defined as `(count: number) => string` in the type file and implemented with conditional returns in the locale files. English uses the standard 2-form (one/other).

All count-based keys return fully-formed strings — the caller does not need to select a plural form; the translation function handles it internally.

---

## 11. Component/Data Model References

### Tables Touched

| Table | Action | Plan |
|-------|--------|------|
| `storageFiles` | Read + upsert (existing) | 07 |
| `certificateFiles` | Create (new) | 01 schema + 07 usage |
| `certificateTemplateFiles` | Create (new) | 01 schema + 07 usage |
| `signedUrls` | Read + create (existing, for background upload) | 07 |
| `certificates` | Read (status check for download) | 04 |
| `certificateTemplates` | Read (for background validation) | 04 |

### Files Created/Modified

| File | Action | Layer |
|------|--------|-------|
| `backend/db/schema/storage/storage.ts` | Modified — add `certificateFiles` + `certificateTemplateFiles` tables | Schema |
| `backend/db/schema/storage/drizzleRelations.ts` | Modified — add relations for new junctions | Schema |
| `backend/types/storage/storage.types.ts` | Modified — extend `ValidReferenceTable` union | Types |
| `backend/types/certificates/certificate-storage.types.ts` | New — storage-specific type definitions | Types |
| `backend/db/repo/storage/storage.repository.ts` | Modified — extend junction fan-out, insert switch, cleanup JOIN | Repository |
| `backend/services/storage/certificate-storage.service.ts` | New — certificate storage service namespace | Services |
| `backend/services/storage/storage.service.ts` | Modified — `checkUserAccessThroughEntity` extension for certificates | Services |
| `app/api/cron/storage-cleanup/route.ts` | New — cron endpoint for cleanup | API Route |
| `shared/locale/types/dashboard/certificates/storage.ts` | New — i18n type file | Shared |
| `shared/locale/namespaces/dashboard/certificates/storage.namespace.ts` | New — i18n namespace | Shared |
| `shared/locale/ar/dashboard/certificates/storage.ts` | New — Arabic translations | Shared |
| `shared/locale/en/dashboard/certificates/storage.ts` | New — English translations | Shared |

### AGENTS.md & Instruction Files

| File Layer | AGENTS.md | Instruction File |
|------------|-----------|-------------------|
| `backend/db/schema/**` | `backend/db/repo/AGENTS.md` (schema patterns), root `AGENTS.md` | `backend.instructions.md` |
| `backend/types/**` | `backend/types/AGENTS.md` | `backend.instructions.md` |
| `backend/db/repo/**` | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/services/**` | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `app/api/**` | `app/AGENTS.md` | `frontend.instructions.md` (app router) |
| `shared/locale/**` | `shared/AGENTS.md` | N/A (shared layer) |

---

## 12. Outcome & Knowledge Transfer Protocol

### Documentation to Create/Update

| Document | Content |
|----------|---------|
| `docs/storage/adding-entity-to-storage.md` | Step-by-step recipe for adding a new entity to the storage junction fan-out (table, union, switch, fan-out, cleanup JOIN) |
| `docs/storage/certificate-storage-conventions.md` | Path conventions, MIME/size limits, download URL lifecycle for certificate domain |
| `backend/services/storage/AGENTS.md` | Update with `CertificateStorageService` namespace description |

### Knowledge Propagation

- The `ValidReferenceTable` union extension pattern is reusable for any future entity that needs file ownership
- The `checkUserAccessThroughEntity` extension pattern (student → parent/teacher → certificate access chain) is documented for future entity relationship access control
- The cron endpoint pattern (cronSecret guard, CLEANUP_ENABLED switch, SIGNED_URL_CLEANUP_STRATEGY) is documented as a reference for Plan 22 and future cron jobs

### Cross-Plan Documentation Dependencies

- Plan 22 (Cron Jobs & Cleanup) references this plan's `/api/cron/storage-cleanup` endpoint for scheduling configuration
- Plan 18 (Certificate Detail & Download) references `CertificateStorageService.generateDownloadUrl` for the download button flow
- Plan 10 (Template Editor Basic Info) references `linkTemplateBackground` for the background image upload UI

---

## Reality Check Notes

> Audit performed against the live codebase at `/home/ahmed/Projects/siraj-cert/` (2026-08-02). Corrections applied to `requirements.md` and `tasks.md`; findings are summarised here.

### Verified Against Actual Codebase

| Check | Reference (actual codebase) | Plan Alignment |
|-------|------------------------------|----------------|
| `storageFiles` + junction-table schema pattern | `backend/db/schema/storage/storage.ts:11-209` — `storageFiles`, `userFiles`, `teacherFiles`, `studentFiles`, `parentFiles`, `invoiceFiles`, `complaintFiles`, `learningResourceFiles`, `staffProfileFiles`, `recurringScheduleFiles`, `classInstanceFiles`; `signedUrls:231-250`; `storageDirectories:211-229` | ✅ Plan's `certificateFiles`/`certificateTemplateFiles` junction shape mirrors the existing junctions (`{ id, fileId, <entityId>, usageType, createdAt }` with `onDelete: "cascade"` on both FKs). |
| Repository: `getFileUsages` parallel fan-out | `backend/db/repo/storage/storage.repository.ts:183-311` (`fetchPersonUsages`/`fetchContentUsages`/`fetchSystemUsages` + `mapRowToUsage`) | ✅ Plan's `fetchCertificateUsages`/`fetchCertificateTemplateUsages` addition matches the `fetchXxxUsages` + `mapRowToUsage` pattern. |
| Repository: `isFileInUse` `UNION ALL` existence query | `backend/db/schema/storage/storage.repository.ts:329-348` — keys on `file_id` (resolved from `storageFiles` by path first); **10 arms** currently | ✅ Plan now correctly says add one `UNION ALL` arm per cert junction (→ 12 arms total). |
| Repository: `registerFileUsage` / `performJunctionInsert` switch | `backend/db/repo/storage/storage.repository.ts:350-428` — exhaustive `switch (table)` keyed by `ValidReferenceTable` values | ✅ Plan's `case "certificates"` / `case "certificate_templates"` additions match. |
| Repository: `unregisterFileUsage` / `deleteUsagesFromAllTables` | `backend/db/repo/storage/storage.repository.ts:430-549` | ✅ Plan extension matches. |
| Repository: `cleanupExpiredFiles` | `backend/db/repo/storage/storage.repository.ts:779-821` — **10-way LEFT JOIN** (`storageFiles` LEFT JOIN 10 junctions); deletes rows with NULL FKs across all junctions | ✅ Plan corrected: after adding the two cert junctions → **12-way LEFT JOIN** (was previously mis-stated as "11-way"; design.md already said "12-way"). |
| Repository: `linkFileToInvoice` / `linkFileToParent` helpers | `backend/db/repo/storage/storage.repository.ts:703-745` — `linkFileToParent`, `linkFileToInvoice` using `tx ?? db` and `.returning()` | ✅ Plan's `linkFileToCertificate` / `linkFileToTemplate` follow the same pattern. |
| Repository: `getFilesForInvoice` / `getFilesForParent` reads | `backend/db/repo/storage/storage.repository.ts:637-701` — `queryDb(tx)` + `.innerJoin(storageFiles, ...)` projecting `LinkedFileReturnType` | ✅ Plan's `getCertificateFiles` / `getTemplateFiles` follow the same pattern. |
| `ValidReferenceTable` union (entity set) | `backend/types/storage/storage.types.ts:30-41` — 11 members (10 entities + `"storageFiles"`) | ✅ Plan's extension to add `"certificates"` and `"certificate_templates"` is consistent. |
| Service layer: `StorageService.*` | `backend/services/storage/storage.service.ts` (`validateUpload`, `createFileAndGet`, `linkFileToEntity` → `registerFileUsage`, `getFileUsages`, `getFilesForInvoice`, `checkFileAccess`, `checkUserAccessThroughEntity`, `cleanupExpiredFiles`, `cleanupExpiredSignedUrls`) | ✅ All method names referenced by the plan exist; `CertificateStorageService` namespace addition is consistent. |
| Storage provider abstraction | `backend/storage/storage.service.ts` (`getStorageService()` singleton), `backend/storage/disk/storage.service.interface.ts` (interface incl. `uploadFile(path, contentType, buffer)`, `prepareUpload`, `deleteFile`), adapters: `backend/storage/disk/{local,gcp,vercel}/`; `getStorageProvider()` in `backend/storage/storage.service.ts:11-29` returns one of `"gcp"\|"local"\|"vercel"\|"s3"\|"r2"` (s3/r2 throw "not implemented") | ✅ Plan's "uploadFile via the active storage provider" and "Full storage provider adapters (local/GCP/Vercel — already implemented)" are accurate. |
| `MAX_FILE_SIZE` constant | `backend/storage/disk/storage.service.interface.ts:99` — `100 * 1024 * 1024` (100 MB); `validateUpload` enforces it (`storage.repository.ts:751-773`) | ✅ Plan correctly keeps the 100 MB global cap and adds per-domain limits (PDF 50 MB, background 10 MB). |
| Signed URL config | `backend/storage/disk/storage.service.interface.ts:98` — `SIGNED_URL_DURATION: 15` (minutes) | ✅ Plan's 15-min default matches. |
| Packages (storage-related) | `package.json` — `@google-cloud/storage`, `sharp`, `@pdfme/*`, `pdf-lib`, `@pdf-lib/fontkit`; **no `multer`, no `aws-sdk`** | ✅ Plan does not reference multer/aws-sdk (correct — they are not used). |

### Corrections Made During Reality Check

1. **`requirements.md` line 90 (REQ-07-04)** — The plan's `isFileInUse` description said `SELECT 1 FROM certificate_files WHERE file_path = $1 LIMIT 1`. The actual `isFileInUse` implementation (`storage.repository.ts:329-348`) first resolves `file.id` from `storageFiles` by `filePath`, then keys every `UNION ALL` arm on `file_id` (junction tables have no `file_path` column). Corrected to `SELECT 1 FROM certificate_files WHERE file_id = $fileId LIMIT 1` with an explanatory note.
2. **`requirements.md` lines 93 & 134 (REQ-07-04 / REQ-07-07)** — Said "11-way LEFT JOIN". The current `cleanupExpiredFiles` is a **10-way LEFT JOIN** (`storageFiles` LEFT JOIN the 10 existing junctions). After extending with `certificateFiles` **and** `certificateTemplateFiles`, it becomes a **12-way** LEFT JOIN (matching what `design.md` §6 already correctly stated). Corrected both occurrences to "12-way".
3. **`tasks.md` T-07-01 step 3 + Files list + Quality-loop lint payload** — Referenced creating/modifying `backend/db/schema/storage/drizzleRelations.ts` and adding Drizzle `relations()` definitions. **This file/convention does not exist in the codebase** — no `*.relations.ts` files and no use of Drizzle's `.relations()` API anywhere in `backend/db/`. The existing storage repository joins junction tables to `storageFiles` explicitly via `.innerJoin()` / `.leftJoin()` per query (see `getFilesForInvoice`, `getFileUsages`, `cleanupExpiredFiles`). The task was rewritten to remove the relations-file step and instead wire the new junctions into queries the same explicit-join way (matching reality). The "Modify `drizzleRelations.ts`" line was removed from the Files list and the lint payload was trimmed to exclude it.

### Notes (no correction needed)

- The plan re-uses the existing `prepareUpload` → `signedUrls` token → `PUT /api/storage/upload/{id}` upload flow for background images and adds a certificate-specific **download** URL mutation; this aligns with the existing `prepareUpload` mutation and `signedUrls` machinery (`backend/graphql/mutation/storage/storage.mutation.ts`, `signedUrls` table).
- The `checkUserAccessThroughEntity` extension (REQ-07-09) is consistent with the existing `checkUserAccessThroughEntity` helper in `backend/services/storage/storage.service.ts:153-166` (currently handles `teachers`/`parents`; plan adds `certificates` ownership via the student→certificate→user relationship).
- i18n: this is a backend/storage-domain plan; it correctly reuses existing `getServerTranslations(locale).errorsTranslations` patterns (no frontend namespace additions required beyond what other plans cover).

---

## SWE Expert Review Notes

> Expert SWE architectural review (2026-08-02) over and above the existing "Reality Check Notes". This section records *architectural judgment* findings (design gaps, risks, recommended fixes), not path corrections — paths were already validated in the Reality Check Notes above.

### A. Architectural Soundness

1. **Multi-provider abstraction — CORRECT.** Plan correctly reuses `getStorageService()` / the `StorageService` interface (`backend/storage/disk/storage.service.interface.ts`: `uploadFile`, `deleteFile`, `prepareUpload`, `listFiles`, `storageStatistics`) and the `local`/`gcp`/`vercel` adapters. No parallel storage system is introduced. ✅ Sound.
2. **Signed URLs — SECURE WITH ONE GAP.** GCP native v4 signed URL with 15-min expiry is correct and matches `SIGNED_URL_DURATION: 15`. The Local-provider download path reuses the existing auth-gated `GET /api/storage/files/[[...path]]` route with `checkFileAccess` — this is the right call (no download-side `signedUrls` row needed). **Gap:** the design does not state the *minimum* expiry or a floor (a misconfigured `CERTIFICATE_DOWNLOAD_URL_DURATION=0` or negative value could mint instantly-expired or never-expiring URLs). **Fix:** add a server-side clamp in `generateDownloadUrl`, e.g. `duration = clamp(env, 1, 60)` minutes, and reject values outside the range. Document the clamp in DD-07-04.
3. **File deduplication — NOT HANDLED.** The `signedUrls` table already stores `contentHash` (used for upload-integrity verification), but neither the existing system nor this plan deduplicates bytes by hash. Certificate PDFs are content-addressable *by ID* (path = `{templateId}/{certificateId}.pdf`), so PDF re-renders overwrite in place — which is effectively dedup-by-path, not dedup-by-content. **Risk:** background images uploaded via `prepareUpload` can be re-uploaded as distinct `storageFiles` rows even when byte-identical. **Recommendation (not blocking):** before `linkTemplateBackground`, query `storageFiles` by `contentHash` from the `signedUrls` claim; if an identical-hash row exists under `certificates/templates/`, reuse it and skip the upload write. This is a Phase-2 optimization; document it as a known limitation in `docs/storage/certificate-storage-conventions.md`.
4. **Category tree data structure (Plan 09 cross-ref) — adjacency list is the correct choice** for this plan's storage paths (the storage plan does not touch categories). No action here.

### B. Completeness Gaps

5. **Image dimension validation — MISSING.** REQ-07-02 / REQ-07-09 validate MIME type and size for background images but do **not** specify pixel dimensions or aspect ratio. A 10 MB PNG that is 50,000×50,000 px will pass validation but blow up Puppeteer render memory (Plan 6) and the card thumbnail (Plan 8). **Fix:** add an可选 dimension check in `CertificateStorageService.validateBackgroundImage` — recommended bounds: min 100×100 px, max 8192×8192 px, and warn (not reject) if aspect ratio diverges from the template orientation. Plan 6 owns the actual decode; this plan should at minimum cap `maxDimension`. Use `sharp` (already in `package.json`) for a fast metadata-only read.
6. **Storage-full behavior — UNDEFINED.** REQ-07-09 caps per-file size but does not state what happens when the provider rejects an upload because the bucket/disk is full. **Fix:** map provider "out of space" errors (GCP: quota exceeded; local: `ENOSPC`; Vercel: store limit) to a distinct localized error `errors.certificates.storage.storageFull` and a clear compensating-action path (the existing `deleteFile` cleanup is correct for orphan bytes, but the user-facing error must be specific, not the generic `storageProviderError`).
7. **Orphan cleanup — bytes-vs-DB-row ordering risk is ACKNOWLEDGED.** DD-07-06 correctly identifies that DB-row-first cleanup leaves orphan bytes if byte deletion fails. The "Phase 2 enhancement" of provider `listFiles` reconciliation is the right long-term fix. **Strengthening recommendation:** make the byte-deletion failure non-fatal but **re-queue** the path into a `storage_orphan_bytes` scratch table (or reuse the existing `signedUrls` style) so the next cron sweep re-attempts the byte delete — otherwise orphans silently accumulate. At minimum, log `filePath` + `error` at `WARN` so they are discoverable (the plan says `logger.warn` — good).

### C. Security

8. **`checkUserAccessThroughEntity` extension is SOUND but the chain is understudied.** The plan extends the existing helper (`storage.service.ts:153-166`, currently only `teachers`/`parents`) to add certificate→student→parent/teacher/self. **Risk:** the certificate ownership chain requires joining `certificates` → `students` → `parents`/`teachers` → `users`. The existing helper resolves a *single* entity type per call; the certificate path needs **two hops** (cert→student, then student→parent/teacher). **Fix:** specify that `checkCertificateFileAccess` is a *new* method on `CertificateStorageService` (not a generic extension of the 2-hop `checkUserAccessThroughEntity`), and that it performs the resolution in one query (cert⨝student⨝parent/teacher⨝user) rather than reusing the single-hop helper. The design.md §3.1 already lists `checkCertificateFileAccess` as a separate method — good — but REQ-07-06 step 3 wording ("If `certificateFiles` has a row and the user owns the student") implies the junction row alone is the ownership proof. **Clarify:** the junction proves the *file* belongs to the *certificate*; the *student→user* relationship proves the *user* may access that certificate. These are two separate checks.
9. **Super-admin short-circuit — CORRECT.** Step 1 of `checkFileAccess` allows super admin; this matches the existing code (`PermissionsService.getUserContext(...).isSuperAdmin`).
10. **Revocation & already-issued signed URLs — acknowledged risk, 15-min window is the mitigation.** DD-07-04 / §5 correctly note GCP signed URLs cannot be revoked before expiry and rely on the 15-min window + deleting the `storageFiles` row for immediate revoke. **Strengthening:** document that the *default* `CERTIFICATE_DOWNLOAD_URL_DURATION` for GCP should remain 15 min (not be raised) precisely because of this irrevocability; if longer windows are needed, prefer the Local-provider-style auth-gated proxy URL.

### D. GraphQL / API Surface

11. **No GraphQL surface in this plan** (correct — Plan 5 owns resolvers; this plan owns the service + cron route). The design correctly lists the *consumed* service methods and the new cron endpoint. No issues.

### E. i18n

12. **Arabic pluralization — CORRECT and complete.** §4.3 provides the 6-form table for all count keys; §4.4 lists interpolation params with types. Matches the `shared/locale/` compile-time pattern. ✅
13. **Missing key: `errors.storageFull`.** See finding #6 — add it to §4.2 / §4.5 catalogs in `requirements.md` and to the type schema in `tasks.md`.
14. **Missing key: `errors.imageDimensionsInvalid`.** See finding #5 — add a `(min:number, max:number) => string` or `(detail: string) => string` key for dimension-rejection messages.

### F. State Management / Frontend

15. **N/A for this plan** — Plan 07 is backend + one cron route; no Zustand store. No findings.

### Key Fixes (applied to this design.md as recommendations; requirements.md/tasks.md should be updated to match)

- **F-07-1:** Add a clamp on `CERTIFICATE_DOWNLOAD_URL_DURATION` (1–60 min) in `generateDownloadUrl` and document in DD-07-04.
- **F-07-2:** Add optional image dimension bounds to `validateBackgroundImage` (≤ 8192 px on the longest side) via `sharp` metadata read.
- **F-07-3:** Add `errors.certificates.storage.storageFull` localized error and map provider quota/`ENOSPC` errors to it.
- **F-07-4:** Clarify in REQ-07-06 that `checkCertificateFileAccess` is a dedicated two-hop resolver (cert→student→user), not an overload of the single-hop `checkUserAccessThroughEntity`, and that the `certificateFiles` junction row proves file↔certificate linkage while a *separate* student→user query proves user↔certificate access.
- **F-07-5:** (Non-blocking) Document dedup-by-`contentHash` as a known Phase-2 gap for background images.

### Reality-Check Corrections to the Plan's Own Claims

- The plan's Reality Check Notes (line 558) correctly notes the codebase has **no** `drizzleRelations.ts` / `.relations()` API — joins are explicit `.innerJoin()/.leftJoin()`. ✅ Verified against `backend/db/repo/storage/storage.repository.ts` (e.g. `getFilesForInvoice`, `cleanupExpiredFiles`). No further correction needed.
- `ValidReferenceTable` union currently has **11 members** (10 entities + `"storageFiles"`), confirmed at `backend/types/storage/storage.types.ts:30-41`. Plan's extension to add `"certificates"` + `"certificate_templates"` → 13 members. ✅ Consistent.
- `cleanupExpiredFiles` is currently a **10-way LEFT JOIN** (confirmed at `storage.repository.ts:779-821`); plan correctly extends to 12-way. ✅ The "11-way" typo was already fixed in the Reality Check Notes.

### Remaining Risks

- **R-07-1:** The 15-min GCP signed-URL window is the *only* revocation mechanism for already-minted download URLs. If a longer `CERTIFICATE_DOWNLOAD_URL_DURATION` is configured, revoked-but-downloaded-within-window certificates remain downloadable. Mitigate by never raising the default and by deleting the `storageFiles` row on revocation when immediate revoke is required.
- **R-07-2:** Orphan-bytes accumulation when `deleteFile` fails after the `storageFiles` row is gone (DD-07-06 acknowledged). The Phase-2 `listFiles` reconciliation is the only true fix.
- **R-07-3:** No transaction spans provider-upload + DB-row + junction-insert today (the `tx?` param only covers the DB side). A crash between provider upload and `createFileAndGet` leaves orphan bytes with no DB row — caught by `cleanupOrphanedCertificateFiles`, but only on next cron sweep. Acceptable for a generation pipeline; document the window.
- **R-07-4:** `validatePath` in the existing `StorageService` (line 233) blocks `..`, leading `/`, leading `~`. Certificate paths are UUID-based so this is not exploitable, but the plan should note that `saveCertificatePdf` must **never** accept a caller-supplied path segment — only `certificateId`/`templateId` UUIDs that the service itself interpolates.
