import fs from "node:fs/promises";
import path from "node:path";
import logger from "@/backend/lib/logger";
import * as Types from "@/backend/types";
import { prepareUploadHelper, uploadFileHelper } from "../../shared/upload-operations.helper";
import type { LocalContext } from "../types";
import { calculateFileHash, ensureDirectory, getAbsolutePath } from "../utils";

export async function prepareUpload(
  ctx: LocalContext,
  input: Types.UploadPreparationInput
): Promise<Types.UploadPreparationResult> {
  return prepareUploadHelper(input, (sessionId, cleanedPath) => {
    const signedUrl = `${ctx.baseUrl}/api/storage/upload/${sessionId}`;

    logger.info("Prepared upload successfully", {
      tokenId: sessionId,
      path: cleanedPath,
      uploadType: Types.UploadType.SIGNED_URL,
    });

    return {
      id: sessionId,
      url: signedUrl,
      uploadType: Types.UploadType.SIGNED_URL,
    };
  });
}

export async function uploadFile(
  ctx: LocalContext,
  filePath: string,
  contentType: string,
  buffer: Buffer
): Promise<Types.FileUploadResult> {
  return uploadFileHelper(filePath, contentType, buffer, async cleanedFilePath => {
    const absolutePath = getAbsolutePath(ctx.basePath, cleanedFilePath);
    await ensureDirectory(path.dirname(absolutePath));
    await fs.writeFile(absolutePath, buffer);

    const hash = await calculateFileHash(absolutePath);
    const url = `${ctx.baseUrl}/api/storage/files/${cleanedFilePath}`;

    return { url, hash };
  });
}
