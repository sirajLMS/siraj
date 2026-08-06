import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type { QuotaPaginatedFilterInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { deleteQuotaMutationDocument, quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useQuotaStore } from "@/frontend/common/stores/quotaStore";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { buildPaginationVars } from "@/frontend/common/views/dashboard/billing/quota/utils/buildPaginationVars";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";

export function useQuotaViewModel() {
  const t = useAppTranslation(DashboardBillingQuota);
  const filterStatus = useQuotaStore(s => s.filterStatus);
  const filterKind = useQuotaStore(s => s.filterKind);
  const searchQuery = useQuotaStore(s => s.searchQuery);
  const setFilterStatus = useQuotaStore(s => s.setFilterStatus);
  const setFilterKind = useQuotaStore(s => s.setFilterKind);
  const setSearchQuery = useQuotaStore(s => s.setSearchQuery);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filter = useMemo<QuotaPaginatedFilterInput>(() => {
    const f: QuotaPaginatedFilterInput = {
      kind: null,
      search: null,
      status: null,
      studentId: null,
    };
    if (filterStatus) f.status = filterStatus;
    if (filterKind) f.kind = filterKind;
    if (searchQuery.trim()) f.search = searchQuery.trim();
    return f;
  }, [filterStatus, filterKind, searchQuery]);

  const { data, loading, refetch } = useQuery(quotasQueryDocument, {
    variables: {
      filter: (filter.kind ?? filter.search ?? filter.status ?? filter.studentId) != null ? filter : null,
      pagination: buildPaginationVars(page, pageSize),
    },
    fetchPolicy: "cache-and-network",
  });

  const [deleteQuotaMutation] = useMutation(deleteQuotaMutationDocument, {
    onCompleted: () => {
      refetch();
    },
  });

  const quotas: QuotaItem[] = useMemo(() => {
    if (!data?.quotas?.rows) return [];
    return data.quotas.rows;
  }, [data]);

  const totalCount = data?.quotas?.totalCount ?? 0;

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteQuotaMutation({ variables: { id } });
    },
    [deleteQuotaMutation]
  );

  return {
    t,
    quotas,
    totalCount,
    loading,
    page,
    pageSize,
    setPage,
    setPageSize,
    filterStatus,
    filterKind,
    searchQuery,
    setFilterStatus,
    setFilterKind,
    setSearchQuery,
    handleDelete,
  };
}
