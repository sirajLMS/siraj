# M5 — Storage & File Integration Analysis

## 1. How `StorageRepository.registerFileUsage()` Works for Complaints

### Flow
1. **Input**: `FileUsageRegisterInput` with `{ referenceTable: "complaints", referenceId: <complaintId>, usageType: string, filePath: string }`
2. **Step 1 — `createFile(filePath)`**: Upserts a row in `storage_file` table using `onConflictDoUpdate` on the `path` unique column. Returns the file entity with its UUID.
3. **Step 2 — `performJunctionInsert()`**: Switch-case on `referenceTable`. For `"complaints"` (line 300-301):
   ```ts
   case "complaints":
     await db.insert(complaintFiles).values({ fileId, complaintId: refId, usageType: type, createdAt });
   ```
   Inserts into the `complaint_files` junction table linking `file_id` → `complaint_id`.

### Key Points
- The `complaintFiles` junction table (schema lines 112-129) has: `id`, `fileId`, `complaintId`, `usageType`, `createdAt`
- Both FK references use `onDelete: "cascade"` — if the `storage_file` or `complaint` row is hard-deleted, the junction row cascades
- `usageType` is a free-form varchar(100) — for complaints this would likely be `"attachment"` or `"evidence"`
- The `registerFileUsage` method accepts an optional `locale` parameter for i18n error messages
- **No file count or size validation exists at the repository level** — this must be enforced in the service layer

### Unregister Flow
- `unregisterFileUsage(filePath, usageType, referenceId)` finds the file by path, then deletes from ALL junction tables (including `complaintFiles`) matching `fileId + usageType + referenceId`
- Uses `deleteBusinessRelatedUsages()` which handles `complaintFiles` deletion (lines 409-416)

## 2. `ResourceUploadDropzone` Component Pattern

### Props Interface
```ts
interface ResourceUploadDropzoneProps {
  readonly labels: ResourcesLabels;
  readonly selectedFileName: string;
  readonly hasError: boolean;
  readonly errorMessage?: string;
  readonly onFileSelect: (fileName: string) => void;
  readonly variant: "desktop" | "mobile";
}
```

### Pattern Details
- **Single file upload**: Uses `<input type="file" hidden accept=".pdf,.docx,.pptx,.xlsx" />`
- **Callback**: `onFileSelect` receives only the file name (not the File object)
- **Visual**: Dashed border box with `CloudUploadOutlined` icon, title, and hint text
- **Error state**: Border changes to `theme.palette.error.main`, error message displayed below
- **Selected file display**: Shows file name in bold `labelMd` variant when selected
- **Supported formats hint**: Always shown below the dropzone
- **Responsive**: Padding and icon size change based on `variant` (mobile vs desktop)
- **MUI components used**: `Box`, `Typography`, `CloudUploadOutlined` icon
- **Theme tokens**: `palette.outlineVariant`, `palette.surfaceContainerLow`, `palette.surfaceContainer`, `palette.primary.main`, `layout.radius.card`

### Form Integration (ResourceUploadForm)
- The dropzone is placed inside a `Box` with `flexDirection: "column"` and gap
- `hasError` is derived from `Boolean(errors.fileName)` (react-hook-form)
- `errorMessage` comes from `errors.fileName?.message`
- `onFileSelect` is passed from parent container (not directly wired to form control)
- The form uses `Controller` for text fields but the dropzone is managed externally via state

## 3. System Settings Keys — Existing and New

### Existing Keys (from `system-settings.ts` seeder)
| Key | Value | Category | DataType |
|-----|-------|----------|----------|
| `auth_max_attempts` | 5 | security | integer |
| `auth_lockout_minutes` | 15 | security | integer |
| `password_reset_expiry_hours` | 24 | security | integer |
| `cache_default_ttl_seconds` | 3600 | system | integer |
| `session_activation_window_before_minutes` | 5 | scheduling | integer |
| `default_timezone` | UTC | scheduling | string |
| `session_absent_waiting_minutes` | 30 | scheduling | integer |
| `session_leave_reschedule_offset_days` | 7 | scheduling | integer |
| `teacher_max_leaves` | 2 | scheduling | integer |
| `student_max_leaves` | 2 | scheduling | integer |

