import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import type {
  QuotaKind,
  QuotaPaginatedFilterInput,
  QuotaStatus,
  QuotasQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { deleteQuotaMutationDocument, quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useQuotaStore } from "@/frontend/common/stores/quotaStore";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { buildPaginationVars } from "@/frontend/common/views/dashboard/billing/quota/utils/buildPaginationVars";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

function removeQuotaFromListCache(quotaId: string): (data: QuotasQuery | null) => QuotasQuery | null {
  return cached => {
    if (!cached?.quotas?.rows) return cached;
    return {
      ...cached,
      quotas: {
        ...cached.quotas,
        rows: cached.quotas.rows.filter(row => row.id !== quotaId),
        totalCount: Math.max(0, (cached.quotas.totalCount ?? 0) - 1),
      },
    };
  };
}

export interface QuotaListViewModel {
  readonly t: QuotaLabels;
  readonly quotas: readonly QuotaItem[];
  readonly totalCount: number;
  readonly loading: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly filterStatus: QuotaStatus | null;
  readonly filterKind: QuotaKind | null;
  readonly searchQuery: string;
  readonly setFilterStatus: (status: QuotaStatus | null) => void;
  readonly setFilterKind: (kind: QuotaKind | null) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly handleDelete: (id: string) => Promise<void>;
}

export function useQuotaViewModel(): QuotaListViewModel {
  const t = useAppTranslation(DashboardBillingQuota);
  const filterStatus = useQuotaStore(s => s.filterStatus);
  const filterKind = useQuotaStore(s => s.filterKind);
  const searchQuery = useQuotaStore(s => s.searchQuery);
  const setFilterStatus = useQuotaStore(s => s.setFilterStatus);
  const setFilterKind = useQuotaStore(s => s.setFilterKind);
  const setSearchQuery = useQuotaStore(s => s.setSearchQuery);
  const page = useQuotaStore(s => s.page);
  const pageSize = useQuotaStore(s => s.pageSize);
  const setPage = useQuotaStore(s => s.setPage);
  const setPageSize = useQuotaStore(s => s.setPageSize);

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

  const { data, loading } = useQuery(quotasQueryDocument, {
    variables: {
      filter: (filter.kind ?? filter.search ?? filter.status ?? filter.studentId) != null ? filter : null,
      pagination: buildPaginationVars(page, pageSize),
    },
    fetchPolicy: "cache-and-network",
  });

  const [deleteQuotaMutation] = useMutation(deleteQuotaMutationDocument, {
    update: (cache, { data: mutationData }) => {
      const deleted = mutationData?.deleteQuota;
      if (!deleted?.id) return;
      cache.evict({ id: cache.identify({ __typename: "Quota", id: deleted.id }) });
      cache.updateQuery({ query: quotasQueryDocument }, removeQuotaFromListCache(deleted.id));
      cache.gc();
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
