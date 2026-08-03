# Siraj Storage & File System — Analysis

Purpose: Document the existing Siraj storage subsystem so a future **certificate** feature
issuer can reuse the upload/signed-URL/ownership/protection machinery instead of building
its own.

---

## 1. Architecture Overview

Siraj has a **pluggable storage provider** layer paired with a separate **database
metadata + ownership** layer. Two distinct services exist:

| Layer | Location | Responsibility |
|---|---|---|
| Provider abstraction (disk) | `backend/storage/disk/*` | Actual bytes operations (GCP, local FS, Vercel Blob). Singleton `StorageService`. |
| DB metadata / ownership | `backend/db/repo/storage/*` + `backend/services/storage/*` | `storage_file` rows, junction tables (`user_files`, etc.), signed URLs, access checks, protection. |

The **GraphQL layer** (`backend/graphql/{query,mutation}/storage/`) delegates file/folder
list/rename/delete/prepareUpload to the provider singleton, while file **ownership/access**
goes through `StorageDbRepository` + `StorageService` (the metadata service in
`backend/services/storage/`).

> ⚠️ Naming gotcha: there are **two `StorageService` things**:
> - `backend/storage/disk/storage.service.interface.ts` — the *provider* interface (`fileExists`, `listFiles`, `prepareUpload`, …).
> - `backend/services/storage/storage.service.ts` — the *namespace* `StorageService` for DB metadata / auth helpers (`createFile`, `checkFileAccess`, `validateSignedUrlSession`, …).
> GraphQL resolvers import `getStorageService` (provider) from `backend/storage/storage.service` AND `StorageService` (metadata) from `backend/services/storage`.

---

## 2. Storage Schema (`backend/db/schema/storage/storage.ts`)

### 2.1 `storageFiles` (table `storage_file`)
```ts
// storage.ts:11-19
export const storageFiles = pgTable("storage_file", {
  id: uuid("id").defaultRandom().primaryKey(),
  path: text("path").notNull().unique(),          // relative, e.g. "public/avatars/<uid>/pic.png"
  isProtected: boolean("is_protected").notNull().default(false),
});
```
- **No `createdAt`**, no `size`, no `contentType`, no `uploadedBy`. The DB row is a *thin pointer*;
  metadata lives on the actual blob/FS object. This is why `cleanupExpiredFiles` (§9) does NOT
  age-filter database rows.
- Unique on `path`; indexed on `isProtected`.

### 2.2 Junction tables (file ownership — replaces old polymorphic `file_usage`)
`storage.ts:27-209` — each entity that can own a file gets its own junction with proper FKs
**and `onDelete: "cascade"`** on BOTH the file and the entity:

| Table | Entity FK | usageType column | cascade target |
|---|---|---|---|
| `user_files` | `userId → users.id` | varchar(100) | users, storageFiles |
| `teacher_files` | `teacherId → teachers.id` | varchar(100) | teachers, storageFiles |
| `student_files` | `studentId → students.id` | varchar(100) | students, storageFiles |
| `parent_files` | `parentId → parents.id` | varchar(100) | parents, storageFiles |
| `invoice_files` | `invoiceId → invoices.id` | varchar(100) | invoices, storageFiles |
| `complaint_files` | `complaintId → complaints.id` | varchar(100) | complaints, storageFiles |
| `learning_resource_files` | `learningResourceId → learningResources.id` | varchar(100) | learningResources, storageFiles |
| `staff_profile_files` | `staffProfileId → staffProfiles.id` | varchar(100) | staffProfiles, storageFiles |
| `recurring_schedule_files` | `recurringScheduleId → recurringSchedules.id` | varchar(100) | recurringSchedules, storageFiles |
| `class_instance_files` | `classInstanceId → classInstances.id` | varchar(100) | classInstances, storageFiles |

All junctions share the same shape: `{ id, fileId, <entityFK>, usageType, createdAt }`.
The `usageType` string is the semantic role (e.g. `"avatar"`, `"certificate"`, `"invoice_pdf"`).

> **For certificates**: there is NO `certificate_files` table today. The pattern for adding one
> is mechanical (copy e.g. `studentFiles`, swap the FK to the new `certificates` table, bump
> the `ValidReferenceTable` union and the junction switch in §3).

