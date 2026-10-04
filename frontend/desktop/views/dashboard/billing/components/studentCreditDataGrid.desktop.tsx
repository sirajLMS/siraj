"use client";

import { useMemo } from "react";
import type { StudentCreditDataGridDesktopProps } from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildStudentCreditDataGridDesktopColumns } from "@/frontend/desktop/views/dashboard/billing/components/studentCreditDataGridDesktop.columns";

export function StudentCreditDataGridDesktop({
  rows,
  labels,
  canManage,
  billingActionsDisabled = false,
  onSendReminder,
  loading = false,
  sendingReminderId = null,
}: Readonly<StudentCreditDataGridDesktopProps>) {
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoize the columns array so the DataGrid keeps stable column identity across prop-driven row updates; MUI X DataGrid re-runs row-height calc and virtualization when columns reference changes, so an inline array would force re-layout on every parent re-render
  const columns = useMemo(
    () =>
      buildStudentCreditDataGridDesktopColumns({
        labels,
        canManage,
        billingActionsDisabled,
        sendingReminderId,
        onSendReminder,
      }),
    [billingActionsDisabled, canManage, labels, onSendReminder, sendingReminderId]
  );

  return (
    <DesktopAppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id}
      emptyMessage={labels.noEntries}
      paginationOptions={{ mode: "client" }}
    />
  );
}
