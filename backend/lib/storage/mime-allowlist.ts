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

export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/**
 * Magic-byte signatures for the raster image types in the allowlist.
 * `bmp` has no reliable signature and is intentionally not verified.
 */
const IMAGE_SIGNATURES: Record<string, readonly number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/gif": [0x47, 0x49, 0x46, 0x38], // "GIF8" — matches both GIF87a and GIF89a
  "image/webp": [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50], // "RIFF"...."WEBP"
};

function matchesSignature(bytes: Buffer, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((expected, index) => expected === 0x00 || expected === bytes[index]);
}

/**
 * Verify that a buffer starts with the magic bytes expected for the declared
 * image content type. Only meaningful once at least `signature.length` bytes
 * are available; non-image and non-verifiable types always pass.
 */
export function verifyImageMagicBytes(contentType: string, bytes: Buffer): boolean {
  const signature = IMAGE_SIGNATURES[contentType];
  if (!signature) return true;
  return matchesSignature(bytes, signature);
}