### 2.3 `storageDirectories` (table `storage_directory`) — `storage.ts:211-229`
Per-directory permission flags + protection. Used to gate uploads/deletes/moves at directory level.
```ts
{
  path: varchar(1024).notNull().unique(),
  allowUploads / allowDelete / allowMove /
  allowCreateSubDirs / allowDeleteFiles / allowMoveFiles, // all boolean default true
  isProtected: boolean default false,
  protectChildren: boolean default false,
}
```

### 2.4 `signedUrls` (table `signed_url`) — `storage.ts:231-250`
Short-lived upload tokens (pre-upload session records). **NOT download** signed URLs — these are
for the *upload* flow integrity check.
```ts
{
  id: varchar(64) PK,             // UUID token (sessionId)
  filePath: varchar(1024),
  contentType: varchar(255),
  fileSize: bigint,                // declared size
  contentHash: varchar(128),       // SHA-256 base64 (declared by client)
  expiresAt: timestamptz,
  createdAt: timestamptz,
  used: boolean default false,
}
```
Indexes on `expiresAt`, `(used, expiresAt)`, `createdAt`, `filePath`, `contentHash`.

### 2.5 `siteContent` (`site-content.ts:4-25`) — CMS pages, unrelated to file storage.

---

## 3. Storage Repository (`backend/db/repo/storage/storage.repository.ts`)

Namespace `StorageDbRepository` (~820 LOC). Key functions:

### 3.1 File CRUD
- `fileById`, `fileByPath`, `filesByIds`, `filesByPaths` (`:26-44`)
- `createFile(path, isProtected=false)` (`:46-56`) — uses `onConflictDoUpdate` on `path`, so idempotent upsert. **This is what the upload route calls after bytes land** to create the DB pointer.
- `updateFile`, `deleteFile(path)` — `deleteFile` deletes the *row only*, not the bytes.

### 3.2 Directory CRUD — `:83-180`
`directoryByPath`, `directoriesByParentPath` (`LIKE parent/%`), `ensureDirectoryRecord` (upsert),
`updateDirectory`, `deleteDirectory`.

### 3.3 File usage / ownership — `:183-348`
- `getFileUsages(filePath)` — fans out and queries **all 10 junction tables** in parallel
  (`fetchPersonUsages` + `fetchContentUsages` + `fetchSystemUsages`) and maps each row to a
  `FileUsageInfo { filePath, usageType, referenceId, referenceTable }`.
- `isFileInUse(filePath)` — a single raw SQL `UNION ALL` across all 10 junction tables with
  `LIMIT 1` (cheap existence check).
- `registerFileUsage(input)` (`:350-373`) — creates the `storage_file` row (upsert) then dispatches
  via `performJunctionInsert` switch (`:386-428`) to the right table (`users` → `userFiles`, etc.).
- `unregisterFileUsage(filePath, usageType, referenceId)` (`:430-549`) — deletes matching rows from
  every junction table via `deleteUsagesFromAllTables`.
- `checkFileUsage` (`:552-574`) — returns `{ isInUse, usages, canDelete, deleteBlockReason }`.

> The `referenceTable` union (`ValidReferenceTable`) is a closed set of the 10 table names. Adding
> a `certificates` owner requires extending this union + the switch + the usage fan-out.

### 3.4 Typed link helpers for transactions — `:637-745`
`getFilesForParent`, `getFilesForInvoice`, `linkFileToParent`, `linkFileToInvoice` — these accept
an optional `tx: DBTransaction` so they can run inside a parent transaction (important for
atomic replace-and-link flows).

### 3.5 Validation & cleanup
- `validateUpload({path, size, contentType})` (`:751-773`) — path traversal (`..`, leading `/`),
  max **100 MB**, content type required. **No allowlist of content types** (line 770 comment).
- `cleanupExpiredFiles()` (`:779-821`) — LEFT JOINs every junction, deletes `storage_file` rows
  where ALL junction FKs are NULL. **No age filter** because `storage_file` has no `createdAt`.

---

## 4. Signed URL Repository (`backend/db/repo/shared/signedUrl.repository.ts`)

Namespace `SignedUrlRepository` over the `signed_url` table.

### 4.1 Create / read
```ts
createSignedUrl(data)                           // plain insert + returning
getSignedUrlById(id)                            // prepared statement lookup
```

