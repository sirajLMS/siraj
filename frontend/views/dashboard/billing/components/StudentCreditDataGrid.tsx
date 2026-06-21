"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui";
import type { StudentCreditRow, StudentCreditStatus } from "../types/billingViewTypes";

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
}

function formatClassesLeft(row: StudentCreditRow): string {
  return `${row.classesLeft} / ${row.classesTotal}`;
}

export function StudentCreditDataGrid({
  rows,
  labels,
  canManage,
  onSendReminder,
}: Readonly<StudentCreditDataGridProps>) {
  const columns = useMemo<GridColDef<StudentCreditRow>[]>(
    () => [
      {
        field: "studentName",
        headerName: labels.student,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
            {row.studentName}
          </Typography>
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
              <Chip
                label={formatClassesLeft(row)}
                size="small"
                sx={theme => ({
                  fontWeight: 700,
                  bgcolor: isNegative ? theme.palette.errorContainer : theme.palette.secondaryContainer,
                  color: isNegative ? theme.palette.error.main : theme.palette.onSecondaryContainer,
                })}
              />
              {isNegative && <WarningAmberOutlined sx={theme => ({ fontSize: 16, color: theme.palette.error.main })} />}
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

  return <AppDataGrid rows={rows} columns={columns} getRowId={row => row.id} emptyMessage={labels.noEntries} />;
}
