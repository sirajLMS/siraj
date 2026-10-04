import { ArchiveOutlined, CheckCircleOutlined, InventoryOutlined, TrendingUpOutlined } from "@mui/icons-material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

type PackagePlanRow = PackagePlansListViewModel["rows"][number];

export interface PackagePlansMetricArgs {
  readonly t: PackagePlansLabels;
  readonly rows: readonly PackagePlanRow[];
  readonly activeCount: number;
  readonly archivedCount: number;
  readonly priceLeader: PackagePlanRow | null;
}

/** Highest-priced active plan, or null when the catalog has no active plans. */
export function getTopPricedActiveRow(rows: readonly PackagePlanRow[]): PackagePlanRow | null {
  const active = rows.filter(row => row.active);
  if (active.length === 0) return null;
  return active.reduce((top, row) => (Number(row.priceAmount) > Number(top.priceAmount) ? row : top), active[0]);
}

/** Builds the catalog summary metric cards (totals, counts, price leader). */
export function buildPackagePlansMetricItems({
  t,
  rows,
  activeCount,
  archivedCount,
  priceLeader,
}: Readonly<PackagePlansMetricArgs>): MetricItem[] {
  return [
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
  ];
}