### 4.2 Claim — **`SELECT FOR UPDATE SKIP LOCKED`** ✅ (`:44-80`)
```ts
export const claimSignedUrl = async (id) => {
  return db.transaction(async tx => {
    const [token] = await tx.select().from(signedUrls)
      .where(and(
        eq(signedUrls.id, id),
        eq(signedUrls.used, false),
        gt(signedUrls.expiresAt, now),
      ))
      .for("update", { skipLocked: true })   // ← SKIP LOCKED row-level lock
      .limit(1);
    if (token.expiresAt <= now) return null;
    const [updated] = await tx.update(signedUrls).set({ used: true })
      .where(eq(signedUrls.id, id)).returning();
    return updated;
  });
};
```
This is the **atomic claim** pattern — multiple concurrent PUTs cannot double-claim. Returns null
if missing/expired/already-used/locked-then-not-selected.

### 4.3 Delete — `deleteExpired()` (`:86-101`)
Simple `DELETE WHERE expiresAt < now` + returning count.

---

## 5. Storage Service (metadata/auth) — `backend/services/storage/storage.service.ts`

Namespace `StorageService` (and legacy aliases `StorageAuthService`, `StorageManageService`,
`StorageUtils`). Thin orchestrator over `StorageDbRepository` and `SignedUrlRepository`.

### 5.1 Permission gates
- `requireStorageManage(userId, tErrors)` — checks `AppPermission.STORAGE_MANAGE`, throws localized error otherwise.
- `requireStorageManageOrOwner(userId, filePath, tErrors)` — allow if `STORAGE_MANAGE` **or** the file has a `user_files` row with `userId === userId` (direct user ownership).

### 5.2 Signed-URL session validation — `validateSignedUrlSession` (`:72-107`)
Returns `{error, status}` on: missing session (403), `used` (403), expired (403), path mismatch (400).

### 5.3 Access check — `checkFileAccess(userId, filePath)` (`:168-196`)
```ts
const usages = await getFileUsages(filePath);
if (usages.length === 0) return null;          // no owners → any authenticated user
if (isSuperAdmin) return null;
for (usage of usages):
  if (referenceTable === "users" && referenceId === userId) return null;
  if (referenceTable in ("teachers","parents") && user owns that teacher/parent) return null;
return { error: "Forbidden", status: 403 };
```
So access is granted if the user (a) is super admin, (b) is a direct `user_files` owner, or
(c) owns the teacher/parent that the file is attached to. **`student`/`invoice`/`staff`/… usages
do NOT grant download access** through this helper — only `users`/`teachers`/`parents`.

> For certificates tied to a `student`, you may need to extend `checkUserAccessThroughEntity`
> to include "parent of student" / "the student's account" relationships.

### 5.4 File/path helpers
- `validatePath(filePath)` — rejects `..`, leading `/`, leading `~`.
- `validateUpload` — delegates to repo (100 MB, traversal, content type).
- `checkDirectoryUploadPermissions(directoryPath)` — reads `storage_directories.allowUploads`.
- `createFile` / `createFileAndGet(filePath, isProtected?)` — create DB pointer row.
- `linkFileToEntity({referenceTable, referenceId, usageType, filePath})` — public wrapper over `registerFileUsage`.

### 5.5 Cleanup wrappers
- `cleanupExpiredFiles()` → `StorageDbRepository.cleanupExpiredFiles()`.
- `cleanupExpiredSignedUrls()` → `SignedUrlRepository.deleteExpired()`.

### 5.6 Protection / directory perms
- `setStorageItemProtection({path, isProtected, protectChildren})` — dispatches to `setProtection` (file xor directory).
- `updateDirectoryPermissions(input)`.

---

## 6. Storage Provider Abstraction (`backend/storage/`)

### 6.1 Factory + singleton — `backend/storage/storage.service.ts`
```ts
type StorageProvider = "gcp" | "local" | "vercel" | "s3" | "r2";   // :11

getStorageProvider()  // reads getEnvironmentConfig().storageProvider (env STORAGE_PROVIDER), validates
createService(provider)  // adapters map: gcp→createGcpAdapter, local→createLocalAdapter,
                          //                 vercel→createVercelAdapter, s3/r2 → throw "not implemented"
getStorageService()       // promise-memoized singleton (resets init promise on failure)
getStorageServiceSync()   // throws if not initialized
initializeStorageService() / resetStorageService()
```
- **Env**: `STORAGE_PROVIDER` (required, see `backend/lib/env.ts:326` and `env-config-keys.ts:117`).
- S3 and R2 are listed in the union but **throw "not implemented yet"** (`:39-44`).

