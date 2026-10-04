import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { ValidationError } from "@/backend/lib/errors";
import type { FileMetadata } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const MAX_COMPLAINT_FILES = 5;
const MAX_COMPLAINT_FILE_SIZE_MB = 25;

const ALLOWED_COMPLAINT_MIME_TYPES: ReadonlySet<string> = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

/**
 * Validates complaint attachments against the configurable count/size limits
 * (falling back to the module defaults) and the allowed MIME-type allowlist.
 */
export async function validateComplaintFiles(files: ReadonlyArray<FileMetadata>, locale?: string): Promise<void> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

  const maxFiles = await SystemSettingsRepository.getIntValue("complaint_max_files_per_complaint", MAX_COMPLAINT_FILES);
  if (files.length > maxFiles) {
    throw new ValidationError("TOO_MANY_FILES", tErrors.complaintTooManyFiles(maxFiles));
  }

  const maxSizeMb = await SystemSettingsRepository.getIntValue(
    "complaint_max_file_size_mb",
    MAX_COMPLAINT_FILE_SIZE_MB
  );
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  for (const file of files) {
    if (file.sizeBytes > maxSizeBytes) {
      throw new ValidationError("FILE_TOO_LARGE", tErrors.complaintFileTooLarge(maxSizeMb));
    }

    if (!ALLOWED_COMPLAINT_MIME_TYPES.has(file.mimeType)) {
      throw new ValidationError("INVALID_FILE_TYPE", tErrors.file.invalidFileType);
    }
  }
}
