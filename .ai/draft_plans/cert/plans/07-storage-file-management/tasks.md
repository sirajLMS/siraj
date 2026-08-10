# Tasks — Plan 07: Storage & File Management

> **Plan**: 07 — Storage & File Management
> **Depends On**: Plan 4 (Services & Business Logic)
> **Related Docs**: MASTER_ARCHITECTURE.md; requirements.md; design.md

---

## Task Dependency Graph

```
T-07-01 (Schema: junction tables)
    │
    ├─→ T-07-02 (Types: ValidReferenceTable + storage types)
    │       │
    │       └─→ T-07-03 (Repository: junction insert, fan-out, cleanup)
    │              │
    │              └─→ T-07-04 (Service: CertificateStorageService namespace)
    │                     │
    │                     ├─→ T-07-05 (Service: checkUserAccessThroughEntity extension)
    │                     │
    │                     ├─→ T-07-06 (i18n: locale type + namespace + AR + EN)
    │                     │
    │                     └─→ T-07-07 (API: cron storage-cleanup endpoint)
    │                            │
    │                            └─→ T-07-08 (Quality gate: full verification)
    │                                   │
    │                                   └─→ T-07-09 (Knowledge propagation)
```

## Execution Order

1. T-07-01 → T-07-02 → T-07-03 → T-07-04 → T-07-05, T-07-06 (parallel) → T-07-07 → T-07-08 → T-07-09

---

## T-07-01: Schema — `certificateFiles` + `certificateTemplateFiles` Junction Tables

**Estimated**: 2-3 hours
**Requirements**: REQ-07-03
**Depends On**: Plan 1 (DB Schema) must have `certificates` and `certificateTemplates` tables defined

### Subtasks

1. Open `backend/db/schema/storage/storage.ts` — add `certificateFiles` table:
   - Columns: `id` (uuid, defaultRandom, PK), `fileId` (uuid, FK to `storageFiles.id`, `onDelete: cascade`), `certificateId` (uuid, FK to `certificates.id`, `onDelete: cascade`), `usageType` (varchar(100), notNull), `createdAt` (timestamptz, defaultNow)
   - Unique constraint on `(fileId, usageType)`
   - Index on `certificateId`
   - Mirror the exact shape of `studentFiles` (existing reference)
2. Add `certificateTemplateFiles` table in the same file:
   - Columns: `id`, `fileId` (FK to `storageFiles.id`, cascade), `templateId` (FK to `certificateTemplates.id`, cascade), `usageType` (varchar(100), notNull), `createdAt`
   - Unique constraint on `(fileId, usageType)`
   - Index on `templateId`
