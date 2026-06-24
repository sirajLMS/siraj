# Task E2 — Complaint Service File Attachment Extension

## Sprint 15 · Services Layer · Section 6

---

## Objective

Extend `ComplaintService.submitComplaint()` to handle file attachments with validation against system settings. Add a new `getComplaintFiles()` method for authorized access to complaint attachments.

---

## Dependencies

| Task | Description |
|------|-------------|
| B3 | ComplaintRepository file listing methods |
| C | System settings repository extensions for complaint settings |

---

## Layer-Specific Rules

- **🚫 NO Local Type Definitions**: Service files MUST NOT define local types. All entity types MUST be imported from canonical `backend/types/{entity}.types.ts` files.
- **Import canonical types**: Services MUST import types from `@/backend/types` — use `ComplaintEntity`, `ComplaintFileEntity`, `FileMetadata` etc. from their respective canonical `.types.ts` files.

---

## Target Files

| File | Action |
|------|--------|
| `backend/services/communication/complaint.service.ts` | Extend `submitComplaint`, add `getComplaintFiles` |

---

## Pre-Implementation Checklist

- [ ] Read `backend/services/AGENTS.md` for service layer rules
- [ ] Read `backend/db/repo/AGENTS.md` for repository conventions
- [ ] Verify `ComplaintRepository.getComplaintFiles()` exists
- [ ] Verify `StorageDbRepository.registerFileUsage()` signature and parameters
- [ ] Verify `SystemSettingsRepository.getIntValue()` exists and accepts default value
- [ ] Confirm `complaintFiles` table schema in `backend/db/schema/storage.ts`
- [ ] Confirm `complaints` table has `id` column for `referenceId`
- [ ] Verify allowed MIME types list matches frontend upload component configuration

---

## Implementation Details

### 1. Constants

Define the allowed MIME types as a constant at the top of the file.

```typescript
const ALLOWED_COMPLAINT_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
] as const;
```

---

### 2. Extended `submitComplaint()` Signature

The method now accepts an optional `filePaths` parameter and optional `fileMetadata` for size validation.

```typescript
// FileMetadata imported from @/backend/types/complaints.types

export async function submitComplaint(
  actorUserId: string,
  input: {
    parentId: string;
    studentId?: string | null;
    category: ComplaintCategory;
    submitterEmail: string;
    body: string;
    files?: FileMetadata[];
  },
  locale?: string
): Promise<ComplaintEntity>
```

---

### 3. File Validation Logic

Before creating the complaint, validate all file attachments against system settings.

```typescript
async function validateComplaintFiles(
  files: FileMetadata[],
  locale?: string
): Promise<void> {
  const t = await getBackendTranslations({ locale, namespace: "errors" });

  const maxFiles = await SystemSettingsRepository.getIntValue(
    "complaint_max_files_per_complaint",
    5
  );

  if (files.length > maxFiles) {
    throw new Error(t("complaintTooManyFiles", { max: maxFiles }));
  }

  const maxSizeMb = await SystemSettingsRepository.getIntValue(
    "complaint_max_file_size_mb",
    25
  );
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  for (const file of files) {
    if (file.sizeBytes > maxSizeBytes) {
      throw new Error(t("complaintFileTooLarge", {
        fileName: file.path.split("/").pop(),
        maxMb: maxSizeMb,
      }));
    }

    if (!ALLOWED_COMPLAINT_MIME_TYPES.includes(file.mimeType)) {
      throw new Error(t("complaintInvalidFileType", {
        fileName: file.path.split("/").pop(),
        allowedTypes: ALLOWED_COMPLAINT_MIME_TYPES.join(", "),
      }));
    }
  }
}
```

---

### 4. Transactional Complaint Creation with File Registration

Wrap complaint creation and file registration in a single database transaction.

```typescript
export async function submitComplaint(
  actorUserId: string,
  input: {
    parentId: string;
    studentId?: string | null;
    category: ComplaintCategory;
    submitterEmail: string;
    body: string;
    files?: FileMetadata[];
  },
  locale?: string
): Promise<ComplaintEntity> {
  const t = await getBackendTranslations({ locale, namespace: "errors" });

  const parentRecord = await ParentRepository.getParentByUserId(actorUserId);
  if (!parentRecord || parentRecord.id !== input.parentId) {
    const canList = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMPLAINTS_LIST
    );
    if (!canList) {
      throw new Error(t("unauthorizedAction"));
    }
  }

  const files = input.files ?? [];

  if (files.length > 0) {
    await validateComplaintFiles(files, locale);
  }

  const complaint = await db.transaction(async tx => {
    const newComplaint = await ComplaintRepository.createComplaint(
      {
        parentId: input.parentId,
        studentId: input.studentId ?? null,
        category: input.category,
        submitterEmail: input.submitterEmail,
        body: input.body,
        status: ComplaintStatus.UNANSWERED,
      },
      tx
    );

    if (files.length > 0) {
      for (const file of files) {
        await StorageDbRepository.registerFileUsage(
          {
            referenceTable: "complaints",
            referenceId: newComplaint.id,
            usageType: "attachment",
            filePath: file.path,
          },
          tx
        );
      }
    }

    return newComplaint;
  });

  logger.info("Complaint submitted with files", {
    actorUserId,
    complaintId: complaint.id,
    fileCount: files.length,
  });

  return complaint;
}
```

