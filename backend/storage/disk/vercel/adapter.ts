import { getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
import { BaseAdapter } from "@/backend/storage/disk/base.adapter";
import * as ops from "@/backend/storage/disk/vercel/operations";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";

const VALID_ACCESS = new Set(["public", "private"]);

function isBlobAccess(value: string | undefined): value is "public" | "private" {
  return value !== undefined && VALID_ACCESS.has(value);
}

export class VercelAdapter extends BaseAdapter<VercelContext> {
  constructor() {
    const token = getStringEnv("BLOB_READ_WRITE_TOKEN", "");
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is required for Vercel Blob storage");
    }

    const rawAccess = getStringEnv("VERCEL_BLOB_ACCESS", "private");
    if (!isBlobAccess(rawAccess)) {
      logger.warn(
        `Invalid VERCEL_BLOB_ACCESS value "${rawAccess}" ignored; defaulting blob access to "private". Set it explicitly to "public" or "private".`
      );
    }
    const access: "public" | "private" = isBlobAccess(rawAccess) ? rawAccess : "private";
    const context: VercelContext = {
      baseUrl: NEXT_PUBLIC_BASE_URL,
      token,
      access,
    };

    super(context, ops);
    logger.info("Vercel Blob storage initialized");
  }
}
