import type { createReadStream } from "node:fs";
import path from "node:path";
import {
  DEFAULT_STORAGE_CACHE_CONTROL,
  PRIVATE_STORAGE_CACHE_CONTROL,
} from "@/app/api/storage/files/[[...path]]/route.constants";
import { extToMime } from "@/shared/utils";
import {
  APPEARANCE_LOGO_CACHE_CONTROL,
  isAppearanceLogoStoragePath,
} from "@/shared/utils/appearance-logo-storage.utils";

/**
 * Resolve the `Cache-Control` header value for a served storage asset.
 *
 * Appearance logos (paths under `public/appearance/`) are served with the
 * long-lived immutable header ({@link APPEARANCE_LOGO_CACHE_CONTROL}) because
 * their storage keys are UUID-randomized — a re-upload produces a new URL,
 * so the bytes behind any given URL never change. Other `public/` assets
 * keep the short-lived `max-age=3600` default (they may be overwritten in
 * place by the storage pipeline). Authenticated files outside `public/` are
 * access-controlled and use the `private` directive so shared caches never
 * store them.
 */
export function resolveCacheControl(relativePath: string): string {
  if (!relativePath.startsWith("public/")) {
    return PRIVATE_STORAGE_CACHE_CONTROL;
  }
  return isAppearanceLogoStoragePath(relativePath) ? APPEARANCE_LOGO_CACHE_CONTROL : DEFAULT_STORAGE_CACHE_CONTROL;
}

/**
 * Detect content type from file extension
 */
export function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  return extToMime[ext] || "application/octet-stream";
}

/**
 * Parse range header
 */
export function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  if (!match?.[1]) return null;

  const start = Number.parseInt(match[1], 10);
  const end = match[2] ? Number.parseInt(match[2], 10) : fileSize - 1;

  if (start >= fileSize || end >= fileSize || start > end) {
    return null;
  }

  return { start, end };
}

/**
 * Reconstruct relative file path from route params
 */
export async function getRelativePath(params: Promise<{ path?: string[] }>): Promise<string | null> {
  const resolvedParams = await params;
  return resolvedParams.path ? resolvedParams.path.join("/") : null;
}

/**
 * Images (except SVG, which can carry script payloads) are rendered inline;
 * every other asset is forced to download.
 */
export function isInlineImage(contentType: string): boolean {
  return contentType.startsWith("image/") && contentType !== "image/svg+xml";
}

/**
 * Convert a Node.js ReadStream into a web ReadableStream for use as a Response body.
 */
export function streamToReadableStream(stream: ReturnType<typeof createReadStream>): ReadableStream {
  return new ReadableStream({
    start(controller) {
      let streamError: unknown = null;
      stream.on("error", (error: unknown) => {
        streamError = error;
        controller.error(error);
      });
      stream.on("end", () => {
        if (!streamError) controller.close();
      });
      stream.on("data", (chunk: Buffer) => {
        if (!streamError) controller.enqueue(new Uint8Array(chunk));
      });
    },
    cancel() {
      stream.destroy();
    },
  });
}
