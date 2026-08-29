"use client";

import { AccessTimeFilledOutlined } from "@mui/icons-material";
import { Alert, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { StatusBadge } from "@/frontend/common/components/ui/badge";
import type {
  StudentCreditHoursTransactionRow,
  StudentCreditHoursViewModel,
} from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";
import { DesktopLoadingState } from "@/frontend/desktop/components/ui/state";

function buildTransactionColumns(
  labels: StudentCreditHoursViewModel["labels"]
): GridColDef<StudentCreditHoursTransactionRow>[] {
  return [
    {
      field: "dateLabel",
      headerName: labels.columns.date,
      flex: 1,
      minWidth: 140,
    },
    {
      field: "changeLabel",
      headerName: labels.columns.change,
      flex: 0.7,
      minWidth: 110,
      align: "right",
      headerAlign: "right",
      renderCell: params => (
        <Typography
          variant="labelSm"
          sx={theme => ({
            fontWeight: 600,
            color: params.row.isPositive ? theme.palette.success.main : theme.palette.error.main,
          })}
        >
          {params.row.changeLabel}
        </Typography>
      ),
    },
    {
      field: "reasonStatus",
      headerName: labels.columns.reason,
      flex: 0.9,
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <StatusBadge category="creditTransaction" status={params.row.reasonStatus} label={params.row.reasonLabel} />
      ),
    },
    {
      field: "notes",
      headerName: labels.columns.note,
      flex: 1.6,
      minWidth: 200,
      sortable: false,
    },
  ];
}

export function StudentCreditHoursDesktopView(props: Readonly<StudentCreditHoursViewModel>) {
  const { labels } = props;

  if (props.initialLoading) {
    return <DesktopLoadingState />;
  }
  if (props.balanceError) {
    return <Alert severity="error">{labels.loadError}</Alert>;
  }

  return (
    <Stack spacing={3}>
      {props.hint ? (
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {props.hint}
        </Typography>
      ) : null}

      {props.lowBalanceMessage ? (
        <Alert severity="warning" icon={<AccessTimeFilledOutlined fontSize="inherit" />}>
          {props.lowBalanceMessage}
        </Alert>
      ) : null}

      <DesktopMetricCardGrid metrics={props.metrics} />

      <DesktopSectionPanel contentPadding={false} title={labels.recentPurchasesTitle}>
        {props.transactionsError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {labels.loadError}
          </Alert>
        ) : (
          <DesktopAppDataGrid
            rows={props.transactions}
            columns={buildTransactionColumns(labels)}
            loading={props.transactionsLoading}
            emptyMessage={labels.recentPurchasesEmpty}
            ariaLabel={labels.recentPurchasesTitle}
            paginationOptions={props.transactionsPagination}
            autoHeight
            disableRowSelectionOnClick
            sx={{ border: "none", "& .MuiDataGrid-cell:focus": { outline: "none" } }}
          />
        )}
      </DesktopSectionPanel>
    </Stack>
  );
}
