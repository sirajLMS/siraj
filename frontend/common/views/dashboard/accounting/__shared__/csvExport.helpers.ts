import { logger } from "@/frontend/common/utils/logger";

/** Result of a completed CSV export download; null means the export failed. */
export interface CsvExportDownloadResult {
  /** True when the exported set exceeded the server-side 10 000-row export ceiling. */
  readonly truncated: boolean;
}

interface CsvExportDownloadOptions {
  readonly url: string;
  /** Pulls the server-provided filename out of a Content-Disposition header; when omitted the anchor download attribute is left unset. */
  readonly resolveFilename?: (disposition: string | null) => string;
  readonly requestFailedMessage: string;
  readonly exportFailedMessage: string;
}

/**
 * Downloads the exact filtered result set the grid shows, reads the truncation
 * header for the > 10 000-row notice, and saves via a blob so the response
 * headers stay readable (a plain anchor cannot expose them). The caller
 * surfaces the outcome as a warning toast.
 */
export async function downloadCsvExport(options: CsvExportDownloadOptions): Promise<CsvExportDownloadResult | null> {
  const { url, resolveFilename, requestFailedMessage, exportFailedMessage } = options;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      logger.error(requestFailedMessage, { status: response.status, url });
      return null;
    }
    const truncated = response.headers.get("X-Export-Truncated") === "true";
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    if (resolveFilename) {
      link.download = resolveFilename(response.headers.get("Content-Disposition"));
    }
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    return { truncated };
  } catch (exportError) {
    logger.error(exportFailedMessage, { error: exportError, url });
    return null;
  }
}
