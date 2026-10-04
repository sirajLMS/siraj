import { createReadStream, statSync } from "node:fs";
import { NextResponse } from "next/server";
import {
  getContentType,
  isInlineImage,
  parseRange,
  resolveCacheControl,
  streamToReadableStream,
} from "@/app/api/storage/files/[[...path]]/route.helpers";

interface StreamHeaderOptions {
  contentType: string;
  contentLength: number;
  contentRange?: string;
  lastModified: string;
  relativePath: string;
}

function buildStreamHeaders(options: StreamHeaderOptions): Record<string, string> {
  const { contentType, contentLength, contentRange, lastModified, relativePath } = options;
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": contentLength.toString(),
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Accept-Ranges": "bytes",
    "Cache-Control": resolveCacheControl(relativePath),
    "Last-Modified": lastModified,
  };
  if (contentRange) {
    headers["Content-Range"] = contentRange;
  }
  if (!isInlineImage(contentType)) {
    headers["Content-Disposition"] = "attachment";
  }
  return headers;
}

/**
 * Options for generating a range response
 */
interface RangeResponseOptions {
  absolutePath: string;
  rangeHeader: string;
  fileSize: number;
  contentType: string;
  lastModified: string;
  relativePath: string;
}

/**
 * Generate a partial content response for range requests
 */
function createRangeResponse(options: RangeResponseOptions): NextResponse {
  const { absolutePath, rangeHeader, fileSize, contentType, lastModified, relativePath } = options;
  const range = parseRange(rangeHeader, fileSize);

  if (!range) {
    return new NextResponse(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${fileSize}` },
    });
  }

  const { start, end } = range;
  const stream = createReadStream(absolutePath, { start, end });

  return new NextResponse(streamToReadableStream(stream), {
    status: 206,
    headers: buildStreamHeaders({
      contentType,
      contentLength: end - start + 1,
      contentRange: `bytes ${start}-${end}/${fileSize}`,
      lastModified,
      relativePath,
    }),
  });
}

export function buildFileResponse(
  absolutePath: string,
  relativePath: string,
  rangeHeader: string | null
): NextResponse {
  const stats = statSync(absolutePath);
  const contentType = getContentType(relativePath);
  const lastModified = stats.mtime.toUTCString();

  if (rangeHeader) {
    return createRangeResponse({
      absolutePath,
      rangeHeader,
      fileSize: stats.size,
      contentType,
      lastModified,
      relativePath,
    });
  }

  const stream = createReadStream(absolutePath);

  return new NextResponse(streamToReadableStream(stream), {
    status: 200,
    headers: buildStreamHeaders({ contentType, contentLength: stats.size, lastModified, relativePath }),
  });
}
