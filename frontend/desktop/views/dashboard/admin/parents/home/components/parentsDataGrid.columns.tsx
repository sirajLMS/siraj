"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import type {
  ParentDirectoryRow,
  ParentsDataGridLabels,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import {
  buildDirectoryEmailColumn,
  buildDirectoryIndexColumn,
  buildDirectoryNameColumn,
} from "@/frontend/desktop/views/dashboard/admin/parents/home/components/directoryDataGridShared";
import { ParentRowActions } from "@/frontend/desktop/views/dashboard/admin/parents/home/components/parentsDataGrid.parts";

function renderUnpaidInvoicesCell(row: ParentDirectoryRow, labels: ParentsDataGridLabels) {
  const hasUnpaid = row.unpaidInvoices > 0;
  return (
    <DesktopStatusBadge
      category="invoice"
      status={hasUnpaid ? "OVERDUE" : "PAID"}
      label={hasUnpaid ? labels.unpaidCount(row.unpaidInvoices) : labels.invoicesCleared}
    />
  );
}

export function buildParentDirectoryColumns({
  labels,
  onOpenSettings,
  canParentManageStatus,
}: Readonly<{
  labels: ParentsDataGridLabels;
  onOpenSettings: (id: string) => void;
  canParentManageStatus: boolean;
}>): GridColDef<ParentDirectoryRow>[] {
  return [
    buildDirectoryIndexColumn<ParentDirectoryRow>(labels.index),
    buildDirectoryNameColumn<ParentDirectoryRow>(
      labels.name,
      row => profileHrefForParent({ userId: row.userId, parentId: row.id }),
      1.5
    ),
    buildDirectoryEmailColumn<ParentDirectoryRow>(labels.email),
    {
      field: "time",
      headerName: labels.time,
      width: 120,
      renderCell: ({ row }) => (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {row.time}
        </Typography>
      ),
    },
    {
      field: "lifecycleStatus",
      headerName: labels.status,
      width: 130,
      renderCell: ({ row }) => (
        <DesktopStatusBadge
          category="studentAccount"
          status={row.lifecycleStatus}
          label={labels.statusLabels[row.lifecycleStatus]}
        />
      ),
    },
    {
      field: "accountStatus",
      headerName: labels.accountStatus,
      width: 120,
      renderCell: ({ row }) => (
        <DesktopStatusBadge
          category="staffAccount"
          status={row.accountStatus}
          label={labels.accountStatusLabels[row.accountStatus]}
        />
      ),
    },
    {
      field: "unpaidInvoices",
      headerName: labels.unpaidInvoices,
      width: 160,
      renderCell: ({ row }) => renderUnpaidInvoicesCell(row, labels),
    },
    {
      field: "actions",
      headerName: labels.options,
      width: 220,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <ParentRowActions
          row={row}
          labels={labels}
          onOpenSettings={onOpenSettings}
          canParentManageStatus={canParentManageStatus}
        />
      ),
    },
  ];
}
