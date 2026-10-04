"use client";

import { PayrollCsvExportShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/payrollCsvExportShared";
import type { PayrollReportsViewModel } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import { MobileExportButton } from "@/frontend/mobile/components/ui/button";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

interface PayrollExportCsvButtonProps {
  readonly labels: PayrollLabels;
  readonly onExportCsv: PayrollReportsViewModel["onExportCsv"];
}

/**
 * Mobile CSV export affordance: runs the view-model's filtered download and
 * surfaces its outcome — a failure toast when the download itself failed, and
 * the truncation notice when the server capped the export at its row ceiling.
 */
export function PayrollExportCsvButton({ labels, onExportCsv }: Readonly<PayrollExportCsvButtonProps>) {
  return (
    <PayrollCsvExportShared
      id="payroll-reports-export-csv"
      labels={labels}
      onExportCsv={onExportCsv}
      ButtonComponent={MobileExportButton}
    />
  );
}
