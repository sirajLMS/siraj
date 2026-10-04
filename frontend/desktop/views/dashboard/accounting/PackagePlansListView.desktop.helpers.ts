import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  buildPackagePlansMetricItems as buildPackagePlansMetricItemsShared,
  getTopPricedActiveRow,
  type PackagePlansMetricArgs,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlansMetricItemsShared";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";

type PackagePlanRow = PackagePlansListViewModel["rows"][number];

/** Highest-priced active plan, or null when the catalog has no active plans. */
export function getPackagePlansPriceLeader(rows: readonly PackagePlanRow[]): PackagePlanRow | null {
  return getTopPricedActiveRow(rows);
}

/** Builds the catalog summary metric cards (totals, counts, price leader). */
export function buildPackagePlansMetricItems(args: Readonly<PackagePlansMetricArgs>): MetricItem[] {
  return buildPackagePlansMetricItemsShared(args);
}
