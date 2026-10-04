import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  buildPackagePlansMetricItems as buildPackagePlansMetricItemsShared,
  getTopPricedActiveRow as getTopPricedActiveRowShared,
  type PackagePlansMetricArgs,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/packagePlansMetricItemsShared";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";

type PackagePlanRow = PackagePlansListViewModel["rows"][number];

export function getTopPricedActiveRow(rows: readonly PackagePlanRow[]): PackagePlanRow | null {
  return getTopPricedActiveRowShared(rows);
}

export function buildPackagePlansMetricItems(args: Readonly<PackagePlansMetricArgs>): MetricItem[] {
  return buildPackagePlansMetricItemsShared(args);
}
