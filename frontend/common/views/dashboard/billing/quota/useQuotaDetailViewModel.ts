import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { QuotasQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deleteQuotaMutationDocument,
  quotaLedgerQueryDocument,
  quotaQueryDocument,
  quotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import type { QuotaItem, QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { buildPaginationVars } from "@/frontend/common/views/dashboard/billing/quota/utils/buildPaginationVars";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

function updateQuotasCache(quotaId: string): (data: QuotasQuery | null) => QuotasQuery | null {
  return data => {
    if (!data?.quotas?.rows) return data;
    return {
      ...data,
      quotas: {
        ...data.quotas,
        rows: data.quotas.rows.filter(row => row.id !== quotaId),
        totalCount: Math.max(0, (data.quotas.totalCount ?? 0) - 1),
      },
    };
  };
}

function useQuotaDelete(quotaId: string, router: ReturnType<typeof useRouter>) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteErrorOpen, setDeleteErrorOpen] = useState(false);
  const [deleteQuota, { loading: deleting }] = useMutation(deleteQuotaMutationDocument);

  const onDeleteDialogOpen = useCallback(() => setDeleteDialogOpen(true), []);
  const onDeleteDialogClose = useCallback(() => setDeleteDialogOpen(false), []);
  const onDeleteErrorClose = useCallback(() => setDeleteErrorOpen(false), []);

  const onDeleteConfirm = useCallback(() => {
    void deleteQuota({
      variables: { id: quotaId },
      update: cache => {
        cache.evict({ id: cache.identify({ __typename: "Quota", id: quotaId }) });
        cache.updateQuery({ query: quotasQueryDocument }, updateQuotasCache(quotaId));
        cache.gc();
      },
    })
      .then(() => {
        setDeleteDialogOpen(false);
        router.push("/quotas");
        return undefined;
      })
      .catch(() => {
        setDeleteDialogOpen(false);
        setDeleteErrorOpen(true);
      });
  }, [deleteQuota, quotaId, router]);

  return {
    deleteDialogOpen,
    deleting,
    deleteErrorOpen,
    onDeleteDialogOpen,
    onDeleteDialogClose,
    onDeleteConfirm,
    onDeleteErrorClose,
  };
}

export interface QuotaDetailViewModel {
  readonly t: QuotaLabels;
  readonly quota: QuotaItem | null;
  readonly loadingQuota: boolean;
  readonly notFound: boolean;
  readonly ledgerEntries: readonly QuotaLedgerItem[];
  readonly ledgerTotalCount: number;
  readonly loadingLedger: boolean;
  readonly ledgerPage: number;
  readonly setLedgerPage: (page: number) => void;
  readonly ledgerPageSize: number;
  readonly deleteDialogOpen: boolean;
  readonly deleting: boolean;
  readonly onDeleteDialogOpen: () => void;
  readonly onDeleteDialogClose: () => void;
  readonly onDeleteConfirm: () => void;
  readonly deleteErrorOpen: boolean;
  readonly onDeleteErrorClose: () => void;
}

export function useQuotaDetailViewModel(quotaId: string) {
  const t = useAppTranslation(DashboardBillingQuota);
  const router = useRouter();
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerPageSize] = useState(10);

  const { data: quotaData, loading: loadingQuota } = useQuery(quotaQueryDocument, {
    variables: { id: quotaId },
    skip: !quotaId,
  });

  const { data: ledgerData, loading: loadingLedger } = useQuery(quotaLedgerQueryDocument, {
    variables: {
      quotaId,
      pagination: buildPaginationVars(ledgerPage, ledgerPageSize),
    },
    skip: !quotaId,
  });

  const quota: QuotaItem | null = useMemo(() => quotaData?.quota ?? null, [quotaData]);
  const notFound = !loadingQuota && !quota;
  const ledgerEntries: QuotaLedgerItem[] = useMemo(() => ledgerData?.quotaLedger?.rows ?? [], [ledgerData]);
  const ledgerTotalCount = ledgerData?.quotaLedger?.totalCount ?? 0;

  const deleteHandlers = useQuotaDelete(quotaId, router);

  return {
    t,
    quota,
    loadingQuota,
    notFound,
    ledgerEntries,
    ledgerTotalCount,
    loadingLedger,
    ledgerPage,
    setLedgerPage,
    ledgerPageSize,
    ...deleteHandlers,
  };
}
