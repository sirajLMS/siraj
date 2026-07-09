import { getStringEnv } from "@/backend/lib/env";
import logger from "@/backend/lib/logger";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
import { BaseAdapter } from "@/backend/storage/disk/base.adapter";
import * as ops from "@/backend/storage/disk/vercel/operations";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";

export class VercelAdapter extends BaseAdapter<VercelContext> {
  constructor() {
    const token = getStringEnv("BLOB_READ_WRITE_TOKEN", "");
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is required for Vercel Blob storage");
    }

    const access = getStringEnv("VERCEL_BLOB_ACCESS", "public") as "public" | "private";
    const context: VercelContext = {
      baseUrl: NEXT_PUBLIC_BASE_URL,
      token,
      access,
    };

    super(context, ops);
    logger.info("Vercel Blob storage initialized");
  }
}
