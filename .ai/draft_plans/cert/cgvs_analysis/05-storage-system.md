# Storage & File System Analysis

> **Project**: CGVS → Siraj-Cert Migration Analysis
> **Focus**: Pluggable storage system (local + GCP), signed URLs, upload/download flows, storage browser UI, cleanup cron
> **Date**: 2025-07-17

---

## Table of Contents

1. [Storage Service Architecture](#1-storage-service-architecture)
2. [Storage Interface (15 Methods)](#2-storage-interface)
3. [Local Storage Adapter](#3-local-storage-adapter)
4. [GCP Storage Adapter](#4-gcp-storage-adapter)
5. [GCP Authentication](#5-gcp-authentication)
6. [Database Schema](#6-database-schema)
7. [Signed URL Lifecycle](#7-signed-url-lifecycle)
8. [Upload Flow](#8-upload-flow)
9. [Download Flow](#9-download-flow)
10. [Storage Browser UI](#10-storage-browser-ui)
11. [File Management Operations](#11-file-management-operations)
12. [Cleanup Cron Job](#12-cleanup-cron-job)
13. [Demo Data & Initialization](#13-demo-data--initialization)
14. [Certificate File Storage Analysis](#14-certificate-file-storage-analysis)
15. [Security Analysis](#15-security-analysis)
16. [API Route Map](#16-api-route-map)
17. [Comparison with Siraj's Storage System](#17-comparison-with-sirajs-storage-system)
18. [Migration Recommendations](#18-migration-recommendations)

---

## 1. Storage Service Architecture

### Pluggable Factory Pattern

CGVS implements a **Singleton Factory** pattern for storage providers.

```
┌──────────────────────────────────────────────────────────────┐
│                    StorageServiceFactory                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  getStorageService(): Promise<IStorageService>            │ │
│  │  getStorageServiceSync(): IStorageService                 │ │
│  │  initializeStorageService(): Promise<void>                │ │
│  │  getActiveProvider(): StorageProvider                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                              │                                  │
│            ┌─────────────────┼─────────────────┐               │
│            ▼                 ▼                 ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ LocalAdapter │  │ GCP Adapter  │  │  Vercel/S3/  │         │
│  │  (~1300 LOC) │  │  (~900 LOC)  │  │R2 (stubs)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

**Provider Selection**: Environment variable `STORAGE_PROVIDER` with values `local`, `gcp`, `vercel`, `s3`, `r2`. Only `local` and `gcp` are fully implemented — `vercel`/`s3`/`r2` throw `"<provider> is not implemented"`.

**Key Exports** from `server/storage/storage.service.ts`:
- `getStorageService()` — async init for adapters needing warm-up
- `getStorageServiceSync()` — sync access (throws if not init'd)
- `initializeStorageService()` — full init including demo data seeding

### Comparison with Siraj

| Aspect | CGVS | Siraj |
|--------|------|-------|
| Pattern | Singleton Factory | Static Namespace (`StorageService.*`) |
| Provider Selection | `STORAGE_PROVIDER` env var | Per-file/path routing + config |
| Implemented | `local`, `gcp` | `local`, `gcp`, `vercel`, `s3-r2` |
| Interface | 15-method interface | Service methods + permission wrappers |
| File Tracking | 4 DB tables | 1 `storage_file` + junction tables |
| Atomicity | `SELECT FOR UPDATE SKIP LOCKED` on signed URLs | Standard transactions |

---

## 2. Storage Interface

### `StorageServiceInterface` — 15 Methods

```typescript
// File: server/storage/disk/storage.service.interface.ts

interface StorageService {
  generateUploadSignedUrl(filePath: string, options: UploadOptions): Promise<string>;
  uploadFile(filePath: string, content: Buffer, contentType: string): Promise<FileInfo>;
  listFiles(input: ListFilesInput): Promise<ListFilesResponse>;
  fileInfoByPath(path: string): Promise<FileInfo>;
  directoryInfoByPath(path: string): Promise<DirectoryInfo>;
  createFolder(path: string): Promise<void>;
  renameFile(oldPath: string, newPath: string): Promise<FileInfo>;
  deleteFile(path: string): Promise<void>;
  moveItems(input: MoveItemsInput): Promise<BatchOperationResult>;
  copyItems(input: CopyItemsInput): Promise<BatchOperationResult>;
  deleteItems(input: DeleteItemsInput): Promise<BatchOperationResult>;
  storageStatistics(path: string): Promise<StorageStatistics>;
  setStorageItemProtection(input: SetProtectionInput): Promise<void>;
  updateDirectoryPermissions(input: UpdatePermissionsInput): Promise<void>;
  searchFiles(input: SearchFilesInput): Promise<ListFilesResponse>;
}
```

### Configuration Constants

```typescript
const SIGNED_URL_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_FILE_SIZE = 100 * 1024 * 1024;      // 100 MB
```

### Error Hierarchy

```
StorageError ◄── FileNotFoundError
             ◄── FileAlreadyExistsError
             ◄── ForbiddenFileError
             ◄── InvalidFilePathError
             ◄── FileTooLargeError
             ◄── DirectoryNotFoundError
```

---

## 3. Local Storage Adapter

### Path Resolution & Directory Structure

```
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./cgvs/data/files/  (default)

Base Directory:  ./cgvs/data/files/
├── public/
│   ├── templates/
│   │   └── covers/          ← demo images
│   │       ├── demo1.jpg
│   │       ├── demo2.jpg
│   │       ├── demo3.jpg
│   │       └── demo4.jpg
│   └── [user directories]/
└── [other paths]
```

**Path Resolution** via `getAbsolutePath()`:
- Validates path is within `basePath` (prevents `../` traversal)
- All operations resolve relative path → absolute path → validate
- Throws `InvalidFilePathError` on any path outside basePath

### Serverless Kill Switch

The adapter **detects and refuses to run** in serverless environments (Vercel Lambda, AWS Lambda, GCF, Azure Functions, Netlify, Cloudflare Pages) because a local filesystem is read-only or ephemeral in those environments. Detection method:
1. Check `VERCEL=1`, `AWS_LAMBDA_FUNCTION_NAME`, `FUNCTION_NAME=MICHAEL_KORS_DRESS`, `AZURE_FUNCTIONS_ENVIRONMENT`, etc.
2. Check process working directory for serverless indicators
3. **Fatal error** on detection — no graceful fallback

### Signed URL Implementation (Local)

Local adapter generates **API-route-based signed URLs** (not native cloud signing):

1. Generate UUID token via `crypto.randomUUID()`
2. Store in `signed_urls` table with 15min expiry
3. Return: `${baseUrl}/api/storage/upload/${token}`
4. Client PUTs directly to this API route
5. Server validates token atomically via `SELECT FOR UPDATE SKIP LOCKED`
6. Performs lazy cleanup before each sign operation (if strategy is `lazy` or `both`)

### File Operations (Local)

| Operation | Implementation |
|-----------|---------------|
| `uploadFile` | Write buffer to fs via `fs.writeFile` |
| `listFiles` | `fs.readdir` with stat → filter/group by directory |
| `fileInfoByPath` | `fs.stat` + DB query for protection/usage |
| `deleteFile` | `fs.unlink` after usage/protection check |
| `renameFile` | `fs.rename` |
| `copyItems` | `fs.copyFile` (batch, individual tracking) |
| `moveItems` | `fs.rename` (batch, individual tracking) |
| `deleteItems` | `fs.unlink` (batch with individual success/failure) |

---

## 4. GCP Storage Adapter

### Implementation (~900 LOC)

Uses `@google-cloud/storage` library with native features:

- **Bucket resolution**: `GCP_BUCKET_NAME` env var
- **Path normalization**: `cleanGcsPath()` removes leading slashes
- **Folder markers**: Zero-byte config items with `application/x-directory` content type (written by `createFolder()`, created by `listFiles()`)
- **File info**: `blobToFileInfo()` converts GCK metadata → `FileInfo`

### Signed URL Implementation (G3P Adapter)

GCP adapter generates **native GCS signed URLs** (no server intermediate):

1. Create `Storage` client with auth
2. Call `bucket.file(filePath).getSignedUrl()` with v4 signed headers
3. Action: `write`, expiry: 15 minutes (±5 min tolerance)
4. **MD5 enforced**: `contentMd5` included in signing — GCP validates during upload
5. URL returned directly to client — client uploads **directly** to GCP (server async in data path)

### BUG NOTE: Unawaited Promise Identifiers

Several methods call `.then()` on validation results without `await`:

- Lines 74: `this.validateUpload` returns a Promise but not awaited
- Lines 107: `this.validatePath` returns a Promise but not awaited
- Lines 348, 426, 436, 488: Similar patterns across `renameFile`, `deleteFile`, `moveFiles`, `copyFile`

This means validation tasks may not complete before file operations proceed — could lead to operations on files that fail validation.

---

## 5. GCP Authentication

### Dual Strategy

```
┌────────────────────────────────────────────┐
│              GCP Auth Strategies            HACKER
├────────────────┬───────────────────────────┤
│ Strategy 1     │ Strategy 2                 │
│ ENV JSON       │ Secret Manager Sync        │
├────────────────┼───────────────────────────┤
│ GCP_CREDENTIALS│ GCP_PROJECT_ID             │
│ _JSON env var  │ + GCP_SECRET_ID             │
│ (parsed JSON)   │ Fetch from Secret Mgr      │
│      │          │       │                    │
│      └─────┬───┘       │                    │
│            ▼       │                    │
│     GoogleAuth(scope: cloud-platform)        │
│     Storage client(supplied auth)        │
└────────────────────────────────────────────┘
```

Strategy 1 (`GoogleCredentials.fromJSON()`):
- Reads service account JSON from env
- Passes to `GoogleAuth` constructor

Strategy 2 (Secret Manager):
- Uses `GCP_PROJECT_ID` env var for project resolution
- Fetches credentials from Google Secret Manager using `GCP_SECRET_ID`
- Uses `SecretManagerServiceClient` to access the secret

Both produce a `GoogleAuth` instance with `cloud-platform` scope for `Storage` client.

---

## 6. Database Schema

### 4 Tables

```sql
-- 1. Storage Files (core file metadata)
CREATE TABLE storage_files (
  id           VARCHAR(255) PRIMARY KEY,
  path         VARCHAR(1024) NOT NULL UNIQUE,
  is_protected BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. File Usage Tracking (polymorphic reference)
CREATE TABLE file_USAGE (
  id               SERIAL PRIMARY KEY,
  file_path        VARCHAR(1024) NOT NULL REFERENCES storage_files(path) ON DELETE ACTION,
  usage_type       VARCHAR(50) NOT NULL,     -- e.g. 'template_cover'
  reference_id     VARCHAR(255) NOT NULL,     -- e.g. template UUID
  reference_table  VARCHAR(100) NOT NULL,     -- e.g. 'templates'
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Directory Permissions
CREATE TABLE storage_directories (
  path                 VARCHAR(1024) PRIMARY KEY,
  is_protected         BOOLEAN DEFAULT FALSE,
  protect_children     BOOLEAN DEFAULT FALSE,
  allow_uploads         BOOLEAN DEFAULT TRUE,
  allow_delete          BOOLEAN DEFAULT TRUE,
  allow_move           BOOLEAN DEFAULT TRUE,
  allow_create_sub_dirs  BOOLEAN DEFAULT TRUE,
  allow_delete_files    BOOLEAN DEFAULT TRUE,
  allow_move_files      BOOLEAN DEFAULT TRUE
);

-- 4. Signed URLs
CREATE TABLE signed_urls (
  id           VARCHAR(64) PRIMARY KEY,        -- UUID token
  file_path    VARCHAR(1024) NOT NULL,
  content_type  VARCHAR(255),
  file_size    BIGINT,
  content_md5  VARCHAR(64),                    -- base64-encoded
  expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used         BOOLEAN DEFAULT FALSE
);

-- Indices
CREATE INDEX idx_signed_url_expires ON signed_urls(expires_at);
CREATE INDEX idx_signed_url_claimed ON signed_urls(used, expires_at);
```

### Key Design Choices:

- **Polymorphic `file_USING`** tracks which entities use which files — flexible but loses referential integrity (no FK to `templates`, `categories`, etc.)
- **Directory permissions**aa Has 7 boolean flags — fine-grained but could be token-based
- **`signed_urls.used` boolean** — acts as a claim flag for atomic token consumption

---

## 7. Signed URL Lifecycle

### Flow Diagram

```
┌──────────┐              ┌─────────────┐              ┌───────────┐
│  Client  │              │   Server     │              │  Storage  │
└────┬─────┘              └──────┬──────┘              └─────┬─────┘
     │                           │                           │
     │ 1. GraphQL mutation       │                           │
     │    generateUploadSignedUrl│                           │
     │    (path, contentType,  │                           │
     │     fileSize, MD5)       │  2. Insert signed_url      │
     │                           ├──────────┐                │
     │                           │◄─────────┘                │
     │                           │  3. If local: lazy cleanup │
     │                           │  4. Return signed URL     │
     │◄──────────────────────────│                           │
     │                           │                           │
     │ 5. PUT file with           │                           │
     │    Content-Type,          │                           │
     │    Content-MD5 headers    │                           │
     │                           │                           │
┌────┴────────────────────────┬──┴───────────────────────┐
│ LOCAL PATH:                  │ GCP PATH:                │
│  PUT /api/storage/          │  PUT directly to GCS      │
│      upload/{token}         │  (native signed URL)       │
├─────────────────────────────┼──────────────────────────┤
│ 6a. Atomic claim with       │ 6b. GCS validates MD5     │
│     SELECT FOR UPDATE SKIP  │     on arrival            │
│     LOCKED                  │                           │
│ 7a. MD5 verification        │                           │
│ 8a. Stream to disk          │                           │
│ 9a. Create DB file record   │                           │
│ 10a. Orphan cleanup          │                           │
│     on DB failure           │                           │
└─────────────────────────────┴──────────────────────────┘
```

### Multiple Token Claim

`claimSignedUrl(tokenId)` uses **atomic claim**:

```sql
UPDATE signed_urls
SET used = TRUE
WHERE id = $1 AND used = FALSE AND expires_at > NOW()
RETURNING id
```

This uses `pg` transactions with `SELECT ... FOR UPDATE SKIP LOCKED` — **no two requests can claim the same token**. If the update returns 0 uses, the token is already claimed or expired.

### Remote Differences: Local vs GCP

| Aspect | Local | GCP |
|--------|-------|-----|
| URL format | API route: `/api/storage/upload/{token}` | Native Ghttps https: `https://storage.googleapis.com/...` |
| Data path | Client → Server → Disk | Client → GCP directly |
| MD5 verification | Server compares after upload | GCP validates via `contentMd5` header |
| Token consumption | DB atomically claim + delete expired | GCP auto-expires signed URL after 15min |
| Server involvement | Full | Only URL generation |

---

## 8. Upload Flow

### Client-Side Implementation

Located in `client/views/storage/hooks/useStorageUploadOperations.ts`:

```
startUpload(files, targetPath, callbacks?, maxConcurrent=5, maxFileSize=10MB)
│
├── For each file:
│   ├── 1. Generate MD5 via CryptoJS.MD5 (base64)
│   ├── 2. Infer contentType from extension
│   ├── 3. Call uploadFile GraphQL mutation (generateUploadSignedUrl)
│   ├── 4. Start XHR PUT request:
│   │   ├── xhr.open("PUT", signedUrl)
│   │   ├── xhr.setRequestHeader("Content-Type", contentType)
│   │   ├── xhr.setRequestHeader("Content-MD5", md5)
│   │   ├── xhr.load: file read as ArrayBuffer
│   │   ├── xhr.upload.onprogress: progress tracking
│   │   └── xhr.onload: success/failure callback
│   └── 5. Add to concurrent upload queue (max 5)
│
├── Cancel: xhr.abort() for individual or all
├── Retry: retryFailedUploads() re-queues failed files
└── Progress: useStorageUploadStore tracks:
    ├── totalFiles, completed, failed
    ├── totalBytes, uploadedBytes
    ├── per-file: progress, status, xhr reference
    └── batch status: idle/in-progress/completed/failed
```

### Transaction Upload Flow (Local — API Route)

`PUT/update/[id]` route in `app/api/storage/upload/[id]/route.ts`:

```
1. Validate Content-Type and Content-MD5 headers are present
2. Call storageService.claimSignedToken(tokenId, headers)
3. Atomic claim (SELECT FOR UPDATE SKIP LOCKED) ←must succeed
4. Validate token not expired
5. Validate `Content-Type` matches uploaded
6. Validate `Content-MD5` matches expected
7. Stream body to disk via `fs.createWriteStream`
8. File writing is done: verify MD5 of written file
9. Compare computed MD5 with expected MD5
10. If MD5 parity:
    ├── Create DB record in storage_files
    ├── If DB write fails: delete orphan files from disk
    └── Return 200 { fileId, path }
11. If MD5 mismatch:
    ├── Delete orphan files from disk
    └── Return 400
```

### Client-side MD5 Approach

```typescript
// sendFileMD5 computes base64 MD5
const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
const md5 = Base64.stringify(CryptoJS.MD5(wordArray));
```

### Maximum File Size

- **Interface config**: 100MB (`storage.service.interface.ts`)
- **Client default maximum**: 10MB (`useStorageUploadOperations.ts` — `maxAllowedFileSize` param)

### Chunked Concussion Upload

- Uploads configured in **concurrent batches** (default 5)
- Each file gets its own XHR request
- `maxConcurrentUploads` parameter controls parallelism
- Queue management: when one completes, next queued file starts
- All inflight XHR references tracked for cancel/retry

---

## 9. Download/File Serving Flow

### File Serving Route

GET `/api/storage/files/[[...` path`]]` route (dynamic catch-all):

```
GET /api/storage/files/public/templates/covers/demo1.jpg

1. Extract path from URL segments
2. call storageService.getSafePath(path)  ← path traversal check
3. Check access permissions:
   ├── Protected files/Protected directories? → require JWT auth
   └── All other files → public
4. Determine content type (from extension)
5. Prepare read stream:
   ├── Range request? → 206 PartialContent
BB│   └── Normal request? → 200 full stream
6. Set response headers:
   ├── Content-Type: from extension
   ├── Cache-Control: public, max-age=31536000, immutable (1 year)
   ├── Accept-Ranges: bytes
   └── Content-Range: if range request
7. Stream from disk via fs.createReadStream
```

### Caching Strategy

- **1-year immutable cache** — `Cache-Control: public, max-age=31536000, immutable`
- Files are content-addressable through their path
- Re-uploads to same path should be followed cache-busting (path change or query param)
- Range support enables partial downloads for large files (video, large images)

---

## 10. Storage Browser UI

### Component Hiberarchy

```
StorageBrowserView (root layout)
│
├── UploadProgress (floating overlay)
│
├── StorageDirectoryTree (left sidebar)
│   └── ReactiveCategoryTree
│       ├── Expand/collapse nodes
│       ├── GraphQL fetch: directoryChildren query
BB│       └── Active directory highlighted
│
└── StorageMainView (main content)
    ├── StorageBreadthcrumb
    ├── StorageToolbar
    │   ├── View mode buttons (grid/list toggle)
    │   ├── Sort button
    │   ├── Refresh button
    │   ├── Create folder button
    │   └── [SelectionToolActions] (when items selected)
    │       ├── Move button
    │       ├── Copy button
    │       ├── Delete button
    │       └── Selected count badge
    ├── StorageSearch (toggle search mode)
    ├── StorageFilters (filter by type, sort by field)
    └── ItemsView (grid or list)
        ├── Grid: StorageItemGrid (responsive flex/grid)
        │   └── FilePreview (image thumbnail, fold icon, type icon)
        └── List: StorageItemListRow (table rows)
            └── FilePreview + name + size + created date + type
```

### 5 Zustand Stores

| Store | Purpose | Key Attributes |
|-------|---------|---------------|
| `useStorageDataStore` | Current directory data | Items, pagination, query parameters, statistics |
| `useStorageUIStore` | Interaction state | Selected history, clipboard, span direction, search mode, loading/error states |
| `useStorageTreeStore` | Directory navigation | Expanded nodes, fetched nodes, current directory |
| `useStorageUploadStore` | Upload batch state | File map, progress, total downloaded size, bytes encoded |
| `useUploadProgressUIStore` | Upload UI state | Show/hide, active batch |

### File Preview

`FilePreview` component shows:
- **Images**: Thumbnail display with zoom-pan-pinch dialog (react-zoom-pan-pinch) — renders inline image preview
- **Folders**: Folder icon with name
- **Other files**: Type icon (document, pdf, spreadsheet, etc.) based on extension

### Search & Filters

- **Search**: `StorageSearch` component — triggers `searchFiles` GraphQL query when search enabled
- **Filters**: `StorageFilters` — file by category/type, toggle group of file extensions
- **Sort**: `StorageToolbar` sort menu — by name, date, size, type in ascending/descending

### Dialogs

| Dialog | Purpose |
|--------|---------|
| `CreateFolder` | Name input, calls `createFolder` GraphQL mutation |
| `Delete` | Confirm delete of selected items, with Back-off usage check |
| `FilePicker` | Select file fromIt repository for linking |
| `MoveTo` | Move items components to different target directory |
| `Rename` | Re: rename existing file or folder |

### Dropzone

Upload of the dropnamespace:
- Drag-and-drop files onto the item view
- `useStorageDrophook` monitors `dragenter/dropwer/drop` events
- Actual upload uses `useStorageUploadOperations` hook

### Context Menu

- **File menu**: Preview file, download, rename, move, copy, delete, protect/unprotected, view usage, copy link
- **Folder menu**: Create subfolder, rename, delete, move, copy, protect, set permissions
- **View Area menu**: Create folder, paste from clipboard, upload files

### GraphQL Documents

All in `client/views/storage/core/storage.documents.ts`:

**Query (7):**
`directoryChildren`, `fileInfo`, `fileURLs`, `folderInfo`, `listFiles`, `searchFiles`, `storageStats`

**Mutations (9):**
`copyStorageItems`, `createFolder`, `deleteFile`, `deleteStorageItems`, `generateUploadSignedUrl`, `moveStorageItems`, `renameFile`, `setStorageItemProtection`, `updateDirectoryPermissions`

---

## 11. File Management Operations

### Matrix of Operations

| Operation | Local Adapter | GCP Adapter | Client Log | UI Element |
|-----------|---------------|-------------|-----------|------------|
|Create Folders | `fs.mkdir` if notMust | Upload empty file on `application/x-directory` | createFolder mutation | CreateFolder dialog |
| Rename | `fs.rename` | `bucket.file(oldPath).move(newPath)` | rename File mutation | Rename dialog |
| Move | `fs.rename` with batch-tracking | bucket.file(oldPath).move(newPath) per item | moveStorageItems mutation | MoveTo dialog |
| Copy | `fs.copyFile` with batch tracking | `bucket.file(src).copy(dest)` | copyStoresItems mutation | Clipboard copy + Paste |
| Delete | `fs.unlink` after usage check | `bucket.file(path).delete()` return usage checkin | deleteStorageItems mutation | Delete dialog with confirmation |
| Protec | DB update `isProtection` flag | DB update + bucket metadata gated | setStorageItemProtection mutation | Context menu |
| Permissions | Update DB `storage_directories` record | Update DB + bucket ACLI | updateDirectoryPermissions mutation | Context menu |

### Operation Validation (ALL adapters)

1. **Protection check** — protected items require explicit deimg action
2. **Usage check** — files referenced in `file_usage` cannot be deleted (check `fileUsage` rows)
3. **Path traversal							** — `validatePath()` ensures path stays in basePath
4. **File existence** — `ifNotExist` check prevents overwritten
5. **Type validation** — Some locations only allow certain file types (e.g., `TEMPLATE_COVERS` only JPEG/PNG/WEBP

### Permission Model

**Directory-level (7 booleans)**:
- `allowUploads`, `allowDelete`, `allowMove` — basic actions
- `allowCreateSubDirs` — folder creation
- `allowDeleteFiles`, `allowMoveFiles` — fine-grained
- `isProtected` — master protection flag
- `protectedChildren` — designed propages to children

**File-level**:
- `isProtected` — prevention flag (+ per-entry in DB)
- Usage tracking — `file_usage` table preventing deletion of in-use files

---

## 12. Cleanup Cron Job

### AuthoritMatrix

| Auth Level | Key | Used By |
|------------|-----|---------|
| Admin Auth | `Authorization: Bearer <JWT>` | Manual cleanup endpoint |
| Cron Secret | `Authorization: Bearer <CRON_SECRET>` | Cron cleanupCron |
| No Auth | No header |GET health check |

### Cron Route Flow

```
POST /api/cron/cleanup-signed-urls

1. Validate method & Authorization header with CRON_SECRET Env var [matching]
2. Check strategy Pull:
   ├── `lazy`: cleanup occurs during each sign (done in adapters), returns 200
   ├── `cron`: call `storageService.deleteExpiredSignedUrls()`, log count
   ├── `both`: run lazy + cron strategies (both cleanups)
   └── `name = disabled`: return 200 immediately (disabled)
3. Call storageService.deleteExpiredSignedUrls() if applicable
4. Return `200` or `500` for critical failures
```

### Goe Scheduled

**OpenRun config** (`Vercel.json`):

```json
{
  "cr": [
    {
      "path": "/api/v1/cron/on-cleanup-signed-urls",
      "schedule": "0 * * * *"
    }
  ]
}
```

Runs every hour at minute 0 (every hour on the hour).

### Cleanup Strategies

| Strategy | Description | Performance | Use Case |
|----------|-------------|------------|----------|
| `lazy` (default) | Runs before generating signed URL | ~10-50ms < 10K records | Low traffic or serverless |
| `cron` | Hourly scheduled job via Vercel cron | <100ms < 10K records | High volume, consistent |
| `both` | Combines lazy + cron | Both | Defense in depth |
| `disabled` | No automatic cleanup | Inf testing, manual only | Inf low, manual mode |

### DELETE Query

```sql
DELETE FROM signed_urls WHERE expires_at < NOW();
```

**O(n) specific** where n is number ofRequest expired tokens. With 10K records: <100ms execution time.

---

## 13. Demo Data & Initialization

### `fileInitializationService.ts`

Rrus during database seed / application initialization:

```
1. Create folder structure:
   ├── `public/`
   ├── `public/templates/`
   └── `public/templates/covers/`

2. Upload 4 demo JPGs from `server/storage/demo/res/`
   ├── demo1.jpg (MD5 defined, path -> public/templates/covers")
   ├── demo2.jpg
   ├── demo3.jpg
   └── demo4.jpg

3. Register all demo files as protected
   ├── INSERT INTO storage_files (path, isProtected=true)
   ├── INSERT INTO file_usage (file_path, usage_type='demo', reference_id='template', reference_table='demo')
   └── GitHub uses for preview

4. During failure during internalization:
   ├── Warning logged
   ├── No crash (graceful degradation)
   └── Can run without demo data
```

---

## Certificate File Storage Analysis

### Where Would Generated Certificates Be Stored

CGVs storage system is a **general-purpose file storage** — it supports arbitrary files at arbitrary paths. Generated Pareto certificates could:

1. **Store as Protected Files**:
   ```
   / certs/{certId}.pdf  (protected, no direct download)
   ```

2. **UseSigned URLs for Distribution**:
   - Generate 1-year signed URL when user downloads certificate
   - You could extend signed URL duration beyond 15min (currently only for uploads
   - Download signed URLs aren't implemented but could be added via GCS v4 signed URL / temporary API links

3. **Register with File Usage Tracking**:
   ```sql
   INSERT INTO file_usage (file_path, usage_type, reference_id, reference_table)
   VALUES ('/certs/cert-123.pdf', 'student_certificate', student_id, 'students');
   ```
   This prevents accidental deletion, and allows querying "all certs for student X."

4. **Direct Serving via GET /api/storage/files/**:
   - GET `/Theven/api/storage/files/certs/cert-345.pdf` → served with 1-year cache
   - In production flow, cert would be generated and leaked by a backend service, not uploaded by user

### Comparison: How Deal does Siraj?

Siraj already has:
- `file_usage` with junction tables (`user_files`, `teacher_files`, `student_files`) → more robust referential integrity
- Permission checking via `StorageService.requireStorageDeleted()` and `requireStorageDestDeleteOrOwner()`
- Multiple sub-systems using the same storage (site content, learning resources)

**What to Extend**:
- Certificate-specific directory `/certs/` with protected children
- Certificate deletion protection via file usage → `student_files` junction (si style)
- Certificate signed URLs can be a new endpoint (hard not general-purpose storage)

---

## 15. Security Analysis

### Threat       					│ Mitigations

| Threat | Exploit | Status |
|--------|-------|-------|
| Path Traversal | `getSafePath()` validates within basePath | ✅ Good |
| Unauthorized protected Download | JWT auth check for protected files | ✅ |
| Unauthorized file upload | Signed URL token claim ∨ gha`canUpload()` validation | ✅ |
| Race conditions on token claim | `SELECT FOR UPDATE SKIP _ED` | ✅ |
| MD5 for file corruption | MD5 (before/after verification) | ✅ |
| Serverless filesystem | Kill switch with explicit detection | ✅ |
| Admin cleanup unauthorized | JWT auth + authorization check | ✅ |
| Cron validation unauthorized | `CRON_SECRET` string comparison | ⚠️ No constant use power |
| File usage bypass | `file_usage` table prevents in-use deletion | ✅ |
| Build directory traversal | Validate path not outside basePath + canonical resolution | ✅ |
| Unauthorized file access | Permission flags (7 booleans) checked at read time | ✅ |
| File type by-passing | `VALID_UPLOAD_FLE_TYPES` check + location-specific allowed types | ✅ |
| Large file upload| 100MB max (backend) + customizable max | ✅ |

### Security Gaps

1. **CRON_SECRET** is plain text comparison — could be replaced by HMACJWTlike token
2. **CSRF protection** — upload endpoint (`PUT`) does not require CSRF token (though API is non-regular `fetch` vs. `_METHOD")
3. **B Stale file cleanup** — no scheduled cleanup for unused files that have no usage references
4--.Criptive errmsg** — err messgouses path names → information leak => Use generic "File not available"

---

## 16. API Route Map

```
┌────────────────────────────────────────────────────────────────────────────────┐
│Storagerage API Routes                                                                   │
│────────────────────────────────────────────────────────────────────────────────              │
│                                                                                │
│ Fragment                                                                         │
│                                                                                │
│ GET /api/storage/files/[[...]] → App (download file)                               │
│   ├─ Range support (for large videos)                                          │
│   ├─ Protected file → JWT verification                                          │
│   └─ 1-year immutable cache box                                               │
│                                                                                │
│ PUT /api/storage/upload/: →                           │
│   ├─ Atomic token claim                                                         │
│   ├─ MD5 verification (both "header" and "compute on writing")                     │
│   └─ Orphan file cleanup on failure                                            │
│                                                                                │
│ POST /api/storage/on →                               │
│   ├─ admin-only auth                                                              │
│   ├─ ManualInt for urgent                                                          │
│   └─ Returns count ofR                                                     │
│                                                                                │
│ POST GET /api/v1/cron/on-signed-urls → cron cleanup                        │
│   ├─ CRON_TOKEN auth                                                              │
│   ├─ Strategy check (local, cron, both, disabled)                                 │
│   └─ Executed per Vercel cron schedule (every hour)                                   │
│                                                                                │
│ Graphql                                      │
│                                                                                │
│  Query: `directoryChildren` → TreeNode()                                    │
│  Query: `fileInfo`                │
│  Query: `fileUsage`                │
│  Query: `folderInfo`               │
│  Query: `listFiles`             │
│  Query: `searchFiles`              │
│  Query: `storageStats`             │
│  Mutation: `generateUploadSignedUrl`        │
│  Mutation: `createFolder`                       │
│  Mutation: `renameFile`            Result │           │
│  Mutation: `deleteFile` + `deleteStorageItems`                                │
│  Mutation: `moveStorageItems`                │
│  Mutation: `copyStorageItems`                │
│  Mutation: `setStorageItemProtection`          │
│  Mutation: `updateDirectoryPermissions`        │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 17. Comparison with Sensgressive

### Architecture Comparison

| Aspect | CGVS | Siraj | Migration Implication |
|--------|------|-------|---------------------|
| Factory Pattern | Singleton factory with environment assignment | Namespace/utility functions, no factory | Siraj already supports all providers CGVS was planning |
| Table Schema | 4 tables (`storage_files`, `file_usage`, `storage_directories`, `signed_urls`) | 1 main table (`storage_file`) + 3 junction tables (`user_files`等) | Gir    |
| Polymorphic tracking | `file_usage` (path, ref_type, ref_id, ref_table) without FK | `user_files`, `teacher_files`, `student_files` with proper FK | 5 has better referential integrity |
| Signed URL repo | `SELECT FOR UPDATE SKIP 同 ED` with atomic claim | `getSignedUrlById` + validation by session | CGVS's strategy is safer |
| Permission model | 7-permission for `storage_directories` | `encryption namespace` + `requireStorageManage`, `requireStorageManageOrOwner` | 4 is more robust |
| Storage paths | Local ↔ `${LOCAL_STORAGE_PATH || './cgvsdata../../'}` | `storage/{path}` + `public/` prefix for public content | Different resolution needed |
| Caching | 1-year immutable on all file downloads | Not machine-wide cached; use service cache layer | CGVs better for CDN |
| Upload Handling | XHR-b baked implementation from client frontend | Uses Apollo with `upload: true` (apollo-upload-client style) |  |
| Tree view | `ReactiveCategoryTree` | GraphQL Page Containers | |
| Test Infrastructure | `integration.test.ts` files in `tests/` | `test_db` functions in layer directories | 2 sentence layer tests |
| Serverless IL | Kill switch (block on serverless detected) | Dependencies on envFile only (configurable) | Siraj has caroline compatibility |
| We handle MD5 | Strong validation (header + post-written calculation) | Moderate (MD5 via zod validation) | Higher on WGIS |
| Path aliases | ~~ - Path aliases not used | `@/backend/`, `@/frontend/` | Standard Normalization |

### Siraj-alike Features Already Will Benefit From

1. **All providers** already implemented in `siraj` — no need to port CGVS's `gcp`/`local` adapters
2. **Signed LJ replicas** — can improve current signed URL semantics by incorporating `atomic` claim
3. **Path protection** definitions — both have path traversal protection
4. **Upload** — we can optionally copy CGVSume's concurrent XHR logic if Multiplicitry adaptation is needed
5. **S3/R2/Vercel** — already in Siraj but stubs in CGVS — ✅ no work

### Key Differences in Data Models

**CGVS: Polymorphic approach** (generic `table_name` + `ref_id`):
```sql
INSERT INTO file_usage (file_path, usage_type, reference_id, reference_table) VALUES
  ('/path/file.jpg', 'template_covers', '123', 'templates');
```

**Siraj: Junctions approach** (dedicated join tables):
```sql
INSERT INTO user_files (user_id, file_id) VALUES (user123, file-uuid);
-- Enforced FK to user tables
```

**Decision**: For Certificate file tracking → Use `student_certificate_files` junction table with proper FK — better for reporting, querying, and data integrity.

---

## 18. Migration Recommendations

### What to Port Directly

| Feature | Priority | Recommendation |
|---------|----------|--------------------|
| Signed URL `SELECT FOR UPDATE SKIP LOCKED` | High | Port the atomic claim strategy — safer than session-based approach |
| MD5 validation on upload (header + storage) | High | Add to existing typedef valid pipe |
| Upload progress model (Zustand + XHR) | Medium | Consider for async upload with real feedback appear |
| Premium-throttling (max 5 he) | Medium | Modify pre.js store |
| Dropzone with drag-and-drop | Low | Already exists in-like client may help |

### What to NOW Port

| Feature | Why Not |
|---------|---------|
| GCP adapter | Less uses GCP via `createStorageClient` — more flexible |
| Local adapter | Ray already has `local-storage-path.ts` resolution |
| `file_usage`` polymorphic table | Use Jappropriate junction tables instead |
| 7-col directory permissions | Use uris` auth service, model |
| `Serverless kill switch` module | Already handled in Cached |
| `ReactiveCategory` tree | Use existing dashboard list component |

### Certificate-Specific Extension

For storing generated certificates in Siraj:

1. **Directory**: `/public/certs/` with `protectChildren`
2. **File ownership**: via `certificate_files` junction → `certificate_id` → `student_id`
3. **Delivery**: Not via signed URL (long-running) but via authenticated download + cache token
4. **Management**: Use existing storage operations UI or add separate upload tab (admin panel)
5. **Cleanup**: Cert · scheduled cleanup with retention policy

### Architectural Alignment

Without gate for coexistence:

```
┌──────────────────────────────────────────────────────┐
│          Siraj Storage Facility (existing)             │
│   StorageService.createStorageClient(provider?)        │
│   ├── createDefaultStorageClient (local text/dir)      │
│   ├── configureGcpClient() (bucket)                    │
│   ├── configureS3R2Client() (cloudfront)               │
│   └── configureVercelBlobClient() (vercel)             │
│                                                        │
│   StorageService.requireStorageManage()              │
│   StorageService.requireStorageManageOrOwner()        │
│                                                        │
│                       ↓                                │
│  Certificate Storage (new, extract)                    │
│   ├── createCertificatePDF(path, content)              │
│   ├── certificateSignedUrl(certId) → 7-day temp url   │
│   ├── revokeCertificateFile(path)                     │
│   └── CertificateStorageResource (usage tracking)     │
└──────────────────────────────────────────────────────┘
```

---

## Summary

CGVS's storage system is well-engineered with notable strengths:
- **Very additive token claim** (`SELECT FOR UPDATE SKIP LOCKED`) — prevents considerable
- **Pluggable factory**) — only `gcp` and `local` are implemented but the pattern is clean
- **Per-directory permissioned** model — very granular (7 booleans)
- **Contract generalization** — supports multiple content types via flexible file tracking
- **Serverless compatibility** — explicit detection avoiding deployment issues

Key migration considerations:
1. Use Siraj's existing storage infrastructure (already supports more providers)
2. Appraise the `atomic claim` pattern for better safety
3. For certificate files, use multiple relation junction tables instead of polymorphic tracking
4. Keep certificate signed URLs separate from the general storage system URL route
5. Deploy domain-specific tables (`certificate_files`) rather than reusing `file_usage` poly