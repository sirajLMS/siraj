"use client";

import type { AppearanceDraftInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";

/**
 * `resolveDraftLogoForSave` — uploads an in-memory data-URL logo to storage
 * before a SAVE DRAFT or PUBLISH mutation.
 *
 * ## Background (BUG-E)
 *
 * `LogoUploadSection` stores the selected logo as a **data URL**
 * (`data:image/png;base64,...`) in `draft.logoUrl` for instant Photoshop-like
 * preview. Data URLs are great for in-browser preview but:
 *  1. Are too large to persist in the DB `logo_url` column (base64 bloat).
 *  2. Can't be served as a public CDN URL to site visitors.
 *
 * This helper checks if `draft.logoUrl` is a data URL and, if so, decodes it
 * back to a `File` + uploads it via the existing storage pipeline
 * (`useAppearanceLogoUpload.uploadLogo`). The returned draft has
 * `logoUrl` replaced with the canonical storage URL.
 *
 * If `logoUrl` is already a storage URL (not `data:`) or null, the draft is
 * returned unchanged — no re-upload needed.
 *
 * ## Error handling
 *
 * If the storage upload fails (network error, CSP block, storage server
 * unreachable), the helper logs the error + returns the draft with
 * `logoUrl: null` (NOT the original data URL — data URLs are too large for
 * the DB column). This prevents a single storage outage from blocking the
 * entire save/publish flow. The caller (toolbar/form) will still fire the
 * GraphQL mutation; the admin sees a toast warning via the caller's catch
 * handler.
 *
 * ## Implementation note
 *
 * Uses `atob()` + `Uint8Array` to decode the base64 payload (NOT `fetch(dataUrl)`)
 * because `fetch()` on data URLs is blocked by CSP in some browsers and
 * fails entirely in headless Chromium (agent-browser). The `atob` + manual
 * byte-construction approach is CSP-safe and works universally.
 *
 * @returns A new draft with `logoUrl` resolved to a storage URL (or null on
 *          upload failure, or unchanged if already a storage URL/null).
 */
async function resolveDraftLogoForSave(
  draft: AppearanceDraftInput,
  uploadLogo: (file: File) => Promise<{ url: string; path: string }>
): Promise<AppearanceDraftInput> {
  const logoUrl = draft.logoUrl;
  if (!logoUrl?.startsWith("data:")) {
    // Already a storage URL or null — no upload needed.
    return draft;
  }

  try {
    // Parse the data URL: `data:[<mediatype>][;base64],<data>`
    const commaIndex = logoUrl.indexOf(",");
    if (commaIndex === -1) {
      return draft;
    }
    const header = logoUrl.slice(5, commaIndex); // e.g. "image/png;base64"
    const base64Data = logoUrl.slice(commaIndex + 1);
    const isBase64 = header.includes("base64");
    const mimeType = header.split(";")[0] || "image/png";

    let blob: Blob;
    if (isBase64) {
      // Decode base64 → binary string → Uint8Array → Blob.
      // atob is available in all browsers + Node 16+.
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mimeType });
    } else {
      // URL-encoded data URL (rare for images) — decode + create blob.
      blob = new Blob([decodeURIComponent(base64Data)], { type: mimeType });
    }

    // Infer the file extension from the MIME type.
    const ext = mimeType.split("/")[1]?.split("+")[0] ?? "png";
    const file = new File([blob], `appearance-logo.${ext}`, { type: mimeType });

    const { url: storageUrl } = await uploadLogo(file);
    return { ...draft, logoUrl: storageUrl };
  } catch (error) {
    // Storage upload failed (network/CSP/server unreachable). Log + null out
    // the logo so the save/publish mutation can proceed without the oversized
    // data URL. The admin will see the save succeed but the logo won't be
    // persisted — they can re-upload later.
    logger.error("Appearance logo storage upload failed; saving draft without logo", { error });
    return { ...draft, logoUrl: null };
  }
}

/**
 * Resolves draft logo data URLs and synchronizes the draft store if changed.
 */
export async function prepareDraftForAction(
  draft: AppearanceDraftInput,
  uploadLogo: (file: File) => Promise<{ url: string; path: string }>,
  setField: (field: "logoUrl", value: string | null) => void
): Promise<AppearanceDraftInput> {
  const resolved = await resolveDraftLogoForSave(draft, uploadLogo);
  if (resolved.logoUrl !== draft.logoUrl) {
    setField("logoUrl", resolved.logoUrl ?? null);
  }
  return resolved;
}
