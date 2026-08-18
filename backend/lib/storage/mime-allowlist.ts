/**
 * MIME-type allowlist for file uploads.
 *
 * Shared by the Vercel Blob upload route (`app/api/storage/vercel-upload`)
 * and the legacy signed-URL upload route (`app/api/storage/upload/[id]`).
 *
 * Explicitly EXCLUDES executable, script, and markup types that can be
 * used for XSS or remote code execution when served back to browsers:
 * - `image/svg+xml` (inline JavaScript / XSS)
 * - `text/html`
 * - `application/javascript`
 * - `application/xhtml+xml`
 */
export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/msword",
]);

export function isAllowedMimeType(contentType: string): boolean {
  return ALLOWED_MIME_TYPES.has(contentType);
}
