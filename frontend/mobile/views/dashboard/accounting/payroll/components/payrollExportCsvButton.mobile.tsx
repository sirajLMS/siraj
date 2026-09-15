"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useState } from "react";
import type { PayrollReportsViewModel } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import { MobileExportButton } from "@/frontend/mobile/components/ui/button";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/** Toast duration for the CSV export outcome notices. */
const EXPORT_TOAST_DURATION_MS = 5000;

interface PayrollExportCsvButtonProps {
  readonly labels: PayrollLabels;
  readonly onExportCsv: PayrollReportsViewModel["onExportCsv"];
}

/**
 * Mobile CSV export affordance: runs the view-model's filtered download and
 * surfaces its outcome — a failure toast when the download itself failed, and
 * the truncation notice when the server capped the export at its row ceiling.
 * The view-model handler never rejects (failures resolve to null), so the
 * busy flag always clears.
 */
export function PayrollExportCsvButton({ labels, onExportCsv }: Readonly<PayrollExportCsvButtonProps>) {
  const notifications = useNotifications();
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    const outcome = await onExportCsv();
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
  }, [labels, notifications, onExportCsv]);

  return (
    <MobileExportButton
      id="payroll-reports-export-csv"
      startIcon={<FileDownloadOutlined />}
      disabled={exporting}
      onClick={() => {
        void handleExportCsv();
      }}
    >
      {labels.exportCsv}
    </MobileExportButton>
  );
}
