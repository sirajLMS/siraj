"use client";

import type { AppearanceDraftInput } from "@/frontend/common/graphql/generated/gql/graphql";

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
 * This helper checks if `draft.logoUrl` is a data URL and, if so, converts it
 * back to a `File` + uploads it via the existing storage pipeline
 * (`useAppearanceLogoUpload.uploadLogo`). The returned draft has
 * `logoUrl` replaced with the canonical storage URL.
 *
 * If `logoUrl` is already a storage URL (not `data:`) or null, the draft is
 * returned unchanged — no re-upload needed.
 *
 * @returns A new draft with `logoUrl` resolved to a storage URL (or null).
 */
export async function resolveDraftLogoForSave(
  draft: AppearanceDraftInput,
  uploadLogo: (file: File) => Promise<{ url: string; path: string }>
): Promise<AppearanceDraftInput> {
  const logoUrl = draft.logoUrl;
  if (!logoUrl?.startsWith("data:")) {
    // Already a storage URL or null — no upload needed.
    return draft;
  }

  // Convert the data URL back to a File for the upload pipeline.
  const response = await fetch(logoUrl);
  const blob = await response.blob();
  // Infer the file extension from the MIME type.
  const ext = blob.type.split("/")[1] ?? "png";
  const file = new File([blob], `appearance-logo.${ext}`, { type: blob.type });

  const { url: storageUrl } = await uploadLogo(file);
  return { ...draft, logoUrl: storageUrl };
}
