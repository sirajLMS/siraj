"use client";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, Chip, Grid, Paper, Skeleton, Stack, type Theme, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { type ReactNode, useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import type { QuotaItem, QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { useQuotaDetailViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel";
import {
  formatQuotaDate,
  formatQuotaKind,
  formatQuotaStatus,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";

type QuotaDetailT = ReturnType<typeof useQuotaDetailViewModel>["t"];

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

interface DetailFieldProps {
  caption: string;
  children: ReactNode;
  variant?: "body1" | "h6";
  fontWeight?: number;
}

function DetailField({ caption, children, variant = "body1", fontWeight = 600 }: DetailFieldProps) {
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {caption}
      </Typography>
      <Typography variant={variant} sx={{ fontWeight }}>
        {children}
      </Typography>
    </Grid>
  );
}

function QuotaDetailHeader({ quota, t }: { quota: QuotaItem; t: QuotaDetailT }) {
  const { label, color } = formatQuotaStatus(quota.status ?? "", t);
  return (
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
  );
}

function QuotaDetailFields({ quota, t }: { quota: QuotaItem; t: QuotaDetailT }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <DetailField caption={t.fields.kind}>{formatQuotaKind(quota.kind ?? "", t)}</DetailField>
        <DetailField caption={`${t.fields.remaining} / ${t.fields.totalClasses}`} variant="h6" fontWeight={700}>
          {quota.remaining} / {quota.totalClasses}
        </DetailField>
        <DetailField caption={t.fields.reservedClasses}>{quota.reservedClasses}</DetailField>
        <DetailField caption={t.fields.validUntil}>{formatQuotaDate(quota.validUntil)}</DetailField>
        <DetailField caption={t.fields.priority}>{quota.priority}</DetailField>
      </Grid>
    </Paper>
  );
}

interface QuotaLedgerSectionProps {
  t: QuotaDetailT;
  ledgerColumns: GridColDef<QuotaLedgerItem>[];
  ledgerEntries: readonly QuotaLedgerItem[];
  loadingLedger: boolean;
  ledgerPage: number;
  setLedgerPage: (page: number) => void;
  ledgerPageSize: number;
  ledgerTotalCount: number;
}

function QuotaLedgerSection({
  t,
  ledgerColumns,
  ledgerEntries,
  loadingLedger,
  ledgerPage,
  setLedgerPage,
  ledgerPageSize,
  ledgerTotalCount,
}: QuotaLedgerSectionProps) {
  return (
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
  );
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

  return (
    <Stack spacing={3} sx={{ py: 3 }}>
      <QuotaDetailHeader quota={quota} t={t} />
      <QuotaDetailFields quota={quota} t={t} />
      <QuotaLedgerSection
        t={t}
        ledgerColumns={ledgerColumns}
        ledgerEntries={ledgerEntries}
        loadingLedger={loadingLedger}
        ledgerPage={ledgerPage}
        setLedgerPage={setLedgerPage}
        ledgerPageSize={ledgerPageSize}
        ledgerTotalCount={ledgerTotalCount}
      />
    </Stack>
  );
}
