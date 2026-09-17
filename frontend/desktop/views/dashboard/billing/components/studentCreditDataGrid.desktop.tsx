"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { studentHref } from "@/frontend/common/utils/profileHref";
import type { StudentCreditRow } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { StudentCreditDataGridDesktopProps } from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { formatClassesLeft } from "@/frontend/common/views/dashboard/billing/utils/parentInvoiceFormatters";
import {
  DesktopAppDataGrid,
  DesktopPersonProfileLinkCell,
  DesktopPrimaryPageAction,
} from "@/frontend/desktop/components/ui";

const StyledWarningIcon = styled(WarningAmberOutlined)(({ theme }) => ({
  fontSize: theme.typography.bodyLg.fontSize,
  color: theme.palette.warning.main,
}));

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
  const columns = useMemo<GridColDef<StudentCreditRow>[]>(
    () => [
      {
        field: "studentName",
        headerName: labels.student,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <DesktopPersonProfileLinkCell
            name={row.studentName}
            href={studentHref(row.id)}
            avatarSize={40}
            fontWeight={700}
          />
        ),
      },
      {
        field: "parentEmail",
        headerName: labels.parentContact,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => <Typography variant="bodyMd">{row.parentEmail}</Typography>,
      },
      {
        field: "planType",
        headerName: labels.planType,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => <Typography variant="bodyMd">{row.planType}</Typography>,
      },
      {
        field: "classesLeft",
        headerName: labels.classesLeft,
        flex: 0.9,
        minWidth: 130,
        renderCell: ({ row }) => {
          const isNegative = row.status === "negative_balance";
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: "100%" }}>
              <Typography
                variant="bodyMd"
                sx={theme => ({
                  fontWeight: isNegative ? 700 : 500,
                  color: isNegative ? theme.palette.warning.main : theme.palette.text.primary,
                })}
              >
                {formatClassesLeft(row)}
              </Typography>
              {isNegative && <StyledWarningIcon />}
            </Box>
          );
        },
      },
      {
        field: "status",
        headerName: labels.status,
        flex: 0.9,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography
            variant="bodyMd"
            sx={theme => ({
              fontWeight: row.status === "negative_balance" ? 700 : 500,
              color: row.status === "negative_balance" ? theme.palette.error.main : theme.palette.onSecondaryContainer,
            })}
          >
            {labels.creditStatusLabels[row.status]}
          </Typography>
        ),
      },
      {
        field: "quickAction",
        headerName: labels.quickAction,
        flex: 0.9,
        minWidth: 140,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => {
          if (!canManage || billingActionsDisabled || row.status !== "negative_balance") {
            return null;
          }
          const isSending = sendingReminderId === row.id;
          return (
            <DesktopPrimaryPageAction
              size="small"
              onClick={() => {
                onSendReminder(row.id);
              }}
              disabled={isSending}
            >
              {isSending ? <CircularProgress size={18} color="inherit" /> : labels.sendReminder}
            </DesktopPrimaryPageAction>
          );
        },
      },
    ],
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
