import { UploadType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { logger } from "@/frontend/common/utils/logger";

export type PrepareUploadFn = (options: {
  variables: { input: { path: string; fileSize: number; contentType: string; contentHash: string } };
}) => Promise<{ data?: { prepareUpload?: { id: string; url: string; uploadType: UploadType } | null } }>;

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

function sanitizeFileName(fileName: string): string {
  return fileName.replaceAll(/[/\\]/g, "_");
}

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
    logger.error("Avatar signed-url upload failed", { status: putResponse.status });
    throw new Error("uploadFailed");
  }

  const result = (await putResponse.json()) as { url?: string };
  if (!result.url) {
    throw new Error("uploadFailed");
  }
  return result.url;
}

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

export async function uploadAvatarFile(params: {
  readonly file: File;
  readonly storageOwnerKey: string;
  readonly prepareUpload: PrepareUploadFn;
}): Promise<{ url: string }> {
  const sanitizedName = sanitizeFileName(params.file.name);
  const filePath = `public/avatars/${params.storageOwnerKey}/${sanitizedName}`;
  const contentType = params.file.type || "application/octet-stream";
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
    return { url: publicUrl };
  }

  const publicUrl = await uploadViaSignedUrl(url, params.file, contentType, contentHash);
  return { url: publicUrl };
}
