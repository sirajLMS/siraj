"use client";

import { ArrowBackOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, Fade } from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { QuotaDetailLoadingSkeleton } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaDetailLoadingSkeleton";
import type { QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaDetailViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";
import { DesktopBaseDeleteDialog } from "@/frontend/desktop/components/ui/dialog";
import { QuotaDetailSummaryDesktop } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaDetailSummaryDesktop";
import {
  buildDesktopBreadcrumbs,
  buildLedgerColumns,
} from "@/frontend/desktop/views/dashboard/billing/quota/quotaDetailDesktop.helpers";

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
                paginationOptions={buildServerPaginationOptions({
                  page: ledgerPage,
                  pageSize: ledgerPageSize,
                  totalCount: ledgerTotalCount,
                  onPageChange: (newPage: number) => setLedgerPage(newPage),
                })}
              />
            </Box>
          </DesktopSectionPanel>

          <DesktopBaseDeleteDialog
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
