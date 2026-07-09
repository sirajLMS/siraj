"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, PersonProfileLinkCell, StatusBadge } from "@/frontend/components/ui";
import { studentHref } from "@/frontend/utils/profileHref";
import type { StudentCreditRow, StudentCreditStatus } from "@/frontend/views/dashboard/billing/types/billingViewTypes";

export interface StudentCreditDataGridLabels {
  readonly student: string;
  readonly parentContact: string;
  readonly planType: string;
  readonly classesLeft: string;
  readonly status: string;
  readonly quickAction: string;
  readonly sendReminder: string;
  readonly negativeBalance: string;
  readonly activeCredit: string;
  readonly noEntries: string;
  readonly creditStatusLabels: Record<StudentCreditStatus, string>;
}

interface StudentCreditDataGridProps {
  readonly rows: readonly StudentCreditRow[];
  readonly labels: StudentCreditDataGridLabels;
  readonly canManage: boolean;
  readonly onSendReminder: (id: string) => void;
  readonly loading?: boolean;
}

function formatClassesLeft(row: StudentCreditRow): string {
  return `${row.classesLeft} / ${row.classesTotal}`;
}

// Small warning icon for negative balance indicators, styled with error color
const StyledWarningIcon = styled(WarningAmberOutlined)(({ theme }) => ({
  fontSize: 16,
  color: theme.palette.error.main,
}));

export function StudentCreditDataGrid({
  rows,
  labels,
  canManage,
  onSendReminder,
  loading = false,
}: Readonly<StudentCreditDataGridProps>) {
  const columns = useMemo<GridColDef<StudentCreditRow>[]>(
    () => [
      {
        field: "studentName",
        headerName: labels.student,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <PersonProfileLinkCell name={row.studentName} href={studentHref(row.id)} avatarSize={40} fontWeight={700} />
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
              <StatusBadge category="invoice" status={isNegative ? "OVERDUE" : "PAID"} label={formatClassesLeft(row)} />
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
          if (!canManage || row.status !== "negative_balance") {
            return null;
          }
          return (
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                onSendReminder(row.id);
              }}
            >
              {labels.sendReminder}
            </Button>
          );
        },
      },
    ],
    [canManage, labels, onSendReminder]
  );

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id}
      emptyMessage={labels.noEntries}
    />
  );
}
