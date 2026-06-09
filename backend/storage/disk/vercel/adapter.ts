import logger from "@/backend/lib/logger";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
import { BaseAdapter } from "../base.adapter";
import * as ops from "./operations";
import type { VercelContext } from "./types";

export class VercelAdapter extends BaseAdapter<VercelContext> {
  constructor() {
    const token = process.env.BLOB_READ_WRITE_TOKEN || "";
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is required for Vercel Blob storage");
    }

    const context: VercelContext = {
      baseUrl: NEXT_PUBLIC_BASE_URL,
      token,
    };

    super(context, ops);
    logger.info("Vercel Blob storage initialized");
  }
}
