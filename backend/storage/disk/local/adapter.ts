import path from "node:path";
import logger from "@/backend/lib/logger";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
import { BaseAdapter } from "../base.adapter";
import * as ops from "./operations";
import type { LocalContext } from "./types";

export class LocalAdapter extends BaseAdapter<LocalContext> {
  constructor() {
    const storagePath = process.env.LOCAL_STORAGE_PATH || "./storage/";
    const basePath = path.resolve(process.cwd(), storagePath);

    const context: LocalContext = {
      basePath,
      baseUrl: NEXT_PUBLIC_BASE_URL,
    };

    super(context, ops);
    logger.info(`Local storage initialized at: ${this.context.basePath}`);
  }
}
