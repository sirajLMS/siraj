import { del } from "@vercel/blob";
import type { HandleUploadOptions } from "@vercel/blob/client";
import { parseTokenPayload } from "@/app/api/storage/vercel-upload/vercel-upload.helpers";
import type {
  BeforeGenerateTokenContext,
  UploadCompletedPayload,
} from "@/app/api/storage/vercel-upload/vercel-upload.types";
import { getStringEnv, logger } from "@/backend/lib";
import { ALLOWED_MIME_TYPES, isImageContentType, verifyImageMagicBytes } from "@/backend/lib/storage";
import { StorageService } from "@/backend/services";
import { isPublicStoragePath } from "@/backend/storage/disk/vercel/operations";

const MAGIC_HEADER_BYTES = 16;
const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;

async function deleteBlob(url: string): Promise<void> {
  const token = getStringEnv("BLOB_READ_WRITE_TOKEN", "");
  await del(url, { token });
}

/**
 * Fetch the first bytes of a completed blob and verify the magic-byte
 * signature for image content types. Returns true when the content is
 * acceptable or when verification is not possible for public paths (lenient);
 * for non-public paths verification failures are treated as definitive so the
 * caller deletes the blob.
 */
async function hasValidMagicBytes(blobUrl: string, contentType: string, pathname: string): Promise<boolean> {
  if (!contentType || !isImageContentType(contentType)) {
    return true;
  }

  const isPublicPath = isPublicStoragePath(pathname);

  try {
    const token = getStringEnv("BLOB_READ_WRITE_TOKEN", "");
    const response = await fetch(blobUrl, {
      headers: {
        Range: `bytes=0-${MAGIC_HEADER_BYTES - 1}`,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok && response.status !== 206) {
      logger.error("Unable to fetch uploaded blob for magic-byte verification", {
        status: response.status,
        pathname,
        isPublicPath,
      });
      // Public paths stay lenient so a transient fetch failure cannot block
      // all public uploads; non-public blobs fail closed (deleted by caller).
      return isPublicPath;
    }

    const headerBytes = Buffer.from(await response.arrayBuffer());
    if (headerBytes.length === 0) {
      logger.error("Magic-byte verification received an empty blob body", { pathname, isPublicPath });
      return isPublicPath;
    }
    return verifyImageMagicBytes(contentType, headerBytes);
  } catch (error) {
    logger.error("Magic-byte verification of uploaded blob failed to run", { pathname, isPublicPath, error });
    return isPublicPath;
  }
}

/**
 * A non-public blob must not be anonymously readable. Probing with a plain GET
 * detects a misconfigured access level; a failed probe never breaks the
 * completion callback.
 */
async function isAnonymouslyReadableNonPublicBlob(blob: { url: string; pathname: string }): Promise<boolean> {
  if (isPublicStoragePath(blob.pathname)) {
    return false;
  }

  try {
    const probeResponse = await fetch(blob.url);
    if (!probeResponse.ok) {
      return false;
    }

    logger.warn("Uploaded non-public blob is anonymously readable; deleting", {
      pathname: blob.pathname,
    });
    return true;
  } catch (probeError) {
    logger.warn("Anonymous-readability probe of uploaded blob failed", {
      pathname: blob.pathname,
      error: probeError instanceof Error ? probeError.message : String(probeError),
    });
    return false;
  }
}

/**
 * Build the `onBeforeGenerateToken` callback for Vercel's client upload flow.
 * The allowlist and size cap are enforced server-side; the client-reported
 * content type is never trusted.
 */
export function createBeforeGenerateTokenHandler(
  context: BeforeGenerateTokenContext
): HandleUploadOptions["onBeforeGenerateToken"] {
  return () => {
    logger.info("🔍 [VERCEL UPLOAD] Generating token", {
      pathname: context.pathName,
    });

    return Promise.resolve({
      allowOverwrite: false,
      allowedContentTypes: [...ALLOWED_MIME_TYPES],
      // Hard server-side cap on actually-uploaded bytes; keep in sync with
      // MAX_FILE_SIZE_BYTES in backend/db/repo/storage/storage.repository.ts.
      maximumSizeInBytes: MAX_UPLOAD_SIZE_BYTES,
      tokenPayload: JSON.stringify({
        sessionId: context.sessionId,
        pathname: context.pathName,
        userId: context.userId,
        contentType: context.contentType,
      }),
    });
  };
}

/**
 * Runs after the client upload completes: reject blobs whose contents or
 * access level fail verification, then claim the session and persist the file
 * record.
 */
export async function handleUploadCompleted({ blob, tokenPayload }: UploadCompletedPayload): Promise<void> {
  logger.info("🔍 [VERCEL UPLOAD] Upload completed", {
    url: blob.url,
    pathname: blob.pathname,
  });

  try {
    const rawPayload = parseTokenPayload(tokenPayload ?? "{}");

    if (!(await hasValidMagicBytes(blob.url, rawPayload.contentType ?? "", blob.pathname))) {
      logger.warn("Uploaded blob failed magic-byte verification; deleting", {
        pathname: blob.pathname,
        contentType: rawPayload.contentType,
      });
      await deleteBlob(blob.url);
      return;
    }

    if (await isAnonymouslyReadableNonPublicBlob(blob)) {
      await deleteBlob(blob.url);
      return;
    }

    if (rawPayload.sessionId) {
      await StorageService.claimSignedUrl(rawPayload.sessionId);
    }

    await StorageService.createFile(blob.pathname);

    logger.info("✅ [VERCEL UPLOAD] File record created", {
      pathname: blob.pathname,
    });
  } catch (error) {
    logger.error("Failed to create file record after upload", {
      pathname: blob.pathname,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
