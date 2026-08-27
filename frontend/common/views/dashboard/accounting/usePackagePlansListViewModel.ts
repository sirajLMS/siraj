"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { packagePlansQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPackagePlans } from "@/shared/locale/namespaces";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

/** One row of the package plans catalog. */
export type PackagePlanRow = NonNullable<
  NonNullable<import("@/frontend/common/graphql/generated/gql/graphql").PackagePlansQuery["packagePlans"]>[number]
>;

export interface PackagePlansListViewModel {
  readonly t: PackagePlansLabels;
  readonly rows: readonly PackagePlanRow[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly activeCount: number;
  readonly archivedCount: number;
}

export function usePackagePlansListViewModel(): PackagePlansListViewModel {
  const t = useAppTranslation(DashboardAccountingPackagePlans);

  // Full catalog (active + archived) so admins can see and revive context;
  // the archive mutation keeps rows in place with active=false.
  const { data, loading, error } = useQuery(packagePlansQueryDocument, {
    variables: { activeOnly: null, paginationArgs: null },
    fetchPolicy: "cache-and-network",
  });

  const rows = useMemo<readonly PackagePlanRow[]>(() => data?.packagePlans ?? [], [data]);

  const counts = useMemo(() => {
    let activeCount = 0;
    for (const row of rows) {
      if (row.active) activeCount += 1;
    }
    return { activeCount, archivedCount: rows.length - activeCount };
  }, [rows]);

  return {
    t,
    rows,
    loading,
    error: Boolean(error),
    ...counts,
  };
}
