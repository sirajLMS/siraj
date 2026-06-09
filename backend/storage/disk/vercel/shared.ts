import { type ListBlobResult, list } from "@vercel/blob";
import logger from "@/backend/lib/logger";
import type { VercelContext } from "./types";

export async function getBlobs(
  ctx: VercelContext,
  prefix: string
): Promise<Array<{ url: string; pathname: string; size: number; uploadedAt: Date }>> {
  let allBlobs: Array<{
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
  }> = [];
  let cursor: string | undefined;
  let hasMoreBlobs = true;

  while (hasMoreBlobs) {
    try {
      const result: ListBlobResult = await list({
        token: ctx.token,
        prefix,
        limit: 1000,
        ...(cursor ? { cursor } : {}),
      });

      allBlobs = allBlobs.concat(result.blobs);
      cursor = result.cursor;
      hasMoreBlobs = result.hasMore;
    } catch (error) {
      logger.error("Failed to list blobs", { prefix, error });
      break;
    }
  }

  return allBlobs;
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