3. (No Drizzle relations file exists in this codebase — this step is a no-op / corrected.) The Siraj codebase does NOT use Drizzle's `relations()` API. The existing storage repository (`backend/db/schema/storage/storage.repository.ts`) joins junction tables to `storageFiles` explicitly via `.innerJoin()` / `.leftJoin()` in each query method (see `getFilesForInvoice`, `getFilesForParent`, `getFileUsages`, `cleanupExpiredFiles`). The new `certificateFiles` / `certificateTemplateFiles` junctions are wired into queries the same way (explicit joins in `getCertificateFiles`, `getTemplateFiles`, and the extended fan-out methods) — no relations file is created or modified.
4. Run `bun run drizzle-generate` (or the project's migration generation command) to produce the migration SQL for the two new tables

### Files

- **Modify**: `backend/db/schema/storage/storage.ts`
- **Create**: migration file (via drizzle generate)
  > **Note**: No `drizzleRelations.ts` exists; Drizzle `relations()` is not used in this codebase (explicit `.innerJoin()`/`.leftJoin()` instead).

### Quality Loop

- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/db/schema/storage/storage.ts --lifecycle codescene
  ```

### Instruction Verification

- Read `backend/db/repo/AGENTS.md` (schema patterns)
- Read `backend/AGENTS.md`
- Read `.github/instructions/backend.instructions.md`
- Verify: junction tables follow the exact same shape as existing junctions (10 reference tables)
- Verify: `onDelete: "cascade"` on BOTH foreign keys (file + entity)

---

## T-07-02: Types — `ValidReferenceTable` Extension + Storage Types

**Estimated**: 2 hours
**Requirements**: REQ-07-03, REQ-07-04
**Depends On**: T-07-01

### Subtasks

1. Open `backend/types/storage/storage.types.ts` — extend the `ValidReferenceTable` union to include `"certificates"` and `"certificate_templates"`
2. Create `backend/types/certificates/certificate-storage.types.ts`:
   - `CertificateFileSelectType` — from `$inferSelect` of `certificateFiles` schema
   - `CertificateFileInsertType` — from `$inferInsert` of `certificateFiles` schema
   - `CertificateTemplateFileSelectType` — from `$inferSelect` of `certificateTemplateFiles` schema
   - `CertificateTemplateFileInsertType` — from `$inferInsert` of `certificateTemplateFiles` schema
   - `CertificateStorageStats` — `{ totalFiles, totalSizeBytes, pdfCount, backgroundCount, orphanedCount }`
   - `CertificateDownloadUrlResult` — `{ url, expiresAt: Date | null }`
   - `BackgroundImageValidation` — `{ valid: boolean, error?: string }`
   - `PdfBufferValidation` — `{ valid: boolean, error?: string }`
3. Export from `backend/types/certificates/index.ts` barrel
4. Verify the type file follows the `@/backend/types/` naming conventions (`{Entity}SelectType`, `{Entity}InsertType`)

### Files

- **Modify**: `backend/types/storage/storage.types.ts`
- **Create**: `backend/types/certificates/certificate-storage.types.ts`
- **Modify**: `backend/types/certificates/index.ts` (barrel export)

### Quality Loop

- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/types/storage/storage.types.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/types/certificates/certificate-storage.types.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/types/certificates/index.ts --lifecycle codescene
  ```

### Instruction Verification

- Read `backend/types/AGENTS.md`
- Read `backend/AGENTS.md`
- Read `.github/instructions/backend.instructions.md`
- Verify: types use `$inferSelect` / `$inferInsert` from Drizzle (no hand-written interface duplicating schema)
- Verify: `ValidReferenceTable` union is exhaustive — TypeScript will catch missing switch arms in `performJunctionInsert` after this change

---

## T-07-03: Repository — Junction Insert, Fan-Out, Cleanup Extensions

**Estimated**: 3-4 hours
**Requirements**: REQ-07-04
**Depends On**: T-07-02

### Subtasks

1. Open `backend/db/repo/storage/storage.repository.ts`
2. Add `linkFileToCertificate(input: { fileId, certificateId, usageType }, tx?)`:
   - Insert into `certificateFiles` junction
   - Use `tx ?? db` pattern for optional transaction
   - Return `$inferSelect` row via `.returning()`
3. Add `linkFileToTemplate(input: { fileId, templateId, usageType }, tx?)`:
   - Same pattern, insert into `certificateTemplateFiles`
4. Add `getCertificateFiles(certificateId, usageType?, tx?)`:
   - Join `certificateFiles` ⨝ `storageFiles`
   - Project to `LinkedFileReturnType` (same projection as `getFilesForInvoice`)
   - Filter by `usageType` if provided
5. Add `getTemplateFiles(templateId, usageType?, tx?)`:
   - Same pattern, join `certificateTemplateFiles` ⨝ `storageFiles`
6. Add `fetchCertificateUsages(filePath)`:
   - Query `certificateFiles` where `filePath` matches, project to `FileUsageInfo { filePath, usageType, referenceId, referenceTable: "certificates" }`
7. Add `fetchCertificateTemplateUsages(filePath)`:
   - Same, but `referenceTable: "certificate_templates"`
8. Extend `getFileUsages(filePath)`:
   - Add `fetchCertificateUsages(filePath)` + `fetchCertificateTemplateUsages(filePath)` to the parallel `Promise.all` fan-out
9. Extend `isFileInUse(filePath)`:
   - Add two `UNION ALL` arms: `SELECT 1 FROM certificate_files WHERE ...` and `SELECT 1 FROM certificate_template_files WHERE ...`
10. Extend `performJunctionInsert` switch:
    - Add `case "certificates": insert into certificateFiles`
    - Add `case "certificate_templates": insert into certificateTemplateFiles`
    - The switch must remain exhaustive (TypeScript will enforce due to `ValidReferenceTable` union)
11. Extend `deleteUsagesFromAllTables`:
    - Add `DELETE FROM certificate_files WHERE ...` and `DELETE FROM certificate_template_files WHERE ...`
12. Extend `cleanupExpiredFiles()`:
    - Add `LEFT JOIN certificate_files cf ON cf.fileId = sf.id` with `cf.id IS NULL` in WHERE
    - Add `LEFT JOIN certificate_template_files ctf ON ctf.fileId = sf.id` with `ctf.id IS NULL` in WHERE

### Files

- **Modify**: `backend/db/repo/storage/storage.repository.ts`

### Quality Loop

- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/db/repo/storage/storage.repository.ts --lifecycle codescene
  ```

### Instruction Verification

- Read `backend/db/repo/AGENTS.md`
- Read root `AGENTS.md` (database testing critical rules: `queryDb(tx)` for reads, `tx ?? db` for writes)
- Read `backend/AGENTS.md`
- Read `.github/instructions/backend.instructions.md`
- Verify: `queryDb(tx)` pattern used for reads (stateless)
- Verify: `tx ?? db` pattern used for writes (allows optional parent transaction)
- Verify: `prepareStatement` is NOT used for dynamic-conditional queries (only for fixed-ID lookups)
- Verify: `escapeLikeWildcards` used if any `LIKE` queries are added (not needed for junction lookups, but noted for safety)

---

## T-07-04: Service — `CertificateStorageService` Namespace

**Estimated**: 3-4 hours
**Requirements**: REQ-07-01, REQ-07-02, REQ-07-05, REQ-07-09, REQ-07-10, REQ-07-11, REQ-07-12
**Depends On**: T-07-03

### Subtasks

1. Create `backend/services/storage/certificate-storage.service.ts`
2. Implement `saveCertificatePdf(certificateId, templateId, pdfBuffer, tx?)`:
   - Call `validatePdfBuffer(pdfBuffer)` — check `%PDF` signature, ≤ 50 MB
   - Construct path: `certificates/{templateId}/{certificateId}.pdf`
   - Call `getStorageService().uploadFile(filePath, pdfBuffer, "application/pdf")`
   - Call `StorageService.createFileAndGet(filePath, false)`
   - Call `StorageDbRepository.linkFileToCertificate({ fileId, certificateId, usageType: "certificate_pdf", tx })`
   - On `linkFileToCertificate` failure: call `getStorageService().deleteFile(filePath)` (compensating action)
   - Return `{ filePath, fileId }`
3. Implement `generateDownloadUrl(certificateId, userId)`:
   - Fetch certificate by ID (via Plan 4 `CertificateRepository.findById`)
   - If `certificate.status === "revoked"` → throw localized error `errors.certificates.storage.revokedCertificate`
   - Call `checkCertificateFileAccess(userId, certificateId)` → if denied, throw `errors.certificates.storage.permissionDenied`
   - Resolve the `filePath` from `getCertificateFiles(certificateId, "certificate_pdf")`
   - Switch on provider:
     - Local: `return { url: ${baseUrl}/api/storage/files/${filePath}, expiresAt: null }`
     - GCP: `bucket.file(filePath).getSignedUrl({ action: "read", expires: Date.now() + duration })` → return `{ url, expiresAt }`
     - Vercel: use `@vercel/blob` download URL logic
   - Return `{ url, expiresAt }`
4. Implement `revokeCertificateFile(certificateId)`:
   - This is a no-op on the storage side — it just logs that download will be blocked by status check
   - The actual status update is done by Plan 4's `CertificateService.revokeCertificate`
5. Implement `linkTemplateBackground(templateId, filePath, oldFilePath?)`:
   - Call `StorageDbRepository.fileByPath(filePath)` → get `fileId`
   - Call `StorageDbRepository.linkFileToTemplate({ fileId, templateId, usageType: "template_background" })`
   - If `oldFilePath` is provided: call `StorageDbRepository.unregisterFileUsage(oldFilePath, "template_background", templateId)`
   - Return `{ fileId }`
6. Implement `unlinkTemplateBackground(templateId, filePath)`:
   - Call `StorageDbRepository.unregisterFileUsage(filePath, "template_background", templateId)`
7. Implement `validateBackgroundImage(file: { mimeType, size })`:
   - Check `mimeType` in `[("image/png"), "image/jpeg", "image/webp"]` → if not, return `{ valid: false, error: "invalidMimeType" }`
   - Check `size <= 10 * 1024 * 1024` → if not, return `{ valid: false, error: "backgroundTooLarge" }`
   - Return `{ valid: true }`
8. Implement `validatePdfBuffer(buffer)`:
   - Check `buffer.length > 0` and `buffer.subarray(0, 4).toString() === "%PDF"` → if not, return `{ valid: false, error: "invalidPdfSignature" }`
   - Check `buffer.length <= 50 * 1024 * 1024` → if not, return `{ valid: false, error: "pdfTooLarge" }`
   - Return `{ valid: true }`
9. Implement `requireTemplateManagePermission(userId, tErrors)`:
   - Follow the pattern of `StorageService.requireStorageManage(userId, tErrors)`
   - Check `AppPermission.CERTIFICATES_TEMPLATES_MANAGE` — throw localized `permissionDenied` if missing
10. Implement `getCertificateStorageStats()`:
    - Call `getStorageService().storageStatistics("certificates/")` for provider-level stats
    - Query `storageFiles` where `path LIKE 'certificates/%'` → count PDFs (path ends with `.pdf`) and backgrounds (path contains `/templates/`)
    - Query for orphaned count: `storageFiles` where `path LIKE 'certificates/%'` AND no `certificateFiles` or `certificateTemplateFiles` junction
    - Return `CertificateStorageStats`
11. Implement `cleanupOrphanedCertificateFiles()`:
    - Query `storageFiles` where `path LIKE 'certificates/%'`
    - For each row, check if junction exists in `certificateFiles` or `certificateTemplateFiles`
    - If no junction: `getStorageService().deleteFile(path)` (bytes) + `StorageDbRepository.deleteFile(path)` (DB row)
    - Return `{ orphanedFilesDeleted: count }`

### Files

- **Create**: `backend/services/storage/certificate-storage.service.ts`

### Quality Loop

- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/services/storage/certificate-storage.service.ts --lifecycle codescene
  ```

### Instruction Verification

- Read `backend/services/AGENTS.md`
- Read `backend/AGENTS.md`
- Read `.github/instructions/backend.instructions.md`
- Verify: uses `import { logger } from "@/backend/lib/logger"` — NEVER `console.*`
- Verify: all user-facing error messages use the i18n translation system (`getServerTranslations`)
- Verify: uses `@/` import alias (never relative paths)
- Verify: compensating actions use `logger.error` before cleanup, not `console.error`
- Verify: `getStorageService()` import is from `@/backend/storage/storage.service` (provider), NOT from `@/backend/services/storage` (metadata)

---

## T-07-05: Service — `checkUserAccessThroughEntity` Extension

**Estimated**: 2-3 hours
**Requirements**: REQ-07-06
**Depends On**: T-07-04

### Subtasks

1. Open `backend/services/storage/storage.service.ts` — locate `checkFileAccess(userId, filePath)` (~line 168)
2. Add `checkCertificateFileAccess(userId, certificateId)` to `CertificateStorageService` (in the same file or in `certificate-storage.service.ts`):
   - Import `CertificateRepository` from Plan 4
   - Fetch certificate → get `studentId`
   - If super admin → allow (return `null`)
   - If `user_files` row with `userId` → allow (existing `checkFileAccess` pattern)
   - Query if the student is linked to the user (parent relationship: `parents` → `students` join; teacher relationship: `teachers` → `classInstances` → `students` join; student self: `students.userId === userId`)
   - If any relationship matches → allow
   - Otherwise → deny with `{ error: "Forbidden", status: 403 }`
3. Extend `checkFileAccess(userId, filePath)` to include the certificate ownership chain:
   - After existing `user_files` and `teachers`/`parents` checks, add a `certificateFiles` check:
   - If `certificateFiles` junction exists for this `filePath` → call `checkCertificateFileAccess` logic to determine if the user should be granted access based on the certificate→student→user relationship
4. Ensure the extension does NOT break existing entity access paths (user, teacher, parent, staff, etc. — only ADD a new branch)

### Files

- **Modify**: `backend/services/storage/storage.service.ts` (or delegate to `CertificateStorageService`)
- **Modify**: `backend/services/storage/certificate-storage.service.ts` (add `checkCertificateFileAccess` if delegated there)

### Quality Loop

- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/services/storage/storage.service.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/services/storage/certificate-storage.service.ts --lifecycle codescene
  ```

### Instruction Verification

- Read `backend/services/AGENTS.md`
- Read `backend/AGENTS.md`
- Read `.github/instructions/backend.instructions.md`
- Verify: existing access checks (users, teachers, parents) are NOT modified — only a new branch is added
- Verify: super admin check is first (short-circuit)
- Verify: localized error messages for denial

---

## T-07-06: i18n — Locale Types, Namespace, AR + EN Translations

**Estimated**: 2-3 hours
**Requirements**: REQ-07-* (i18n section §4)
**Depends On**: T-07-02 (can run in parallel with T-07-04, T-07-05)

### Subtasks

1. Create `shared/locale/types/dashboard/certificates/storage.ts`:
   - Define the `DashboardCertificatesStorage` type interface with all keys from the i18n catalog in requirements.md §4.2
   - Type each key correctly: `string` for simple, `(param: type) => string` for interpolation, `(count: number) => string` for pluralization
   - Export the type
2. Create `shared/locale/namespaces/dashboard/certificates/storage.namespace.ts`:
   - Import the type
   - Register the namespace handle `Translation.Dashboard.CertificateStorage`
   - Export the namespace registration
3. Create `shared/locale/ar/dashboard/certificates/storage.ts`:
   - Implement `dashboardCertificatesStorageAr` matching the type interface
   - Arabic text for all keys from requirements §4.2
   - Pluralization functions follow the 6-form Arabic rule (zero/one/two/few/many/other) for all count-based keys
   - Interpolation functions use template literals with the parameter types
4. Create `shared/locale/en/dashboard/certificates/storage.ts`:
   - Implement `dashboardCertificatesStorageEn` matching the same type interface
   - English text for all keys
   - Pluralization functions follow the 2-form English rule (one/other)
5. Register in the `Translation` tree (where the namespace registration is wired):
   - Add `Storage` under `Dashboard.Certificates` in the shared locale tree
6. Add resolver-side error translations:
   - In the existing `shared/locale/` error types, add `certificates.storage.*` keys from requirements §4.5
   - These are consumed by GraphQL resolvers via `ctx.t().errorsTranslations.certificates.storage`

### Files

- **Create**: `shared/locale/types/dashboard/certificates/storage.ts`
- **Create**: `shared/locale/namespaces/dashboard/certificates/storage.namespace.ts`
- **Create**: `shared/locale/ar/dashboard/certificates/storage.ts`
- **Create**: `shared/locale/en/dashboard/certificates/storage.ts`
- **Modify**: shared locale registration tree (add `Storage` namespace under `Certificates`)

### Quality Loop

- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/certificates/storage.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/locale/namespaces/dashboard/certificates/storage.namespace.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/certificates/storage.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/certificates/storage.ts --lifecycle codescene
  ```

### Instruction Verification

- Read `shared/AGENTS.md` (i18n compile-time system rules)
- Verify: Arabic pluralization implements ALL 6 forms (zero/one/two/few/many/other) — not just one/other
- Verify: English pluralization implements 2 forms (one/other)
- Verify: interpolation parameters have correct TypeScript types
- Verify: the `shared/` layer does NOT import from `@/frontend/**`, `@/backend/**`, or `@/app/**`
- Verify: type file exports are consumed by the namespace registration

---

## T-07-07: API Route — Cron Storage Cleanup Endpoint

**Estimated**: 2 hours
**Requirements**: REQ-07-08
**Depends On**: T-07-04

### Subtasks

1. Create `app/api/cron/storage-cleanup/route.ts`:
   - Export `POST` handler
   - Read `Authorization` header — compare against `CRON_SECRET` env var
   - If mismatch → return `401 Unauthorized`
   - Read `CLEANUP_ENABLED` env var — if `false`, return `200 OK` with `{ message: "Cleanup disabled" }` without performing any work
   - Read `SIGNED_URL_CLEANUP_STRATEGY` env var — if `"disabled"`, skip signed URL cleanup
   - Call `StorageService.cleanupExpiredSignedUrls()` — returns `signedUrlsDeleted` count
   - Call `CertificateStorageService.cleanupOrphanedCertificateFiles()` — returns `orphanedFilesDeleted` count
   - Also call `StorageDbRepository.cleanupExpiredFiles()` — global orphan cleanup (now includes certificate junctions)
   - Log counts via `logger.info`
   - Return `200 OK` with `{ signedUrlsDeleted, orphanedFilesDeleted }`
2. Handle errors:
   - Wrap cleanup calls in try/catch
   - On error: `logger.error` and return `500 Internal Server Error`
   - Partial failures: if signed URL cleanup succeeds but file cleanup fails, return counts of what succeeded + 500 status

### Files

- **Create**: `app/api/cron/storage-cleanup/route.ts`

### Quality Loop

- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts app/api/cron/storage-cleanup/route.ts --lifecycle codescene
  ```

### Instruction Verification

- Read `app/AGENTS.md` (App Router conventions, API route patterns)
- Read root `AGENTS.md` (logging: NEVER `console.*`, always `logger`)
- Read `.github/instructions/frontend.instructions.md` (includes App Router rules)
- Verify: uses `import { logger } from "@/backend/lib/logger"` — NEVER `console.*`
- Verify: `cronSecret` comparison uses constant-time comparison (not `===` if security concern is high — but matching existing pattern in the repo)
- Verify: returning proper HTTP status codes (401 for auth fail, 200 for success/disabled, 500 for error)

---

## T-07-08: Quality Gate — Full Verification

**Estimated**: 1-2 hours
**Requirements**: All
**Depends On**: T-07-01 through T-07-07

### Subtasks

1. Run `bun tsgo` — verify zero TypeScript errors across all touched files
2. Run `bun biome:check` — verify formatting + lint
3. Run `bun run lint` (whole-repo via lint queue) — verify zero ESLint errors
4. Verify `bun run drizzle-generate` produces no unexpected migration diffs (tables are already created in T-07-01)
5. Run any existing storage-related tests to verify the junction extensions don't break existing behavior:
   - `bun run scripts/run-test/run-test.ts backend/db/test/repo/storage.repository.test.ts` (if exists)
   - `bun run scripts/run-test/run-test.ts backend/db/test/repo/signed-url.repository.test.ts` (if exists)
6. Verify the `ValidReferenceTable` union is exhaustive — TypeScript should error if `performJunctionInsert` is missing a case
7. Verify i18n locale files compile — `bun tsgo` should catch missing keys (type mismatch between type definition and locale implementation)

### Files

- No new files — verification only

### Quality Loop

This IS the quality loop — if any step fails, fix the offending file from the prior tasks and re-run.

### Instruction Verification

- All AGENTS.md files listed in prior tasks' instruction verification are already read
- Verify: no `console.*` usage anywhere in touched files
- Verify: no relative imports — all `@/` aliases
- Verify: no hardcoded strings in user-facing messages — all go through i18n

---

## T-07-09: Knowledge Propagation

**Estimated**: 2 hours
**Requirements**: Feature 6 (Outcome Knowledge Base)
**Depends On**: T-07-08

### Subtasks

1. Create `docs/storage/adding-entity-to-storage.md`:
   - Document the recipe for adding a new entity to the storage junction fan-out:
     1. Add junction table to `backend/db/schema/storage/storage.ts`
     2. Extend `ValidReferenceTable` union in `backend/types/storage/storage.types.ts`
     3. Add `case` to `performJunctionInsert` switch
     4. Add entity to `getFileUsages` fan-out
     5. Add `UNION ALL` arm to `isFileInUse`
     6. Add entity to `deleteUsagesFromAllTables`
     7. Add `LEFT JOIN` to `cleanupExpiredFiles`
     8. Add typed `linkFileTo<Entity>` and `get<Entity>Files` helpers
   - Reference this plan as the worked example (added `certificates` + `certificate_templates`)
2. Create `docs/storage/certificate-storage-conventions.md`:
   - Document path conventions: `certificates/{templateId}/{certificateId}.pdf` and `certificates/templates/{templateId}/background.{ext}`
   - Document MIME/size limits (PDF 50 MB; background 10 MB; MIME types)
   - Document download URL lifecycle (local auth route vs GCP signed URL vs Vercel blob)
   - Document revocation flow (status check blocks download; file not deleted)
3. Update `backend/services/storage/AGENTS.md`:
   - Add section describing `CertificateStorageService` namespace and its responsibilities
   - Note the two-`StorageService` naming gotcha (provider vs metadata) — add `CertificateStorageService` as a third namespace in this area to avoid confusion
4. Update `backend/db/repo/AGENTS.md` (if it mentions the junction pattern):
   - Note that the junction fan-out now includes `certificateFiles` and `certificateTemplateFiles` (11 + 1 = 12 junctions)
5. Verify all documentation files are part of the project's `docs/` structure (not markdown plans — these are real documentation files)

### Files

- **Create**: `docs/storage/adding-entity-to-storage.md`
- **Create**: `docs/storage/certificate-storage-conventions.md`
- **Modify**: `backend/services/storage/AGENTS.md`

### Quality Loop

- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/storage/adding-entity-to-storage.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts docs/storage/certificate-storage-conventions.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/services/storage/AGENTS.md --lifecycle codescene
  ```

### Instruction Verification

- Read root `AGENTS.md` section "AI Agent Communication Rules" — documentation files are explicitly allowed as "Documentation files that are part of project structure"
- Verify: no SUMMARY.md, CHANGES.md, or REPORT.md files are created
- Verify: documentation files go in `docs/` directory, not in `.ai/`

---

## Summary

| Task | Hours | Files | Key Deliverable |
|------|-------|-------|-----------------|
| T-07-01 | 2-3 | 2 modified, 1 migration | `certificateFiles` + `certificateTemplateFiles` schema |
| T-07-02 | 2 | 2 modified, 1 created | `ValidReferenceTable` extension + storage types |
| T-07-03 | 3-4 | 1 modified | Repository junction insert, fan-out, cleanup |
| T-07-04 | 3-4 | 1 created | `CertificateStorageService` namespace |
| T-07-05 | 2-3 | 2 modified | `checkUserAccessThroughEntity` certificate extension |
| T-07-06 | 2-3 | 4 created, 1 modified | i18n locale files (AR + EN + types + namespace) |
| T-07-07 | 2 | 1 created | Cron storage-cleanup API endpoint |
| T-07-08 | 1-2 | 0 (verification) | Full quality gate pass |
| T-07-09 | 2 | 2 created, 1 modified | Documentation + AGENTS.md updates |
| **Total** | **19-25** | | |

### Cross-File Dependencies

| From Task | File Modified | Affects Tasks |
|-----------|---------------|---------------|
| T-07-01 | `backend/db/schema/storage/storage.ts` | T-07-03, T-07-04 |
| T-07-02 | `backend/types/storage/storage.types.ts` | T-07-03 (exhaustive switch) |
| T-07-03 | `backend/db/repo/storage/storage.repository.ts` | T-07-04 (uses repository methods) |
| T-07-04 | `backend/services/storage/certificate-storage.service.ts` | T-07-05, T-07-07 |
| T-07-06 | `shared/locale/` files | T-07-04 (uses translations), T-07-07 (uses translations in cron) |

### AGENTS.md Files to Read (Cumulative)

- Root `AGENTS.md` (always)
- `backend/AGENTS.md` (for all backend files)
- `backend/db/repo/AGENTS.md` (for repository + schema files)
- `backend/services/AGENTS.md` (for service files)
- `backend/types/AGENTS.md` (for type files)
- `app/AGENTS.md` (for API route files)
- `shared/AGENTS.md` (for locale files)

### Instruction Files to Read (Cumulative)

- `.github/instructions/backend.instructions.md` (for all `backend/**` files)
- `.github/instructions/frontend.instructions.md` (for `app/**` files, covers App Router)
