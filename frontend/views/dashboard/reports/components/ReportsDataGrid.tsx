"use client";

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, PersonProfileLinkCell } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { profileHrefForTeacher, studentHref } from "@/frontend/utils/profileHref";
import type { ReportLedgerRow, ReportType } from "@/frontend/views/dashboard/reports/types/reportsTypes";
import { formatReportPaidAmounts } from "@/frontend/views/dashboard/reports/utils/formatReportPaidAmounts";

export interface ReportsDataGridLabels {
  readonly name: string;
  readonly taken: string;
  readonly absent: string;
  readonly leave: string;
  readonly pending: string;
  readonly hours: string;
  readonly paid: string;
  readonly noEntries: string;
}

interface ReportsDataGridProps {
  readonly rows: readonly ReportLedgerRow[];
  readonly labels: ReportsDataGridLabels;
  readonly reportType: ReportType;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
  readonly loading?: boolean;
}

function nameHrefForRow(row: ReportLedgerRow, reportType: ReportType): string | undefined {
  if (!row.entityId) {
    return undefined;
  }
  if (reportType === "by_teacher") {
    return profileHrefForTeacher({ teacherId: row.entityId });
  }
  if (reportType === "by_student") {
    return studentHref(row.entityId);
  }
  return undefined;
}

function renderCountCell(value: number, tone: "default" | "error" | "primary" = "default") {
  return (
    <Typography
      variant="bodyMd"
      sx={theme => {
        if (tone === "error") {
          return { color: theme.palette.error.main, fontWeight: 600, textAlign: "center", width: "100%" };
        }
        if (tone === "primary") {
          return { color: theme.palette.primary.main, fontWeight: 600, textAlign: "center", width: "100%" };
        }
        return { color: theme.palette.text.secondary, textAlign: "center", width: "100%" };
      }}
    >
      {value}
    </Typography>
  );
}

export function ReportsDataGrid({
  rows,
  labels,
  reportType,
  loading = false,
  onRowClick,
}: Readonly<ReportsDataGridProps>) {
  const { hasPermission } = useUserStore();
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);
  const locale = useLocale();
  const t = useTranslations("dashboard.reports");
  const tErrors = useTranslations("errors");

  const columns = useMemo<GridColDef<ReportLedgerRow>[]>(() => {
    const cols: GridColDef<ReportLedgerRow>[] = [
      {
        field: "name",
        headerName: labels.name,
        flex: 1.4,
        minWidth: 200,
        renderCell: ({ row }) => (
          <PersonProfileLinkCell
            name={row.name}
            href={nameHrefForRow(row, reportType)}
            fallbackInitial={row.avatarInitials}
            avatarSize={32}
            fontWeight={600}
          />
        ),
      },
      {
        field: "taken",
        headerName: labels.taken,
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => renderCountCell(row.taken, "primary"),
      },
      {
        field: "absent",
        headerName: labels.absent,
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => renderCountCell(row.absent, "error"),
      },
      {
        field: "leave",
        headerName: labels.leave,
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => renderCountCell(row.leave),
      },
      {
        field: "pending",
        headerName: labels.pending,
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => renderCountCell(row.pending),
      },
    ];

    if (showFinancials) {
      cols.push(
        {
          field: "hours",
          headerName: labels.hours,
          width: 100,
          align: "center",
          headerAlign: "center",
          renderCell: ({ row }) => (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {row.hours}
            </Typography>
          ),
        },
        {
          field: "paidAmounts",
          headerName: labels.paid,
          flex: 1,
          minWidth: 180,
          align: "right",
          headerAlign: "right",
          sortable: false,
          renderCell: ({ row }) => (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}>
              {formatReportPaidAmounts(row.paidAmounts, locale, {
                convertedAmount: values => t("convertedAmount", values),
                displayCurrencyFallback: values => tErrors("displayCurrencyFallback", values),
              })}
            </Typography>
          ),
        }
      );
    }

    return cols;
  }, [labels, locale, reportType, showFinancials, t, tErrors]);

  return (
    <Box sx={{ px: { xs: 0, md: 1 }, pb: 1 }}>
      <AppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage={labels.noEntries}
        autoHeight
        disableColumnMenu
        onRowClick={
          onRowClick
            ? params => {
                onRowClick(params.row);
              }
            : undefined
        }
        sx={{ "& .MuiDataGrid-row": onRowClick ? { cursor: "pointer" } : {} }}
      />
    </Box>
  );
}