### Existing Categories
- `security` — auth/lockout/password settings
- `system` — cache/TTL settings
- `scheduling` — session/leave/timezone settings

### New Settings Needed
| Key | Default | Category | DataType | Description |
|-----|---------|----------|----------|-------------|
| `complaint_max_file_size_mb` | 25 | **communication** (new) | integer | Max file size in MB for complaint attachments |
| `complaint_max_files_per_complaint` | 5 | **communication** (new) | integer | Max number of files attachable per complaint |
| `sms_rate_limit_per_hour` | 3 | **communication** (new) | integer | Max SMS notifications sent per parent per hour |

### Category Decision
- **New category needed: `communication`** — none of the existing categories (security, system, scheduling) are appropriate
- The `createSetting` helper function's `category` parameter type is `"security" | "system" | "scheduling"` — this union must be extended to include `"communication"`
- The `systemSettings` schema itself uses `varchar("category", { length: 100 })` so no DB schema change needed — only the seeder's TypeScript type needs updating

### Repository Access Pattern
- `SystemSettingsRepository.getIntValue(key, defaultValue)` — perfect for all three new settings (integer type with fallback)
- `SystemSettingsRepository.getStringValue(key, defaultValue)` — not needed for these settings
- Both methods accept optional `tx` (DB transaction) parameter

## 4. File Type Validation Approach

### Current Pattern (ResourceUploadDropzone)
- Uses HTML `accept` attribute: `accept=".pdf,.docx,.pptx,.xlsx"`
- No server-side MIME type validation visible in the dropzone component
- Validation is purely client-side via browser file picker filtering

### Recommended Approach for Complaints
- **Client-side**: Use `accept` attribute with allowed extensions (e.g., `.pdf,.jpg,.jpeg,.png,.doc,.docx`)
- **Client-side validation**: Check `file.type` (MIME) and `file.size` before upload
- **Server-side**: Validate MIME type and file size in the service layer before calling `registerFileUsage()`
- **Settings-driven**: Use `complaint_max_file_size_mb` from system settings for size limit
- **Extensions to allow**: Images (jpg, jpeg, png, gif, webp) + Documents (pdf, doc, docx) — typical for complaint evidence

### MIME Type Mapping
```
Images:  image/jpeg, image/png, image/gif, image/webp
Docs:    application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

## 5. File Deletion Cascade on Complaint Soft-Delete

### Soft-Delete Mechanism
- The `complaints` table (in `communications.ts`) has a `deletedAt` timestamp column (line 130)
- RLS (Row Level Security) policies filter out records where `deleted_at IS NOT NULL` for SELECT/UPDATE
- Soft-delete sets `deletedAt` to current timestamp — the row remains in the database

### Cascade Behavior
- The `complaintFiles` junction table references `complaints.id` with `onDelete: "cascade"`
- **Critical**: `onDelete: "cascade"` only triggers on **hard delete** (physical row removal), NOT on soft-delete
- When a complaint is soft-deleted:
  - The `complaint_files` junction rows **remain intact**
  - The `storage_file` rows **remain intact**
  - Files are still accessible via direct path
  - `isFileInUse()` will still return `true` for these files
  - `getFileUsages()` will still list the complaint as a user of the file

### Implications
- **No automatic file cleanup on soft-delete** — files persist and remain "in use"
- If file cleanup is desired on soft-delete, it must be explicitly handled in the service layer:
  1. Call `unregisterFileUsage()` for each attached file
  2. Optionally delete the `storage_file` row and the physical file from storage
- Alternatively, a background job could periodically clean up files linked only to soft-deleted complaints
- For Sprint 15, the service layer should handle file cleanup when processing complaint soft-delete if needed

### Hard Delete Scenario
- If a complaint is hard-deleted (unlikely with soft-delete pattern):
  - `complaint_files` junction rows cascade-delete automatically
  - `storage_file` rows do NOT cascade (no FK from storage_file to complaint_files)
  - Physical files on disk/MinIO remain and become orphaned
  - `isFileInUse()` would return `false` after junction rows are gone
