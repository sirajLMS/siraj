import { put } from "@vercel/blob";
import { UploadType } from "@/backend/enum/storage";
import { logger } from "@/backend/lib/logger";
import { prepareUploadHelper, uploadFileHelper } from "@/backend/storage/disk/shared/upload-operations.helper";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";
import { calculateHash } from "@/backend/storage/disk/vercel/utils";
import type * as Types from "@/backend/types";

const PUBLIC_PATH_PREFIX = "public";

export function isPublicStoragePath(filePath: string): boolean {
  return filePath === PUBLIC_PATH_PREFIX || filePath.startsWith(`${PUBLIC_PATH_PREFIX}/`);
}

/**
 * Public blob access is granted only for objects stored under `public/` paths;
 * everything else is private even when the operator override allows public.
 */
export function resolveBlobAccess(access: "public" | "private", filePath: string): "public" | "private" {
  return access === "public" && isPublicStoragePath(filePath) ? "public" : "private";
}

export async function prepareUpload(
  ctx: VercelContext,
  input: Types.UploadPreparationInput
): Promise<Types.UploadPreparationResult> {
  return prepareUploadHelper(input, (sessionId, cleanedPath) => {
    logger.info("Prepared Vercel upload successfully", {
      sessionId,
      path: cleanedPath,
      uploadType: "VERCEL",
    });

    return {
      id: sessionId,
      url: `${ctx.baseUrl}/api/storage/vercel-upload`,
      uploadType: UploadType.VERCEL_BLOB_CLIENT,
      access: resolveBlobAccess(ctx.access, cleanedPath),
    };
  });
}

export async function uploadFile(
  ctx: VercelContext,
  filePath: string,
  contentType: string,
  buffer: Buffer,
  locale?: string
): Promise<Types.FileUploadResult> {
  return uploadFileHelper(
    filePath,
    contentType,
    buffer,
    async cleanedFilePath => {
      const blob = await put(cleanedFilePath, buffer, {
        token: ctx.token,
        contentType: contentType,
        access: resolveBlobAccess(ctx.access, cleanedFilePath),
      });

      const hash = calculateHash(buffer);

      return { url: blob.url, hash };
    },
    locale
  );
}
