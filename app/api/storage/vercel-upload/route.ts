import { handleUpload } from "@vercel/blob/client";
import { type NextRequest, NextResponse } from "next/server";
import {
  createBeforeGenerateTokenHandler,
  handleUploadCompleted,
} from "@/app/api/storage/vercel-upload/vercel-upload.completion";
import { resolveUploadRequest, validateUploadTarget } from "@/app/api/storage/vercel-upload/vercel-upload.validation";
import { logger } from "@/backend/lib";
import { getServerTranslations } from "@/shared/locale";

export type { VercelUploadUrlClientPlayload } from "@/app/api/storage/vercel-upload/vercel-upload.types";

/**
 * Handle Vercel Blob client SDK upload requests
 * POST /api/storage/vercel-upload
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const tErrors = getServerTranslations(locale).errorsTranslations;

  try {
    const resolved = await resolveUploadRequest(request, tErrors);
    if (resolved instanceof NextResponse) {
      return resolved;
    }

    const targetError = await validateUploadTarget(resolved, locale);
    if (targetError) {
      return targetError;
    }

    const jsonResponse = await handleUpload({
      body: resolved.body,
      request,
      onBeforeGenerateToken: createBeforeGenerateTokenHandler({
        pathName: resolved.pathName,
        sessionId: resolved.clientPlayload.sessionId,
        userId: resolved.userId,
        contentType: resolved.clientPlayload.contentType,
      }),
      onUploadCompleted: handleUploadCompleted,
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    logger.error("Unexpected error in Vercel upload handler", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
