"use client";

import { DeleteOutlined } from "@mui/icons-material";
import { Fade } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import type { QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaDetailViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel";
import {
  MobileBaseDeleteDialog,
  MobileCardList,
  MobileContentStack,
  MobileFab,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { QuotaDetailSummaryMobile } from "@/frontend/mobile/views/dashboard/billing/quota/components/QuotaDetailSummaryMobile";
import {
  MobileQuotaDetailSkeleton,
  MobileQuotaLedgerItem,
  MobileQuotaLedgerSkeleton,
} from "@/frontend/mobile/views/dashboard/billing/quota/quotaDetail.parts";

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

          <MobileContentStack gap={3} paddingBottom={4}>
            <MobileSectionPanel title={t.quotaDetails} contentInset={false}>
              <QuotaDetailSummaryMobile quota={quota} t={t} />
            </MobileSectionPanel>

            <MobileSectionPanel title={t.ledger.title} contentInset={false}>
              <MobileCardList<QuotaLedgerItem>
                rows={ledgerEntries}
                renderItem={(entry, index) => <MobileQuotaLedgerItem entry={entry} index={index} />}
                getKey={entry => entry.id ?? ""}
                loading={loadingLedger}
                emptyMessage={t.ledger.title}
                renderSkeleton={MobileQuotaLedgerSkeleton}
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
        />

        <FormErrorSnackbar open={deleteErrorOpen} message={t.errors.deleteFailed} onClose={onDeleteErrorClose} />
      </div>
    </Fade>
  );
}