### 6.2 Interface — `backend/storage/disk/storage.service.interface.ts`
```ts
export interface StorageService {
  fileExists(path): Promise<boolean>;
  prepareUpload(input: UploadPreparationInput): Promise<UploadPreparationResult>;
  uploadFile(path, contentType, buffer): Promise<FileUploadResult>;
  listFiles(input): Promise<StorageObjectList>;
  createFolder(input): Promise<FileOperationResult>;
  renameFile(input): Promise<FileOperationResult>;
  deleteFile(path): Promise<FileOperationResult>;
  directoryInfoByPath(path): Promise<DirectoryInfo | null>;
  fileInfoByPath(path): Promise<FileInfo | null>;
  fileInfoByDbFileId(id): Promise<FileInfo | null>;
  storageStatistics(path?): Promise<StorageStats>;
  fetchDirectoryChildren(path?): Promise<DirectoryInfo[]>;
  moveItems(input): Promise<BulkOperationResult>;
  copyItems(input): Promise<BulkOperationResult>;
  deleteItems(input): Promise<BulkOperationResult>;
}

export const STORAGE_CONFIG = {
  SIGNED_URL_DURATION: 15,                  // minutes — signed-URL validity
  MAX_FILE_SIZE: 100 * 1024 * 1024,          // 100MB
  DEFAULT_CONTENT_TYPE: "application/octet-stream",
};
```

### 6.3 Base adapter — `backend/storage/disk/base.adapter.ts`
Abstract `BaseAdapter<TContext>` holds a context + an `AdapterOperations<TContext>` bundle and
delegates every method. Per-provider folders:
- `backend/storage/disk/local/` — `LocalContext`, `local/adapter.ts`, `local/operations/*` (file system).
- `backend/storage/disk/gcp/` — `GcpContext` (Google Cloud Storage bucket via `@google-cloud/storage`),
  `gcp/adapter.ts`, `gcp/operations/*`, `gcp-auth.ts`.
- `backend/storage/disk/vercel/` — `VercelContext` (`@vercel/blob`), `vercel/adapter.ts`, `vercel/operations/*`.
- `backend/storage/disk/shared/*` — `*-helper.ts` operations shared across adapters.

### 6.4 Local storage path resolution — `backend/lib/storage/local-storage-path.ts`
- `getLocalStorageBasePath()` → `LOCAL_STORAGE_PATH` env or `./storage/`.
- `resolveLocalStoragePath(relativePath)` — `path.resolve(base, rel)` then verifies the result is
  **inside** the base dir (rejects `..`/absolute). **This is the FS traversal guard**, also used in the
  GET files route.
- `resolvePublicStoragePath(subPath)` → `<base>/public/<subPath>` (no traversal check — assumed safe).

### 6.5 Vercel adapter — `vercel/adapter.ts`
Requires `BLOB_READ_WRITE_TOKEN`; `VERCEL_BLOB_ACCESS` ("public"|"private", default public).

---

## 7. Upload Flow (full trace)

Two upload paths share a common pre-flight: a **GraphQL `prepareUpload` mutation** returning
an `UploadPreparationResult { id, url, uploadType, access? }`.

### 7.1 `prepareUpload` (GraphQL mutation) — `backend/graphql/mutation/storage/storage.mutation.ts:117`
```ts
requireAuth(ctx)                              // authenticated
sanitizeStoragePath / validateStoragePath    // backend/lib/path-validator
StorageAuthService.requireStorageManage(...)  // STORAGE_MANAGE permission
getStorageService().prepareUpload({ path, fileSize, contentType, contentHash })
```