---

### 5. New Method: `getComplaintFiles()`

Retrieves file attachments for a specific complaint. Access is gated by either `support.view_history` (for parents viewing their own complaint) or `complaints.list` (for admins).

```typescript
export async function getComplaintFiles(
  actorUserId: string,
  complaintId: string,
  locale?: string
): Promise<ComplaintFileEntity[]> {
  const t = await getBackendTranslations({ locale, namespace: "errors" });

  const canListComplaints = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.COMPLAINTS_LIST
  );

  const canViewHistory = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SUPPORT_VIEW_HISTORY
  );

  if (!canListComplaints && !canViewHistory) {
    throw new Error(t("unauthorizedAction"));
  }

  const complaint = await ComplaintRepository.getComplaintById(complaintId);
  if (!complaint) {
    throw new Error(t("notFound"));
  }

  if (!canListComplaints) {
    const parentRecord = await ParentRepository.getParentByUserId(actorUserId);
    if (!parentRecord || parentRecord.id !== complaint.parentId) {
      throw new Error(t("unauthorizedAction"));
    }
  }

  const files = await ComplaintRepository.getComplaintFiles(complaintId);

  return files;
}
```

---

## Complete Service File Structure

```typescript
import { db } from "@/backend/db/drizzleDb";
import { ComplaintRepository } from "@/backend/db/repo/complaint.repository";
import { ParentRepository } from "@/backend/db/repo/parent.repository";
import { StorageDbRepository } from "@/backend/db/repo/storage.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission, ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";
import type { ComplaintEntity, ComplaintFileEntity, FileMetadata } from "@/backend/types/complaints.types";

const ALLOWED_COMPLAINT_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
] as const;

async function validateComplaintFiles(
  files: FileMetadata[],
  locale?: string
): Promise<void> {
  const t = await getBackendTranslations({ locale, namespace: "errors" });

  const maxFiles = await SystemSettingsRepository.getIntValue(
    "complaint_max_files_per_complaint",
    5
  );

  if (files.length > maxFiles) {
    throw new Error(t("complaintTooManyFiles", { max: maxFiles }));
  }

  const maxSizeMb = await SystemSettingsRepository.getIntValue(
    "complaint_max_file_size_mb",
    25
  );
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  for (const file of files) {
    if (file.sizeBytes > maxSizeBytes) {
      throw new Error(t("complaintFileTooLarge", {
        fileName: file.path.split("/").pop(),
        maxMb: maxSizeMb,
      }));
    }

    if (!ALLOWED_COMPLAINT_MIME_TYPES.includes(file.mimeType)) {
      throw new Error(t("complaintInvalidFileType", {
        fileName: file.path.split("/").pop(),
        allowedTypes: ALLOWED_COMPLAINT_MIME_TYPES.join(", "),
      }));
    }
  }
}

export namespace ComplaintService {
  export async function submitComplaint(
    actorUserId: string,
    input: {
      parentId: string;
      studentId?: string | null;
      category: ComplaintCategory;
      submitterEmail: string;
      body: string;
      files?: FileMetadata[];
    },
    locale?: string
  ): Promise<ComplaintEntity> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    const parentRecord = await ParentRepository.getParentByUserId(actorUserId);
    if (!parentRecord || parentRecord.id !== input.parentId) {
      const canList = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.COMPLAINTS_LIST
      );
      if (!canList) {
        throw new Error(t("unauthorizedAction"));
      }
    }

    const files = input.files ?? [];

    if (files.length > 0) {
      await validateComplaintFiles(files, locale);
    }

    const complaint = await db.transaction(async tx => {
      const newComplaint = await ComplaintRepository.createComplaint(
        {
          parentId: input.parentId,
          studentId: input.studentId ?? null,
          category: input.category,
          submitterEmail: input.submitterEmail,
          body: input.body,
          status: ComplaintStatus.UNANSWERED,
        },
        tx
      );

      if (files.length > 0) {
        for (const file of files) {
          await StorageDbRepository.registerFileUsage(
            {
              referenceTable: "complaints",
              referenceId: newComplaint.id,
              usageType: "attachment",
              filePath: file.path,
            },
            tx
          );
        }
      }

      return newComplaint;
    });

    logger.info("Complaint submitted with files", {
      actorUserId,
      complaintId: complaint.id,
      fileCount: files.length,
    });

    return complaint;
  }

  export async function getComplaintFiles(
    actorUserId: string,
    complaintId: string,
    locale?: string
  ): Promise<ComplaintFileEntity[]> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    const canListComplaints = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMPLAINTS_LIST
    );

    const canViewHistory = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.SUPPORT_VIEW_HISTORY
    );

    if (!canListComplaints && !canViewHistory) {
      throw new Error(t("unauthorizedAction"));
    }

    const complaint = await ComplaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      throw new Error(t("notFound"));
    }

    if (!canListComplaints) {
      const parentRecord = await ParentRepository.getParentByUserId(actorUserId);
      if (!parentRecord || parentRecord.id !== complaint.parentId) {
        throw new Error(t("unauthorizedAction"));
      }
    }

    const files = await ComplaintRepository.getComplaintFiles(complaintId);

    return files;
  }
}
```

