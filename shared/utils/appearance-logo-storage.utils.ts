/**
 * Appearance logo storage path conventions.
 *
 * Shared by the frontend upload helper
 * (`uploadAppearanceLogoFile.ts`) and any backend seed/test code that
 * needs to reference the same `public/appearance/` key prefix.
 *
 * Per design decision §20 (Security Hardening): logo storage keys are
 * randomized with UUIDs to prevent path traversal and object-overwrite
 * attacks. Per decision §18 the logos live under `public/appearance/`
 * so they are served as public assets (CDN-cacheable, no signed URL
 * required to read).
 *
 * SVG (`image/svg+xml`) is intentionally EXCLUDED from the allowlist
 * here even though `LogoUploadSection`'s accept attribute lists it —
 * the backend `mime-allowlist.ts` explicitly excludes SVG (stored XSS
 * risk via inline `<script>` / `onload`). Adding SVG requires DOMPurify
 * sanitization before writing to disk (decision §20.1.b). Deferred to
 * a follow-up task; see `7-outcome.md` Carry-Forward.
 */

/** Storage key prefix for appearance logo uploads (public, CDN-cacheable). */
export const APPEARANCE_LOGO_STORAGE_PREFIX = "public/appearance" as const;

/**
 * MIME types accepted for appearance logo uploads.
 *
 * Subset of `shared/utils/storage.utils.ts`'s `ALLOWED_MIME_TYPES`
 * (image kinds only). SVG is excluded — see file header.
 */
export const APPEARANCE_LOGO_ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/**
 * Map an allowed logo MIME type to its canonical file extension.
 * Falls back to `png` for unknown image types (should not happen — the
 * allowlist is checked before this is called).
 */
export const APPEARANCE_LOGO_MIME_TO_EXT: Readonly<Record<string, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Generate the storage key for an appearance logo upload.
 *
 * Format: `public/appearance/logo-<uuid>.<ext>`
 *
 * The UUID randomizes the key (decision §20) so concurrent uploads by
 * different admins never collide and a re-upload of the same file does
 * not overwrite the prior asset (which may still be referenced by a
 * cached published row).
 *
 * @param uuid - RFC 4122 UUID (use `crypto.randomUUID()` in the browser
 *   or `crypto.randomUUID()` in Node 19+).
 * @param contentType - MIME type from `File.type`; must be in
 *   `APPEARANCE_LOGO_ALLOWED_MIME_TYPES`.
 * @returns The storage key, e.g. `public/appearance/logo-a1b2...c4.png`.
 */
export function generateAppearanceLogoPath(uuid: string, contentType: string): string {
  const ext = APPEARANCE_LOGO_MIME_TO_EXT[contentType] ?? "png";
  return `${APPEARANCE_LOGO_STORAGE_PREFIX}/logo-${uuid}.${ext}`;
}

/**
 * Type guard: is the given MIME type accepted for appearance logo uploads?
 */
export function isAllowedAppearanceLogoMimeType(contentType: string): boolean {
  return (APPEARANCE_LOGO_ALLOWED_MIME_TYPES as readonly string[]).includes(contentType);
}

/**
 * Cache-Control header value for appearance logo assets (AC-34, decision §18).
 *
 * Logos are written under UUID-randomized keys
 * (`public/appearance/logo-<uuid>.<ext>` — see {@link generateAppearanceLogoPath}),
 * so a re-upload of the same logical logo produces a *new* URL rather than
 * overwriting the prior asset. This makes the asset at any given URL
 * effectively immutable: the bytes behind the URL never change for the
 * lifetime of the deployment. Long-lived CDN caching is therefore safe and
 * desirable — it shifts read traffic off the Next.js server and onto the
 * edge, with no cache-invalidation story needed (a new logo just gets a new
 * URL, and the old URL stays valid for any cached published row that still
 * references it).
 *
 * `max-age=31536000` is one year (the conventional "forever" value for
 * immutable assets). `immutable` tells browsers/CDNs to skip the
 * conditional revalidation on reload (saving a 304 round-trip per asset).
 */
export const APPEARANCE_LOGO_CACHE_CONTROL = "public, max-age=31536000, immutable" as const;

/**
 * Type guard: does the given storage path point at an appearance logo asset?
 *
 * Matches the {@link APPEARANCE_LOGO_STORAGE_PREFIX} segment (with a
 * trailing `/` to avoid false-positives on sibling directories like
 * `public/appearance-banners/`). Used by the file-serving route
 * (`app/api/storage/files/[[...path]]/route.ts`) to decide whether to emit
 * the long-lived immutable cache header (AC-34) or the default short-lived
 * `max-age=3600` header.
 *
 * @example
 * isAppearanceLogoStoragePath("public/appearance/logo-abc.png")  // → true
 * isAppearanceLogoStoragePath("public/appearance/")               // → true
 * isAppearanceLogoStoragePath("avatars/xyz.png")                  // → false
 * isAppearanceLogoStoragePath("public/appearance-banners/x.png")  // → false
 */
export function isAppearanceLogoStoragePath(relativePath: string): boolean {
  const prefix = `${APPEARANCE_LOGO_STORAGE_PREFIX}/`;
  return relativePath === APPEARANCE_LOGO_STORAGE_PREFIX || relativePath.startsWith(prefix);
}
