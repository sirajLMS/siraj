import { type PrepareUploadFn, performClientStorageUpload } from "@/frontend/common/utils/storage/uploadClientFile";
import {
  generateAppearanceLogoPath,
  isAllowedAppearanceLogoMimeType,
} from "@/shared/utils/appearance-logo-storage.utils";

export type { PrepareUploadFn };

/**
 * Upload a logo `File` for the site appearance customizer.
 *
 * Flow (mirrors `uploadAvatarFile.ts` — Task 7):
 *  1. Validate the browser-reported MIME type against the appearance-logo
 *     allowlist (png / jpeg / webp). SVG is rejected here — see
 *     `appearance-logo-storage.utils.ts` header.
 *  2. Generate a UUID-keyed storage path: `public/appearance/logo-<uuid>.<ext>`
 *     (decision §20 — randomized keys prevent overwrite attacks).
 *  3. Delegate upload to `performClientStorageUpload`.
 *
 * The returned `{ url }` is the canonical public read URL written into
 * `draft_fields.logoUrl` via `appearancePreviewStore.setField("logoUrl", url)`.
 * The URL is persisted to the published row by the existing `publishAppearance`
 * mutation (Task 2.3) — no special "publish logo" step is needed.
 */
export async function uploadAppearanceLogoFile(params: {
  readonly file: File;
  readonly prepareUpload: PrepareUploadFn;
}): Promise<{ url: string; path: string }> {
  const contentType = params.file.type || "application/octet-stream";
  if (!isAllowedAppearanceLogoMimeType(contentType)) {
    throw new Error("invalidLogoMimeType");
  }

  const uuid = crypto.randomUUID();
  const filePath = generateAppearanceLogoPath(uuid, contentType);

  const url = await performClientStorageUpload({
    file: params.file,
    filePath,
    contentType,
    prepareUpload: params.prepareUpload,
  });

  return { url, path: filePath };
}
