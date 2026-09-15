"use client";

import {
  AddOutlined,
  ArchiveOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InventoryOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  MobileListCardSkeletons,
  MobileListEmptyNotice,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileFab,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

export function PackagePlansListMobile(props: Readonly<PackagePlansListViewModel>) {
  const { t, rows, loading, error, activeCount, archivedCount, canManagePackages } = props;
  const router = useRouter();

  const priceLeader = useMemo(() => {
    const active = rows.filter(row => row.active);
    if (active.length === 0) return null;
    return active.reduce((top, row) => (Number(row.priceAmount) > Number(top.priceAmount) ? row : top), active[0]);
  }, [rows]);

  const metricItems = useMemo<MetricItem[]>(
    () => [
      {
        key: "plans-total",
        count: rows.length,
        label: t.pageTitle,
        labelKey: "dashboard.accounting.package-plans.pageTitle",
        icon: InventoryOutlined,
      },
      {
        key: "plans-active",
        count: activeCount,
        label: t.columns.active,
        labelKey: "dashboard.accounting.package-plans.columns.active",
        icon: CheckCircleOutlined,
      },
      {
        key: "plans-archived",
        count: archivedCount,
        label: t.archived,
        labelKey: "dashboard.accounting.package-plans.archived",
        icon: ArchiveOutlined,
      },
      {
        key: "plans-price-leader",
        count: priceLeader ? `${formatAccountingMoney(priceLeader.priceAmount)} ${priceLeader.currency ?? ""}` : "—",
        label: priceLeader?.displayName ?? t.columns.price,
        labelKey: "dashboard.accounting.package-plans.columns.price",
        icon: TrendingUpOutlined,
        variant: "highlight",
      },
    ],
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
            const card = (
              <MobileCardListItem
                variant="rounded"
                dimmed={!row.active}
                dimmedOpacity={0.72}
                interactive={canManagePackages}
              >
                <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                    {row.displayName}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <StatusBadge
                      category="session"
                      status={row.active ? "active" : "cancelled"}
                      label={row.active ? t.columns.active : t.archived}
                    />
                    {canManagePackages ? (
                      <EditOutlined
                        fontSize="small"
                        sx={theme => ({ color: theme.palette.onSurfaceVariant })}
                        aria-hidden
                      />
                    ) : null}
                  </Stack>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ mt: 1, justifyContent: "space-between", alignItems: "baseline" }}
                >
                  <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
                    {`${formatAccountingMoney(row.priceAmount)} ${row.currency ?? ""}`}
                  </Typography>
                  <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {t.hoursUnit(Number(row.creditHours ?? 0).toFixed(0))}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ mt: 1, justifyContent: "space-between" }}>
                  <Typography
                    variant="labelSm"
                    sx={theme => ({ fontFamily: "monospace", color: theme.palette.text.secondary })}
                  >
                    {row.codename}
                  </Typography>
                  <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {`#${row.sortOrder ?? 0}`}
                  </Typography>
                </Stack>
              </MobileCardListItem>
            );
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
