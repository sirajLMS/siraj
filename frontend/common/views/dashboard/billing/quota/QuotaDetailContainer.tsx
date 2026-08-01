"use client";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, Chip, Grid, Paper, Skeleton, Stack, type Theme, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import type { QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { useQuotaDetailViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel";
import {
  formatQuotaDate,
  formatQuotaKind,
  formatQuotaStatus,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";

function getDeltaColor(value: number) {
  return (theme: Theme) => {
    if (value > 0) return { color: theme.palette.success.main };
    if (value < 0) return { color: theme.palette.error.main };
    return { color: theme.palette.text.primary };
  };
}

interface QuotaDetailContainerProps {
  quotaId: string;
}

export function QuotaDetailContainer({ quotaId }: QuotaDetailContainerProps) {
  const {
    t,
    quota,
    loadingQuota,
    ledgerEntries,
    ledgerTotalCount,
    loadingLedger,
    ledgerPage,
    setLedgerPage,
    ledgerPageSize,
  } = useQuotaDetailViewModel(quotaId);

  const ledgerColumns = useMemo<GridColDef<QuotaLedgerItem>[]>(
    () => [
      {
        field: "reason",
        headerName: t.ledger.reason,
        flex: 1,
        minWidth: 140,
        renderCell: params => <Chip label={params.value} size="small" variant="outlined" />,
      },
      {
        field: "delta",
        headerName: t.ledger.delta,
        type: "number",
        flex: 0.8,
        minWidth: 100,
        renderCell: params => (
          <Typography variant="body2" sx={[{ fontWeight: 700 }, getDeltaColor(params.value)]}>
            {params.value > 0 ? `+${params.value}` : params.value}
          </Typography>
        ),
      },
      {
        field: "reasonNote",
        headerName: t.ledger.note,
        flex: 1.5,
        minWidth: 180,
        renderCell: params => params.value || "-",
      },
      {
        field: "createdAt",
        headerName: t.ledger.date,
        flex: 1,
        minWidth: 150,
        renderCell: params => formatQuotaDate(params.value),
      },
    ],
    [t]
  );

  if (loadingQuota) {
    return <Skeleton variant="rectangular" height={400} />;
  }

  if (!quota) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>{t.noQuotas}</Typography>
      </Box>
    );
  }

  const { label, color } = formatQuotaStatus(quota.status ?? "", t);

  return (
    <Stack spacing={3} sx={{ py: 3 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Button startIcon={<ArrowBackOutlinedIcon />} component={Link} href="/quotas" color="inherit">
            {t.actions.cancel}
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {quota.name}
          </Typography>
          <Chip label={label} color={color} size="small" />
        </Stack>

        <Button variant="outlined" startIcon={<EditOutlinedIcon />} component={Link} href={`/quotas/${quota.id}/edit`}>
          {t.actions.edit}
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t.fields.kind}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {formatQuotaKind(quota.kind ?? "", t)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t.fields.remaining} / {t.fields.totalClasses}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {quota.remaining} / {quota.totalClasses}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t.fields.reservedClasses}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {quota.reservedClasses}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t.fields.validUntil}
            </Typography>
            <Typography variant="body1">{formatQuotaDate(quota.validUntil)}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t.fields.priority}
            </Typography>
            <Typography variant="body1">{quota.priority}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t.ledger.title}
        </Typography>

        <Box sx={{ width: "100%", height: 400 }}>
          <AppDataGrid<QuotaLedgerItem>
            rows={ledgerEntries}
            columns={ledgerColumns}
            loading={loadingLedger}
            paginationOptions={{
              mode: "server",
              page: ledgerPage + 1,
              pageSize: ledgerPageSize,
              totalCount: ledgerTotalCount,
              onPageChange: (newPage: number) => setLedgerPage(newPage - 1),
            }}
          />
        </Box>
      </Stack>
    </Stack>
  );
}
