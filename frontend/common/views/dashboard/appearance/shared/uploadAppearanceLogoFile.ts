import { UploadType } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import {
  generateAppearanceLogoPath,
  isAllowedAppearanceLogoMimeType,
} from "@/shared/utils/appearance-logo-storage.utils";

export type PrepareUploadFn = (options: {
  variables: { input: { path: string; fileSize: number; contentType: string; contentHash: string } };
}) => Promise<{ data?: { prepareUpload?: { id: string; url: string; uploadType: UploadType } | null } }>;

/**
 * Compute the base64-encoded SHA-256 hash of a `File`.
 *
 * The upload route (`app/api/storage/upload/[id]/route.ts`) re-hashes the
 * streamed body and rejects mismatches, so this is the integrity check
 * that protects against tampered or truncated uploads.
 */
async function computeContentHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = "";
  for (const byte of hashArray) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary);
}

/**
 * Stream the `File` body to the signed-URL PUT endpoint.
 *
 * The endpoint validates `Content-Type` and `Content-MD5` headers against
 * the signed-URL session row and re-hashes the body (SHA-256) to detect
 * in-flight corruption. On success it returns `{ url }` — the canonical
 * public read URL for the stored asset.
 */
async function uploadViaSignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string,
  contentHash: string
): Promise<string> {
  const putResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
      "Content-MD5": contentHash,
    },
  });

  if (!putResponse.ok) {
    logger.error("Appearance logo signed-url upload failed", { status: putResponse.status });
    throw new Error("uploadFailed");
  }

  const result: { url?: string } = await putResponse.json();
  if (!result.url) {
    throw new Error("uploadFailed");
  }
  return result.url;
}

/**
 * Upload via Vercel Blob client-side upload (production serverless deploys).
 * Mirrors `uploadAvatarFile.ts` — the `prepareUpload` mutation returns
 * `uploadType: VERCEL_BLOB_CLIENT` when the configured storage provider
 * is Vercel Blob.
 */
async function uploadViaVercelBlob(
  filePath: string,
  file: File,
  handleUploadUrl: string,
  sessionId: string,
  contentType: string
): Promise<string> {
  const { upload } = await import("@vercel/blob/client");
  const blob = await upload(filePath, file, {
    access: "public",
    handleUploadUrl,
    clientPayload: JSON.stringify({
      sessionId,
      fileSize: file.size,
      contentType,
    }),
  });
  return blob.url;
}

/**
 * Upload a logo `File` for the site appearance customizer.
 *
 * Flow (mirrors `uploadAvatarFile.ts` — Task 7):
 *  1. Validate the browser-reported MIME type against the appearance-logo
 *     allowlist (png / jpeg / webp). SVG is rejected here — see
 *     `appearance-logo-storage.utils.ts` header.
 *  2. Generate a UUID-keyed storage path: `public/appearance/logo-<uuid>.<ext>`
 *     (decision §20 — randomized keys prevent overwrite attacks).
 *  3. Compute the SHA-256 content hash (integrity check for the signed-URL
 *     PUT — the server re-hashes and rejects mismatches).
 *  4. Call the `prepareUpload` GraphQL mutation to mint a signed-URL
 *     session (or Vercel Blob handle-upload URL).
 *  5. Stream the file body to the minted URL.
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
  const contentHash = await computeContentHash(params.file);

  const { data: prepData } = await params.prepareUpload({
    variables: {
      input: {
        path: filePath,
        fileSize: params.file.size,
        contentType,
        contentHash,
      },
    },
  });

  if (!prepData?.prepareUpload) {
    throw new Error("uploadPrepareFailed");
  }

  const { id: sessionId, url, uploadType } = prepData.prepareUpload;

  if (uploadType === UploadType.VercelBlobClient) {
    const publicUrl = await uploadViaVercelBlob(filePath, params.file, url, sessionId, contentType);
    return { url: publicUrl, path: filePath };
  }

  const publicUrl = await uploadViaSignedUrl(url, params.file, contentType, contentHash);
  return { url: publicUrl, path: filePath };
}
