"use client";

import { useCallback, useState } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { OverrideDialog } from "@/frontend/common/views/dashboard/accounting/payroll/OverrideDialog";
import {
  type PayrollReportRow,
  type PayrollReportsViewModel,
  usePayrollReportsViewModel,
} from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";

/**
 * Props both responsive tier views render the report from: the full page view
 * model plus the override-dialog opener raised by the data grid's row action.
 */
export interface PayrollReportsViewProps extends PayrollReportsViewModel {
  /** Opens the override dialog for one report row (manage-permission operators only). */
  readonly onOverride: (row: PayrollReportRow) => void;
}

const lazyViews = createLazyView<PayrollReportsViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/accounting/payroll/payroll.mobile").then(m => ({
      default: m.PayrollReportsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/accounting/payroll/payroll.desktop").then(m => ({
      default: m.PayrollReportsDesktopView,
    }))
);

/**
 * Composition root of the Payroll Reports page: builds the shared view model,
 * selects the responsive tier view, and owns the override-dialog session. The
 * dialog renders here rather than inside either tier view because a modal is
 * tier-neutral — only one instance should exist regardless of the active tier.
 */
export function PayrollReportsContainer() {
  const viewModel = usePayrollReportsViewModel();
  const [overrideRow, setOverrideRow] = useState<PayrollReportRow | null>(null);
  const { onRetry: refetchReport } = viewModel;

  const handleOverrideDialogClosed = useCallback(() => {
    setOverrideRow(null);
    // A completed override already evicted the cached report page; refetching
    // on close also refreshes rows an override elsewhere may have shifted, so
    // the grid never shows a stale calculation after the dialog goes away.
    refetchReport();
  }, [refetchReport]);

  return (
    <>
      <ResponsiveViewSwitch
        mobile={lazyViews.mobile}
        desktop={lazyViews.desktop}
        props={{ ...viewModel, onOverride: setOverrideRow }}
      />
      <OverrideDialog open={overrideRow !== null} row={overrideRow} onClose={handleOverrideDialogClosed} />
    </>
  );
}