### 7.2 Shared prepare helper — `backend/storage/disk/shared/upload-operations.helper.ts:11`
```ts
prepareUploadHelper(input, onPrepareFn):
  clean path, validateUpload (traversal, 100MB, content type)
  if SIGNED_URL_CLEANUP_STRATEGY in ("lazy","both"): SignedUrlRepository.deleteExpired()   // lazy GC
  sessionId = crypto.randomUUID()
  expiresAt = now + 15 min
  SignedUrlRepository.createSignedUrl({ id:sessionId, filePath, contentType, fileSize:BigInt, contentHash, expiresAt, used:false })
  return onPrepareFn(sessionId, cleanedPath)        // provider injects the actual URL
```
Per `uploadType`:
- **SIGNED_URL** (local & GCP) — local adapter builds `${baseUrl}/api/storage/upload/${sessionId}`
  (`local/operations/upload.operations.ts:14`). GCP calls `bucket.file(path).getSignedUrl(...)`
  v4 (`gcp/operations/upload.operations.ts:33`) with `contentMd5 = contentHash`.
- **VERCEL_BLOB_CLIENT** (Vercel) — returns `${baseUrl}/api/storage/vercel-upload`, `access` set;
  client then uses `@vercel/blob/client` `upload(...)` to hit that endpoint (`vercel/operations/upload.operations.ts:21`).

### 7.3 Path A — Signed-URL PUT — `app/api/storage/upload/[id]/route.ts`
```
PUT /api/storage/upload/[id]
  StorageService.claimSignedUrl(tokenId)          // SKIP LOCKED atomic claim, sets used=true
    └ null → 403
  validateHeaders: Content-Type match, Content-Length required/<= declared, Content-MD5 match
  resolveLocalStoragePath(filePath)               // traversal check → absolute FS path
  fs.mkdir(dirname, recursive, 0o755)
  streamToFile(body, absolutePath, contentHash):   // crypto.createHash("sha256")
    sha256 base64 must equal declared contentHash else unlink + error
  finalizeUpload:
    StorageService.createFileAndGet(filePath, false)    // insert storage_file row
    fs.stat → size/birthtime
    return { id, path, size, contentType, url: baseUrl+/api/storage/files/<path>, isProtected } (201)
```
> Note `validateHeaders` checks `Content-MD5` header against `signedUrl.contentHash`, but the
> `streamToFile` re-hashes with SHA-256 and compares against the same `contentHash` — so the stored
> declared hash is SHA-256 base64, even though the header is named `Content-MD5`.

### 7.4 Path B — Vercel Blob client-SDK upload — `app/api/storage/vercel-upload/route.ts`
```
POST /api/storage/vercel-upload   (handleBody.type === "blob.generate-client-token")
  getUserIdFromRequest (access token OR session_id cookie)
  parse clientPayload { sessionId, fileSize, contentType } from body.payload.clientPayload
  validateUpload + checkDirectoryUploadPermissions
  validateSession(sessionId, pathName): unused, unexpired, path match  (read-only check here)
  handleUpload({ body, request,
    onBeforeGenerateToken → { allowOverwrite:false, allowedContentTypes:[contentType], tokenPayload:{sessionId,pathName,userId} },
    onUploadCompleted → { claimSignedUrl(sessionId); createFile(blob.pathname) }   // webhook fires after upload
  })
```

### 7.5 Frontend upload client — `frontend/common/views/dashboard/profile/shared/uploadAvatarFile.ts`
Frontend computes SHA-256 base64 (`computeContentHash`), calls `prepareUpload` GraphQL mutation,
then dispatches on `uploadType`:
- `VERCEL_BLOB_CLIENT` → `@vercel/blob/client` `upload(filePath, file, { handleUploadUrl, clientPayload, access:"public" })`.
- `SIGNED_URL` → `fetch(uploadUrl, { method:"PUT", body:file, headers:{ "Content-Type","Content-MD5":contentHash } })`.

The usage-site example (`uploadAvatarFile`) builds `public/avatars/<ownerKey>/<sanitizedName>` and
assumes the file is **public** (no per-user ownership linked in this helper — it relies on the
`public/` directory convention).

---

## 8. Download / File Serving — `app/api/storage/files/[[...path]]/route.ts`

GET handler (`:145`):
1. Reconstruct relative path from catch-all `path` params.
2. **Public bypass** — if `relativePath.startsWith("public/") || "avatars/"`:
   - `public/...` → `resolvePublicStoragePath(...)` (no auth); `avatars/...` → `resolveLocalStoragePath`.
   - `fs.access` then `buildFileResponse` with `Cache-Control: public, max-age=3600`, `Accept-Ranges: bytes`.
3. **Protected path** — authenticate (access token OR session cookie), then
   `StorageService.checkFileAccess(userId, relativePath)`; on `null` allow, else return the error.
