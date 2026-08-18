"use client";

import { ArrowBackOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, Fade, type Theme, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useMemo } from "react";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { QuotaDetailLoadingSkeleton } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaDetailLoadingSkeleton";
import type { QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaDetailViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel";
import { formatQuotaDate } from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";
import { QuotaDetailSummaryDesktop } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaDetailSummaryDesktop";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

function buildDesktopBreadcrumbs(t: QuotaLabels) {
  return [
    { label: t.listTitle, href: "/quotas" },
    { label: t.quotaDetails, current: true },
  ];
}

function buildLedgerColumns(t: QuotaLabels): GridColDef<QuotaLedgerItem>[] {
  return [
    {
      field: "reason",
      headerName: t.ledger.reason,
      flex: 1,
      minWidth: 140,
    },
    {
      field: "delta",
      headerName: t.ledger.delta,
      type: "number",
      flex: 0.8,
      minWidth: 100,
      renderCell: params => (
        <Typography variant="body2" sx={(theme: Theme) => ({ fontWeight: 700, ...getDeltaColor(params.value, theme) })}>
          {params.value > 0 ? `+${params.value}` : params.value}
        </Typography>
      ),
    },
    {
      field: "reasonNote",
      headerName: t.ledger.note,
      flex: 1.5,
      minWidth: 180,
      renderCell: params => params.value ?? "—",
    },
    {
      field: "createdAt",
      headerName: t.ledger.date,
      flex: 1,
      minWidth: 150,
      renderCell: params => formatQuotaDate(params.value),
    },
  ];
}

function getDeltaColor(value: number, theme: Theme) {
  if (value > 0) return { color: theme.palette.success.main };
  if (value < 0) return { color: theme.palette.error.main };
  return { color: theme.palette.text.primary };
}

export function QuotaDetailDesktop(props: Readonly<QuotaDetailViewModel>) {
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
    deleteDialogOpen,
    deleting,
    onDeleteDialogOpen,
    onDeleteDialogClose,
    onDeleteConfirm,
    deleteErrorOpen,
    onDeleteErrorClose,
  } = props;

  const ledgerColumns = useMemo(() => buildLedgerColumns(t), [t]);

  if (loadingQuota) {
    return (
      <DesktopPageContainer>
        <QuotaDetailLoadingSkeleton />
      </DesktopPageContainer>
    );
  }

  if (!quota) {
    return null;
  }

  const quotaName = quota.name ?? t.quotaDetails;

  return (
    <Fade in timeout={300}>
      <div>
        <DesktopPageContainer>
          <DesktopPageHeader
            title={quotaName}
            breadcrumbs={buildDesktopBreadcrumbs(t)}
            titleVariant="headlineLg"
            actions={
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Link href="/quotas" style={{ textDecoration: "none" }}>
                  <Button startIcon={<ArrowBackOutlined />} color="inherit">
                    {t.actions.cancel}
                  </Button>
                </Link>
                <Link href={`/quotas/${quota.id}/edit`} style={{ textDecoration: "none" }}>
                  <Button variant="outlined" startIcon={<EditOutlined />}>
                    {t.actions.edit}
                  </Button>
                </Link>
                <Button variant="outlined" color="error" startIcon={<DeleteOutlined />} onClick={onDeleteDialogOpen}>
                  {t.actions.delete}
                </Button>
              </Box>
            }
          />

          <DesktopSectionPanel title={t.quotaDetails}>
            <QuotaDetailSummaryDesktop quota={quota} t={t} />
          </DesktopSectionPanel>

          <DesktopSectionPanel title={t.ledger.title} contentPadding={false}>
            <Box sx={{ width: "100%", height: 400 }}>
              <DesktopAppDataGrid<QuotaLedgerItem>
                rows={ledgerEntries}
                columns={ledgerColumns}
                loading={loadingLedger}
                ariaLabel={t.ledger.title}
                emptyMessage={t.ledger.title}
                paginationOptions={{
                  mode: "server",
                  page: ledgerPage + 1,
                  pageSize: ledgerPageSize,
                  totalCount: ledgerTotalCount,
                  onPageChange: (newPage: number) => setLedgerPage(newPage - 1),
                }}
              />
            </Box>
          </DesktopSectionPanel>

          <BaseDeleteDialog
            open={deleteDialogOpen}
            onClose={onDeleteDialogClose}
            onConfirm={onDeleteConfirm}
            isLoading={deleting}
            title={t.deleteConfirm.title}
            body={t.deleteConfirm.body(quota.name ?? "")}
            cancelLabel={t.deleteConfirm.cancel}
            confirmLabel={t.deleteConfirm.confirm}
          />

          <FormErrorSnackbar open={deleteErrorOpen} message={t.errors.deleteFailed} onClose={onDeleteErrorClose} />
        </DesktopPageContainer>
      </div>
    </Fade>
  );
}
