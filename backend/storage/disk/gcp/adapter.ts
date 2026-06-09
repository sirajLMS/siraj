import type { Storage } from "@google-cloud/storage";
import { BaseAdapter } from "../base.adapter";
import * as ops from "./operations";
import type { GcpContext } from "./types";

export class GcpAdapter extends BaseAdapter<GcpContext> {
  constructor(storage: Storage) {
    const bucketName = process.env.GCP_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("GCP_BUCKET_NAME environment variable is required");
    }

    const context: GcpContext = {
      bucket: storage.bucket(bucketName),
      gcpBaseUrl: `https://storage.googleapis.com/${bucketName}/`,
    };

    super(context, ops);
  }
}