4. `buildFileResponse` — `statSync`, extension→MIME via `extToMime` (`@/shared/utils`), supports
   `Range` requests (`parseRange` → 206 partial content with `Content-Range`, else 416).

> ⚠️ Auth bypass for `avatars/` even though it goes through `resolveLocalStoragePath` (inside the
> `public/ || avatars/` branch). Certificate PDFs that should be **per-user gated** must NOT live
> under `public/` or `avatars/` and must have a `*_files` junction row so `checkFileAccess` can
> grant based on ownership.

---

## 9. Cleanup

Three independent cleanup mechanisms:

### 9.1 Lazy signed-URL GC during upload prep
`prepareUploadHelper` (`upload-operations.helper.ts:28`) — if `SIGNED_URL_CLEANUP_STRATEGY` env is
`"lazy"` or `"both"`, runs `SignedUrlRepository.deleteExpired()` before minting the new token.
Default strategy is `"lazy"` (per `getStringEnv("SIGNED_URL_CLEANUP_STRATEGY", "lazy")`).

### 9.2 Manual admin endpoint — `app/api/storage/cleanup/route.ts` (POST)
```
authenticateAdmin (access token / session) AND user.email === env.adminEmail
StorageService.cleanupExpiredSignedUrls()  // returns deletedCount
```
Only deletes **expired signed URLs**, not orphan files. This is the one explicit cleanup route.

### 9.3 Orphan file row cleanup (no cron) — `StorageDbRepository.cleanupExpiredFiles`
LEFT JOINs every junction, deletes `storage_file` rows with no junction matches. **No age gate**
(no `createdAt` on `storage_file`). Exposed via `StorageService.cleanupExpiredFiles()` but
**not currently wired to any cron route** (`app/api/cron/` has only `class-reminders`).

### 9.4 Env switches relevant to cleanup (`backend/lib/env.ts:346-358`)
- `cronSecret` — guards cron endpoints (not currently used for storage).
- `signedUrlCleanupStrategy` (`SIGNED_URL_CLEANUP_STRATEGY`).
- `localStoragePath` (`LOCAL_STORAGE_PATH`).
- `cleanupEnabled` (`CLEANUP_ENABLED`).

> **No storage cron exists.** A certificate feature that wants periodic orphan cleanup would need a
> new `app/api/cron/storage-cleanup/route.ts` that calls both `cleanupExpiredSignedUrls()` and
> `cleanupExpiredFiles()`, guarded by `cronSecret`.

---

## 10. GraphQL Storage API

### 10.1 Pothos type objects — `backend/graphql/pothos/storage/storage.pothos.ts`
Definitions for: `FileInfo` (interface `StorageObject` implements `path`/`name`/`isProtected`,
exposes `size`, `contentType`, `contentHash`, `url`, `fileType`, `isPublic`, `isInUse`, `usages[]`),
`DirectoryInfo` (`permissions`, `protectChildren`, `fileCount`, `folderCount`, `totalSize`),
`StorageObjectList`, `StorageStats` + `FileTypeBreakdown`, `FileUsageResult`, `FileOperationResult`,
`BulkOperationResult`/`BulkOperationFailure`, and all input types (`UploadPreparationInput`,
`FolderCreateInput`, `FileRenameInput`, `StorageItemsMoveInput/CopyInput/DeleteInput`,
`DirectoryPermissionsUpdateInput`, `StorageItemProtectionUpdateInput`, `FileUsageCheckInput`).
Enums: `FileType`, `UploadType` (`SIGNED_URL` | `VERCEL_BLOB_CLIENT`), `FileSortField`.

### 10.2 Queries — `backend/graphql/query/storage/storage.query.ts`
All `authScopes: { loggedIn: true }` (no per-path authorization at resolver — comment at top notes
**the service layer must enforce per-user path access to prevent IDOR**):
- `listFiles(input)` → `storageService.listFiles`
- `fileInfo(path)` → `storageService.fileInfoByPath`
- `folderInfo(path)` → `storageService.directoryInfoByPath`
- `searchFiles(searchTerm, fileType?, folder?, limit=50)`
- `storageStats(path?)` → `storageService.storageStatistics`
- `directoryChildren(path?)` → `storageService.fetchDirectoryChildren`
- `fileUsage(input)` → `StorageDbRepository.checkFileUsage`

