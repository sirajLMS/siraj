/**
 * Path validation utilities for storage operations.
 * Prevents path traversal, absolute path, and null byte injection attacks.
 */

const PATH_TRAVERSAL_PATTERN = /(\.\.[/\\]|\/\.\.|\\\.|[/\\]\.\.)/;
const ABSOLUTE_PATH_PATTERN = /^[/\\]/;

export function validateStoragePath(path: string): void {
  if (PATH_TRAVERSAL_PATTERN.test(path)) {
    throw new Error("Invalid path: path traversal patterns are not allowed");
  }
  if (ABSOLUTE_PATH_PATTERN.test(path)) {
    throw new Error("Invalid path: absolute paths are not allowed");
  }
  if (path.includes("\0")) {
    throw new Error("Invalid path: null bytes are not allowed");
  }
}

export function sanitizeStoragePath(path: string): string {
  return path.replace(/\0/g, "").replace(/\\/g, "/");
}
