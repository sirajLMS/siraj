"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useState } from "react";
import type { CarryoverCsvExportOutcome } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

/** Toast duration for the CSV export outcome notices. */
const EXPORT_TOAST_DURATION_MS = 5000;

export interface CarryoverExport {
  /** True while a download request is in flight. */
  readonly exporting: boolean;
  /** Runs the export and surfaces its outcome as a toast. */
  readonly runExport: () => void;
}

/**
 * Drives one CSV export run with a busy lock and outcome toasts: failure when
 * the download itself failed, the truncation notice when the server capped the
 * export at its row ceiling, and silence for a clean download. The wrapped
 * handler never rejects, so no try/catch is needed here.
 */
export function useCarryoverExport(
  handleExportCsv: () => Promise<CarryoverCsvExportOutcome | null>,
  labels: CarryoverLabels
): CarryoverExport {
  const notifications = useNotifications();
  const [exporting, setExporting] = useState(false);

  const runExport = useCallback(() => {
    const run = async () => {
      setExporting(true);
      const outcome = await handleExportCsv();
      setExporting(false);
      if (outcome === null) {
        notifications.show(labels.exportFailed, {
          severity: "error",
          autoHideDuration: EXPORT_TOAST_DURATION_MS,
        });
        return;
      }
      if (outcome.truncated) {
        notifications.show(labels.exportTruncated, {
          severity: "warning",
          autoHideDuration: EXPORT_TOAST_DURATION_MS,
        });
      }
    };
    void run();
  }, [handleExportCsv, labels, notifications]);

  return { exporting, runExport };
}
