import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { quotaLedgerQueryDocument, quotaQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import type { QuotaItem, QuotaLedgerItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { buildPaginationVars } from "@/frontend/common/views/dashboard/billing/quota/utils/buildPaginationVars";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";

export function useQuotaDetailViewModel(quotaId: string) {
  const t = useAppTranslation(DashboardBillingQuota);
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
  const ledgerEntries: QuotaLedgerItem[] = useMemo(() => ledgerData?.quotaLedger?.rows ?? [], [ledgerData]);
  const ledgerTotalCount = ledgerData?.quotaLedger?.totalCount ?? 0;

  return {
    t,
    quota,
    loadingQuota,
    ledgerEntries,
    ledgerTotalCount,
    loadingLedger,
    ledgerPage,
    setLedgerPage,
    ledgerPageSize,
  };
}
