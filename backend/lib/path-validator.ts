/**
 * Path validation utilities for storage operations.
 * Delegates to StorageUtils for consolidated validation/sanitization logic.
 */

import { StorageUtils } from "@/backend/utils/storage.utils";

export function validateStoragePath(path: string): void {
  const error = StorageUtils.validatePath(path);
  if (error) {
    throw new Error(`Invalid path: ${error}`);
  }
}

export function sanitizeStoragePath(path: string): string {
  return StorageUtils.sanitizePath(path);
}
