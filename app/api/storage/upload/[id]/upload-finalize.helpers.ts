import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import type { SignedUrlData } from "@/app/api/storage/upload/[id]/upload-request.helpers";
import { logger } from "@/backend/lib";
import { StorageService } from "@/backend/services";
import type { ErrorsLabels } from "@/shared/locale/types";

/**
 * Finalize the upload by creating a database record and returning the response
 */
export async function finalizeUpload(
  signedUrl: SignedUrlData,
  absolutePath: string,
  tokenId: string,
  tErrors: ErrorsLabels
): Promise<NextResponse> {
  try {
    const fileEntity = await StorageService.createFileAndGet(signedUrl.filePath, false);
    const stats = await fs.stat(absolutePath);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    logger.info("File uploaded successfully via signed URL", { tokenId, path: signedUrl.filePath });

    return NextResponse.json(
      {
        id: fileEntity.id,
        path: signedUrl.filePath,
        size: stats.size,
        contentType: signedUrl.contentType,
        url: `${baseUrl}/api/storage/files/${signedUrl.filePath}`,
        createdAt: stats.birthtime.toISOString(),
        isProtected: fileEntity.isProtected,
      },
      { status: 201 }
    );
  } catch (error) {
    await fs.unlink(absolutePath).catch(() => {});
    logger.error("Failed to create file record", { tokenId, error });
    return NextResponse.json({ error: tErrors.file.failedToCreateFileRecord }, { status: 500 });
  }
}
