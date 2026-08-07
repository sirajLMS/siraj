import { logger } from "@/backend/lib/logger";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
import { getLocalStorageBasePath } from "@/backend/lib/storage/local-storage-path";
import { BaseAdapter } from "@/backend/storage/disk/base.adapter";
import * as ops from "@/backend/storage/disk/local/operations";
import type { LocalContext } from "@/backend/storage/disk/local/types";

export class LocalAdapter extends BaseAdapter<LocalContext> {
  constructor() {
    const basePath = getLocalStorageBasePath();

    const context: LocalContext = {
      basePath,
      baseUrl: NEXT_PUBLIC_BASE_URL,
    };

    super(context, ops);
    logger.info(`Local storage initialized at: ${this.context.basePath}`);
  }
}