### 10.3 Mutations — `backend/graphql/mutation/storage/storage.mutation.ts`
Each resolves `requireAuth` → sanitize/validate path → authorize (`requireStorageManage` or
`requireStorageManageOrOwner`) → delegate to provider singleton or `StorageManageService`:
- `renameFile`, `deleteFile`, `prepareUpload`, `createFolder`
- `moveStorageItems`, `copyStorageItems`, `deleteStorageItems` (bulk, **100-item limit** `BULK_ITEM_LIMIT`)
- `updateDirectoryPermissions`, `setStorageItemProtection`

> Bulk move/copy/delete use `sanitizeAndValidatePaths` + `authorizeBulkPaths` (per-path owner check)
> via `resolveBulkTransfer("move"|"copy", input, ctx)`.

### 10.4 Learning resource GraphQL — `learning-resource.pothos.ts`
Separate domain resource (uploaded learning material records); wires the
`learning_resource_files` junction. See `backend/db/repo/storage/learning-resource.repository.ts`
(`findByFilePath`, `insertResource` …).

---

## 11. Frontend Storage Documents

**There is NO `frontend/common/graphql/sharedDocuments/storage/` directory** — the frontend does
not ship hand-written storage GraphQL documents. Instead it relies on:
- **Generated operations**: `frontend/common/graphql/generated/gql/operations.ts` (e.g.
  `PrepareUploadMutation_*` at line ~4206) and `graphql-types.ts` (`UploadType` enum re-export).
- **Domain-specific upload helpers**: `frontend/common/views/dashboard/profile/shared/uploadAvatarFile.ts`
  and `frontend/common/hooks/useAvatarUpload.ts`.
- Vercel-Blob client upload used by `frontend/common/views/dashboard/billing/components/SubmitPaymentProofDialog.tsx`
  and `resources/useResourcesViewModel.ts`.

Frontend uses `@vercel/blob/client`'s `upload`, `SIGNED_URL` `fetch PUT`, and GraphQL mutations;
no generic `useStorage` hook.

---

## 12. Image Processing (`sharp`)

- `sharp@^0.35.3` is declared in `package.json` (dep line 228; listed in `trustedDependencies`
  and `ignoreScripts` — :243-246). It is installed but **`grep` found no `import ... from "sharp"`
  or `require("sharp")` / `sharp(...)` call anywhere in `backend/`, `frontend/`, `app/`,
  or `shared/` outside of package metadata.**
- **Conclusion: no image resizing/format conversion is performed server-side today.** The declared
  `sharp` dependency is currently unused (likely a leftover or reserved for future use). Uploads are
  stored verbatim; avatars and other images are served as-is from the file route.

> For a certificate feature that needs to render/draw PDF or images, **no existing image pipeline
> is leveraged** — you'd add the processing yourself or rely on a client-side approach.

---

## 13. Site-Content (tangential) — `backend/services/storage/site-content.service.ts`

CMS pages managed under Settings → Site Content. Enforces
`SETTINGS_SITE_CONTENT_MANAGE` for writes, `SETTINGS_VIEW` for reads (at the resolver), with
best-effort audit logging via `AuditService.createManyAuditLogs`. Has its own typed validation error
(`SiteContentValidationErrorCode`, slug pattern `^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$i`). **Unrelated
to file storage despite living under `services/storage/`.**

---

## 14. Key File Path Index