---

## Error Handling Strategy

| Scenario | Error Type | Translation Key |
|----------|-----------|-----------------|
| Unauthorized actor | Permission denied | `errors.unauthorizedAction` |
| Complaint not found | Not found | `errors.notFound` |
| Too many files | Validation | `errors.complaintTooManyFiles` |
| File too large | Validation | `errors.complaintFileTooLarge` |
| Invalid MIME type | Validation | `errors.complaintInvalidFileType` |
| Parent ID mismatch without admin permission | IDOR protection | `errors.unauthorizedAction` |

---

## System Settings Keys

| Key | Default | Description |
|-----|---------|-------------|
| `complaint_max_files_per_complaint` | `5` | Maximum number of file attachments per complaint |
| `complaint_max_file_size_mb` | `25` | Maximum file size in megabytes |

---

## Allowed MIME Types

| Category | MIME Types |
|----------|-----------|
| Images | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| Documents | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| Text | `text/plain`, `text/markdown` |

---

## Logging Requirements

All methods must use `logger` (never `console`):

- `logger.info()` — Successful complaint submission with file count
- `logger.error()` — Caught exceptions in try/catch blocks
- `logger.warn()` — File validation warnings (near-limit counts)

---

## Quality Gate — Implementation

- [ ] `submitComplaint()` accepts optional `files: FileMetadata[]` parameter
- [ ] File count validated against `complaint_max_files_per_complaint` system setting
- [ ] File size validated against `complaint_max_file_size_mb` system setting
- [ ] MIME type validated against `ALLOWED_COMPLAINT_MIME_TYPES` constant
- [ ] Complaint creation and file registration wrapped in `db.transaction()`
- [ ] `getComplaintFiles()` checks `COMPLAINTS_LIST` OR `SUPPORT_VIEW_HISTORY`
- [ ] `getComplaintFiles()` verifies parent ownership when lacking admin permission (IDOR protection)
- [ ] All user-facing errors use `getBackendTranslations()` with `locale` parameter
- [ ] All logging uses `logger` (no `console.*` calls)
- [ ] No hardcoded error strings in the service
- [ ] TypeScript types are fully resolved (no `any`)
- [ ] Service can be used from SSR context (no GraphQL-specific dependencies)
- [ ] NO local type definitions in service files — all types imported from canonical `backend/types/` files
- [ ] All entity types sourced from their respective canonical `.types.ts` files

---

## Quality Gate — Verification

- [ ] `bun tsgo` passes with zero errors
- [ ] `bun lint` passes with zero errors
- [ ] `bun run test:db` passes (integration tests from Task E4)
- [ ] Manual verification: complaint with valid files succeeds and files are registered
- [ ] Manual verification: complaint with too many files is rejected with localized error
- [ ] Manual verification: complaint with oversized file is rejected with localized error
- [ ] Manual verification: complaint with invalid MIME type is rejected with localized error
- [ ] Manual verification: parent can retrieve files for own complaint
- [ ] Manual verification: admin can retrieve files for any complaint
- [ ] Manual verification: unauthorized user cannot retrieve complaint files
- [ ] Manual verification: file registration rolls back if complaint creation fails

---

## Notes

- The `FileMetadata` interface expects the caller (GraphQL resolver or server action) to provide file size and MIME type from the upload handler. The service does NOT read files from disk.
- `StorageDbRepository.registerFileUsage()` creates the `storage_files` record if it does not exist and links it via the `complaint_files` junction table.
- The transaction ensures that if any file registration fails, the entire complaint creation is rolled back.
- System settings defaults (5 files, 25MB) match the current frontend upload component configuration.
