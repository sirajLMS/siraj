import { UploadType } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";

export type PrepareUploadFn = (options: {
  variables: { input: { path: string; fileSize: number; contentType: string; contentHash: string } };
}) => Promise<{
  data?: { prepareUpload?: { id: string; url: string; uploadType: UploadType; access?: string } | null };
}>;

/**
 * Compute the base64-encoded SHA-256 hash of a `File`.
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
    logger.error("Client storage signed-url upload failed", { status: putResponse.status });
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
 */
async function uploadViaVercelBlob(
  filePath: string,
  file: File,
  handleUploadUrl: string,
  sessionId: string,
  contentType: string,
  access: "public" | "private"
): Promise<string> {
  const { upload } = await import("@vercel/blob/client");
  const blob = await upload(filePath, file, {
    access,
    handleUploadUrl,
    clientPayload: JSON.stringify({
      sessionId,
      fileSize: file.size,
      contentType,
    }),
  });
  return blob.url;
}

export interface PerformClientStorageUploadParams {
  readonly file: File;
  readonly filePath: string;
  readonly contentType: string;
  readonly prepareUpload: PrepareUploadFn;
}

/**
 * Common pipeline for preparing and executing a client-side storage upload.
 */
export async function performClientStorageUpload(params: PerformClientStorageUploadParams): Promise<string> {
  const contentHash = await computeContentHash(params.file);

  const { data: prepData } = await params.prepareUpload({
    variables: {
      input: {
        path: params.filePath,
        fileSize: params.file.size,
        contentType: params.contentType,
        contentHash,
      },
    },
  });

  if (!prepData?.prepareUpload) {
    throw new Error("uploadPrepareFailed");
  }

  const { id: sessionId, url, uploadType } = prepData.prepareUpload;

  if (uploadType === UploadType.VercelBlobClient) {
    // Use the server-decided access level; the server resolves "public" only
    // for `public/` paths. Default to "private" (fail-closed) when absent —
    // server-side probes remain the authoritative enforcement.
    const access = prepData.prepareUpload.access === "public" ? "public" : "private";
    return uploadViaVercelBlob(params.filePath, params.file, url, sessionId, params.contentType, access);
  }

  return uploadViaSignedUrl(url, params.file, params.contentType, contentHash);
}
