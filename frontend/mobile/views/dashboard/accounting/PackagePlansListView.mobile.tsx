"use client";

import { AddOutlined } from "@mui/icons-material";
import { Stack } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  MobileListCardSkeletons,
  MobileListEmptyNotice,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";
import {
  MobileCardList,
  MobileFab,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import {
  buildPackagePlansMetricItems,
  getTopPricedActiveRow,
} from "@/frontend/mobile/views/dashboard/accounting/PackagePlansListView.mobile.helpers";
import { PackagePlanCard } from "@/frontend/mobile/views/dashboard/accounting/PackagePlansListView.mobile.parts";

export function PackagePlansListMobile(props: Readonly<PackagePlansListViewModel>) {
  const { t, rows, loading, error, activeCount, archivedCount, canManagePackages } = props;
  const router = useRouter();

  const priceLeader = useMemo(() => getTopPricedActiveRow(rows), [rows]);

  const metricItems = useMemo<MetricItem[]>(
    () => buildPackagePlansMetricItems({ t, rows, activeCount, archivedCount, priceLeader }),
    [t, rows, activeCount, archivedCount, priceLeader]
  );

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      {/* pb 11 (88px): FAB height (56) + breathing room — the shell only reserves the bottom-nav height, so the last card can still scroll fully above the fixed MobileFab. */}
      <Stack spacing={2} sx={{ pb: 11 }}>
        <MobileMetricCardGrid metrics={metricItems} stretchCells />

        <MobileCardList
          rows={rows}
          loading={loading}
          getKey={row => row.id ?? ""}
          paginationOptions={{ mode: "client" }}
          layout="rounded"
          renderItem={row => {
            const card = <PackagePlanCard row={row} labels={t} canManagePackages={canManagePackages} />;
            if (!canManagePackages) return card;
            return (
              <Link href={`/accounting/packages/${row.id}/edit`} style={{ textDecoration: "none" }}>
                {card}
              </Link>
            );
          }}
          renderSkeleton={() => <MobileListCardSkeletons height={110} />}
          renderEmptyState={() => {
            if (error) return <MobileListErrorNotice visible message={t.loadError} />;
            return <MobileListEmptyNotice visible message={t.empty} />;
          }}
        />
      </Stack>

      {canManagePackages ? (
        <MobileFab
          icon={<AddOutlined />}
          label={t.createPlan}
          onClick={() => router.push("/accounting/packages/new")}
        />
      ) : null}
    </MobilePageContainer>
  );
}
