"use client";

import { DeleteOutlined } from "@mui/icons-material";
import { Fade, Skeleton, Stack, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import type { QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaDetailViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel";
import { formatQuotaDate } from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";
import {
  MobileBaseDeleteDialog,
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobileFab,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { QuotaDetailSummaryMobile } from "@/frontend/mobile/views/dashboard/billing/quota/components/QuotaDetailSummaryMobile";

function renderLedgerSkeleton(): ReactNode {
  return SKELETON_KEYS.map(key => (
    <MobileCardListItem key={key} variant="edge-to-edge">
      <Stack spacing={1} sx={{ py: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </Stack>
    </MobileCardListItem>
  ));
}

const SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2"] as const;

function getDeltaColor(value: number, theme: Theme) {
  if (value > 0) return { color: theme.palette.success.main };
  if (value < 0) return { color: theme.palette.error.main };
  return { color: theme.palette.text.primary };
}

function renderLedgerItem(entry: QuotaLedgerItem, index: number): ReactNode {
  return (
    <MobileCardListItem
      key={entry.id}
      variant="edge-to-edge"
      sx={{
        animation: `ledgerGrowIn 300ms ease ${index * 50}ms both`,
        "@keyframes ledgerGrowIn": {
          from: { opacity: 0, transform: "scaleY(0.8)" },
          to: { opacity: 1, transform: "scaleY(1)" },
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <Stack spacing={0.5} sx={{ width: "100%" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {entry.reason}
          </Typography>
          <Typography
            variant="body2"
            sx={(theme: Theme) => ({ fontWeight: 700, ...getDeltaColor(entry.delta ?? 0, theme) })}
          >
            {(entry.delta ?? 0) > 0 ? `+${entry.delta}` : entry.delta}
          </Typography>
        </Stack>
        {entry.reasonNote ? (
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
            {entry.reasonNote}
          </Typography>
        ) : null}
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
          {formatQuotaDate(entry.createdAt)}
        </Typography>
      </Stack>
    </MobileCardListItem>
  );
}

function MobileQuotaDetailSkeleton() {
  return (
    <MobilePageContainer>
      <Stack spacing={2} aria-busy="true" sx={{ py: 2 }}>
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
      </Stack>
    </MobilePageContainer>
  );
}

export function QuotaDetailMobile(props: Readonly<QuotaDetailViewModel>) {
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

  if (loadingQuota) {
    return <MobileQuotaDetailSkeleton />;
  }

  if (!quota) {
    return null;
  }

  const quotaName = quota.name ?? t.quotaDetails;

  return (
    <Fade in timeout={300}>
      <div>
        <MobilePageContainer>
          <MobilePageHeader
            title={quotaName}
            breadcrumbs={[
              { label: t.listTitle, href: "/quotas" },
              { label: t.quotaDetails, current: true },
            ]}
          />

          <MobileContentStack>
            <MobileSectionPanel title={t.quotaDetails} contentInset={false}>
              <QuotaDetailSummaryMobile quota={quota} t={t} />
            </MobileSectionPanel>

            <MobileSectionPanel title={t.ledger.title} contentInset={false}>
              <MobileCardList<QuotaLedgerItem>
                rows={ledgerEntries}
                renderItem={(entry, index) => renderLedgerItem(entry, index)}
                getKey={entry => entry.id ?? ""}
                loading={loadingLedger}
                emptyMessage={t.ledger.title}
                renderSkeleton={renderLedgerSkeleton}
                layout="edge-to-edge"
                paginationOptions={buildServerPaginationOptions({
                  page: ledgerPage,
                  pageSize: ledgerPageSize,
                  totalCount: ledgerTotalCount,
                  onPageChange: (newPage: number) => setLedgerPage(newPage),
                })}
              />
            </MobileSectionPanel>
          </MobileContentStack>
        </MobilePageContainer>

        <MobileFab
          icon={<DeleteOutlined />}
          label={t.actions.delete}
          onClick={onDeleteDialogOpen}
          disabled={deleting}
        />

        <MobileBaseDeleteDialog
          open={deleteDialogOpen}
          onClose={onDeleteDialogClose}
          onConfirm={onDeleteConfirm}
          isLoading={deleting}
          title={t.deleteConfirm.title}
          body={t.deleteConfirm.body(quota.name ?? "")}
          cancelLabel={t.deleteConfirm.cancel}
          confirmLabel={t.deleteConfirm.confirm}
          fullScreen
        />

        <FormErrorSnackbar open={deleteErrorOpen} message={t.errors.deleteFailed} onClose={onDeleteErrorClose} />
      </div>
    </Fade>
  );
}
