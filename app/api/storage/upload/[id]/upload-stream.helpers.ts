import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { verifyImageMagicBytes } from "@/backend/lib/storage/mime-allowlist";

/**
 * Error thrown while streaming an upload body to disk. Carries the HTTP
 * status the route should respond with.
 */
export class UploadStreamError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const MAGIC_HEADER_BYTES = 16;
const STREAM_SIZE_SLACK_BYTES = 1024n;

/**
 * Bridge DOM ReadableStream to a Node Readable via async iteration.
 */
function toNodeReadable(stream: ReadableStream): Readable {
  return Readable.from(stream);
}

/** Options controlling the streamed-body size cap and validation messages. */
interface StreamToFileOptions {
  maxSizeBytes: bigint;
  contentType: string;
  hashMismatchMessage: string;
  magicMismatchMessage: string;
  sizeExceededMessage: string;
}

/**
 * Stream request body to file while calculating SHA-256. Enforces the
 * server-side byte cap on the actual streamed payload (the client's
 * Content-Length is not trusted) and verifies the magic bytes of the first
 * bytes for image content types.
 */
export async function streamToFile(
  stream: ReadableStream,
  filePath: string,
  expectedMd5: string,
  options: StreamToFileOptions
): Promise<void> {
  const hash = crypto.createHash("sha256");
  const writeStream = createWriteStream(filePath);

  let receivedBytes = 0n;
  let headerBytes = Buffer.alloc(0);

  const hashTransform = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      receivedBytes += BigInt(chunk.length);

      if (receivedBytes > options.maxSizeBytes + STREAM_SIZE_SLACK_BYTES) {
        callback(new UploadStreamError(413, options.sizeExceededMessage));
        return;
      }

      if (headerBytes.length < MAGIC_HEADER_BYTES) {
        headerBytes = Buffer.concat([headerBytes, chunk.subarray(0, MAGIC_HEADER_BYTES - headerBytes.length)]);
      }

      hash.update(chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(toNodeReadable(stream), hashTransform, writeStream);

    if (headerBytes.length > 0 && !verifyImageMagicBytes(options.contentType, headerBytes)) {
      throw new UploadStreamError(400, options.magicMismatchMessage);
    }

    const actualHash = hash.digest("base64");
    if (actualHash !== expectedMd5) {
      throw new Error(options.hashMismatchMessage);
    }
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});
    throw error;
  }
}
