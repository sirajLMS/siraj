"use client";

import { AddOutlined } from "@mui/icons-material";
import { Fade, Skeleton, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaListViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";
import { buildQuotaListMetrics } from "@/frontend/common/views/dashboard/billing/quota/utils";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobileEmptyState,
  MobileFab,
  MobileMetricCardGrid,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { QuotaListFiltersMobile } from "@/frontend/mobile/views/dashboard/billing/quota/components/QuotaListFiltersMobile";
import { QuotaListItemMobile } from "@/frontend/mobile/views/dashboard/billing/quota/components/QuotaListItemMobile";

const SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"] as const;

function renderSkeletons(): ReactNode {
  return SKELETON_KEYS.map(key => (
    <MobileCardListItem key={key} variant="edge-to-edge">
      <Stack spacing={1} sx={{ py: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="rectangular" height={40} sx={{ mt: 1 }} />
      </Stack>
    </MobileCardListItem>
  ));
}

export function QuotaListMobile(props: Readonly<QuotaListViewModel>) {
  const {
    t,
    quotas,
    totalCount,
    loading,
    page,
    pageSize,
    setPage,
    filterStatus,
    filterKind,
    searchQuery,
    setFilterStatus,
    setFilterKind,
    setSearchQuery,
  } = props;

  const router = useRouter();
  const metrics = buildQuotaListMetrics(t, totalCount, quotas);

  const renderItem = (quota: QuotaItem, index: number): ReactNode => (
    <MobileCardListItem
      variant="edge-to-edge"
      interactive
      sx={{
        animation: `quotaGrowIn 300ms ease ${index * 50}ms both`,
        "@keyframes quotaGrowIn": {
          from: { opacity: 0, transform: "scaleY(0.8)" },
          to: { opacity: 1, transform: "scaleY(1)" },
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <QuotaListItemMobile quota={quota} t={t} />
    </MobileCardListItem>
  );

  return (
    <Fade in timeout={300}>
      <div>
        <MobileContentStack gap={3} paddingBottom={4}>
          <MobileMetricCardGrid metrics={metrics} />

          <MobileSectionPanel title={t.listTitle} contentInset={false}>
            <QuotaListFiltersMobile
              t={t}
              searchQuery={searchQuery}
              filterStatus={filterStatus}
              filterKind={filterKind}
              setSearchQuery={setSearchQuery}
              setFilterStatus={setFilterStatus}
              setFilterKind={setFilterKind}
            />
          </MobileSectionPanel>

          {quotas.length === 0 && !loading ? (
            <MobileSectionPanel contentInset={false}>
              <MobileEmptyState title={t.noQuotas} subtitle={t.emptyListMessage} />
            </MobileSectionPanel>
          ) : (
            <MobileCardList<QuotaItem>
              rows={quotas}
              renderItem={renderItem}
              getKey={quota => quota.id ?? ""}
              loading={loading}
              emptyMessage={t.noQuotas}
              renderSkeleton={renderSkeletons}
              layout="edge-to-edge"
              paginationOptions={buildServerPaginationOptions({
                page,
                pageSize,
                totalCount,
                onPageChange: (newPage: number) => setPage(newPage),
              })}
            />
          )}
        </MobileContentStack>

        <MobileFab icon={<AddOutlined />} label={t.newQuota} onClick={() => router.push("/quotas/new")} />
      </div>
    </Fade>
  );
}
