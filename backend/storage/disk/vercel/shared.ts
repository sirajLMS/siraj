import { type ListBlobResult, list } from "@vercel/blob";
import { logger } from "@/backend/lib/logger";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";

type BlobInfo = { url: string; pathname: string; size: number; uploadedAt: Date };

async function fetchBlobsRecursive(
  ctx: VercelContext,
  prefix: string,
  cursor: string | undefined,
  accumulated: BlobInfo[]
): Promise<BlobInfo[]> {
  let result: ListBlobResult;
  try {
    result = await list({
      token: ctx.token,
      prefix,
      limit: 1000,
      ...(cursor ? { cursor } : {}),
    });
  } catch (error) {
    logger.error("Failed to list blobs", { prefix, error });
    return accumulated;
  }

  const allBlobs = accumulated.concat(result.blobs);

  if (!result.hasMore) {
    return allBlobs;
  }

  return fetchBlobsRecursive(ctx, prefix, result.cursor, allBlobs);
}

export async function getBlobs(ctx: VercelContext, prefix: string): Promise<BlobInfo[]> {
  return fetchBlobsRecursive(ctx, prefix, undefined, []);
}

export async function isDirectory(ctx: VercelContext, path: string): Promise<boolean> {
  try {
    const prefix = `${path}/`;
    const result: ListBlobResult = await list({
      token: ctx.token,
      prefix,
      limit: 1,
    });
    return result.blobs.length > 0;
  } catch {
    return false;
  }
}
