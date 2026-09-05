"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { type ReactNode, useCallback, useState } from "react";
import { ExportButton } from "@/frontend/common/components/ui";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type SessionAuditReportsViewModel,
  useSessionAuditReportsViewModel,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/** Snackbar lifetime for the export outcome notices. */
const EXPORT_TOAST_DURATION_MS = 5000;

/**
 * Props both responsive tier views render the report from: the full page view
 * model plus the CSV export control, which the tier views render in the page
 * header's action slot alongside the single canonical title.
 */
export interface SessionAuditReportsViewProps extends SessionAuditReportsViewModel {
  /** Container-owned CSV export control rendered in the page header's action slot. */
  readonly exportAction: ReactNode;
}

const lazyViews = createLazyView<SessionAuditReportsViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/accounting/reports/session-audit-reports.mobile").then(m => ({
      default: m.SessionAuditReportsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/accounting/reports/session-audit-reports.desktop").then(m => ({
      default: m.SessionAuditReportsDesktopView,
    }))
);

interface SessionAuditCsvExportButtonProps {
  readonly labels: SessionAuditLabels;
  readonly onExportCsv: SessionAuditReportsViewModel["handleExportCsv"];
  /** Total rows matching the current filters; export stays disabled while empty. */
  readonly totalCount: number;
}

/**
 * Downloads the filtered report as CSV and surfaces the truncation notice when
 * the server capped the export at its row ceiling. A failed download is already
 * logged by the view-model handler (it resolves to null instead of rejecting),
 * so the busy flag always clears.
 */
function SessionAuditCsvExportButton({ labels, onExportCsv, totalCount }: Readonly<SessionAuditCsvExportButtonProps>) {
  const notifications = useNotifications();
  const [exporting, setExporting] = useState(false);

  const handleClick = useCallback(async () => {
    setExporting(true);
    const outcome = await onExportCsv();
    setExporting(false);
    if (outcome?.truncated) {
      notifications.show(labels.exportTruncated, {
        severity: "warning",
        autoHideDuration: EXPORT_TOAST_DURATION_MS,
      });
    }
  }, [labels.exportTruncated, notifications, onExportCsv]);

  return (
    <ExportButton
      id="session-audit-export-csv"
      startIcon={<FileDownloadOutlined />}
      disabled={exporting || totalCount === 0}
      onClick={() => {
        void handleClick();
      }}
    >
      {labels.action.exportCsv}
    </ExportButton>
  );
}

/**
 * Composition root of the Session Audit Reports page: builds the shared view
 * model, owns the CSV export control, and selects the responsive tier view.
 */
export function SessionAuditReportsContainer() {
  const viewModel = useSessionAuditReportsViewModel();
  const { labels, handleExportCsv, totalCount } = viewModel;

  return (
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile}
      desktop={lazyViews.desktop}
      props={{
        ...viewModel,
        exportAction: (
          <SessionAuditCsvExportButton labels={labels} onExportCsv={handleExportCsv} totalCount={totalCount} />
        ),
      }}
    />
  );
}