| Concern | Path |
|---|---|
| Schema | `backend/db/schema/storage/storage.ts` |
| Schema (site-content) | `backend/db/schema/storage/site-content.ts` |
| Repo (metadata) | `backend/db/repo/storage/storage.repository.ts` |
| Repo (signed URL) | `backend/db/repo/shared/signedUrl.repository.ts` |
| Repo (learning resource) | `backend/db/repo/storage/learning-resource.repository.ts` |
| Repo (site-content) | `backend/db/repo/storage/site-content.repository.ts` |
| Service (metadata/auth) | `backend/services/storage/storage.service.ts` |
| Service (site-content) | `backend/services/storage/site-content.service.ts` |
| Provider factory | `backend/storage/storage.service.ts` |
| Provider interface | `backend/storage/disk/storage.service.interface.ts` |
| Base adapter | `backend/storage/disk/base.adapter.ts` |
| Local adapter ops | `backend/storage/disk/local/operations/*` |
| GCP adapter ops | `backend/storage/disk/gcp/operations/*` |
| Vercel adapter ops | `backend/storage/disk/vercel/operations/*` |
| Shared upload helper | `backend/storage/disk/shared/upload-operations.helper.ts` |
| Local path resolver | `backend/lib/storage/local-storage-path.ts` |
| Path validator | `backend/lib/path-validator.ts` (`sanitizeStoragePath`/`validateStoragePath`) |
| Env config | `backend/lib/env.ts` (`storageProvider`, `blobReadWriteToken`, `signedUrlCleanupStrategy`, `cleanupEnabled`, `localStoragePath`) |
| Env keys docs | `backend/lib/env-config-keys.ts` |
| GraphQL types | `backend/graphql/pothos/storage/storage.pothos.ts` |
| GraphQL queries | `backend/graphql/query/storage/storage.query.ts` |
| GraphQL mutations | `backend/graphql/mutation/storage/storage.mutation.ts` |
| API — signed-URL upload | `app/api/storage/upload/[id]/route.ts` |
| API — Vercel upload | `app/api/storage/vercel-upload/route.ts` (test: `route.test.ts`) |
| API — file serving | `app/api/storage/files/[[...path]]/route.ts` |
| API — manual cleanup | `app/api/storage/cleanup/route.ts` |
| Frontend avatar upload | `frontend/common/views/dashboard/profile/shared/uploadAvatarFile.ts` |
| Frontend avatar hook | `frontend/common/hooks/useAvatarUpload.ts` |
| Type defs | `backend/types/storage/storage.types.ts` (`UploadType`, `UploadPreparationResult`, `StorageStats`, `FileUsageInfo`, junction `$inferSelect` types…) |

---

## 15. Reuse Recipe for a Certificate Feature

Based on the analysis, a certificate issuer would reuse the existing machinery with these additions:

1. **Add a `certificate_files` junction** in `backend/db/schema/storage/storage.ts` mirroring e.g.
   `studentFiles` (FK to new `certificates` table, `onDelete: cascade`).
2. **Extend the closed `ValidReferenceTable` union** (`backend/types/storage/storage.types.ts`)
   to include `"certificates"`.
3. **Add the case to** `performJunctionInsert` (`storage.repository.ts:388`), the usage fan-out in
   `getFileUsages`/`fetchContentUsages` (or a new batch), the `UNION ALL` in `isFileInUse`
   (`:333`), and the `deleteUsagesFromAllTables` set (`:448`).
4. **Reuse the upload flow as-is**: `prepareUpload` (GraphQL) → claim SKIP LOCKED `signed_url` →
   PUT to `/api/storage/upload/[id]` (SIGNED_URL) OR `/api/storage/vercel-upload` (Vercel).
   The route already calls `StorageService.createFileAndGet(filePath, false)` for the DB pointer.
5. **Link** via `StorageService.linkFileToEntity({ referenceTable:"certificates", referenceId, usageType:"certificate", filePath })`
   — or a new typed `linkFileToCertificate` that accepts a `tx` for atomicity with the certificate row.
6. **Access** — for gated certificate PDFs, **do NOT** place them under `public/` or `avatars/` (those
   bypass auth in the files route). Place them under e.g. `certificates/<studentId>/<file>.pdf` and
   ensure a `certificate_files` row exists. Add a `checkUserAccessThroughEntity` extension so the
   owning student (or their parent) can download via `/api/storage/files/...` after `checkFileAccess`.
7. **Cleanup** — add a cron `app/api/cron/storage-cleanup/route.ts` guarded by `cronSecret` to call
   `StorageService.cleanupExpiredSignedUrls()` and `StorageService.cleanupExpiredFiles()`
   (currently no cron).
8. **Image/PDF rendering** — `sharp` is installed but unused; if the certificate needs server-side
   raster/composite generation, wire `sharp` (or a PDF library) into the issuance service.
9. **Protect sensitive certs** with `setStorageItemProtection({ path, isProtected:true })` (the
   `storage_file.is_protected` flag) and a protected `storage_directory` entry; the files route uses
   `isProtected` indirectly via `checkFileAccess` ownership, but the directory flag can additionally
   guard uploads via `checkDirectoryUploadPermissions`.
