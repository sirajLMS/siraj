import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type {
  PaginationArgs,
  QuotaKind,
  QuotaPaginatedFilterInput,
  QuotaStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { deleteQuotaMutationDocument, quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useQuotaStore } from "@/frontend/common/stores/quotaStore";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";

export function useQuotaViewModel() {
  const t = useAppTranslation(DashboardBillingQuota);
  const { filterStatus, filterKind, searchQuery, setFilterStatus, setFilterKind, setSearchQuery } = useQuotaStore();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filter = useMemo(() => {
    const f: { status?: QuotaStatus; kind?: QuotaKind; search?: string } = {};
    if (filterStatus) f.status = filterStatus;
    if (filterKind) f.kind = filterKind;
    if (searchQuery.trim()) f.search = searchQuery.trim();
    return f;
  }, [filterStatus, filterKind, searchQuery]);

  const { data, loading, refetch } = useQuery(quotasQueryDocument, {
    variables: {
      filter: Object.keys(filter).length > 0 ? (filter as unknown as QuotaPaginatedFilterInput) : null,
      pagination: {
        skip: page * pageSize,
        first: pageSize,
      } as unknown as PaginationArgs,
    },
    fetchPolicy: "cache-and-network",
  });

  const [deleteQuotaMutation, { loading: deleting }] = useMutation(deleteQuotaMutationDocument, {
    onCompleted: () => {
      refetch();
    },
  });

  const quotas: QuotaItem[] = useMemo(() => {
    if (!data?.quotas?.rows) return [];
    return data.quotas.rows as unknown as QuotaItem[];
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
    deleting,
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
    refetch,
  };
}
