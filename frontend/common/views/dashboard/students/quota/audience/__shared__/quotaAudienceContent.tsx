"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Stack, Typography } from "@mui/material";
import type { ReactElement } from "react";
import type { StudentQuotasQuery_studentQuotas } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import {
  QuotaBalanceCard,
  QuotaEmptyState,
  QuotaLoadingSkeleton,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import { LedgerEntriesList } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceLedger";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export interface QuotaContentProps {
  readonly studentId: string;
  readonly t: StudentQuotaLabels;
}

/**
 * Shared component that queries a student's quotas + ledger and renders
 * balance cards + ledger entries. Used by both StudentQuotaView and
 * ParentQuotaView's ChildQuotaContent.
 */
export function QuotaAudienceContent({ studentId, t }: Readonly<QuotaContentProps>): ReactElement {
  const { data: quotasData, loading: loadingQuotas } = useQuery(studentQuotasQueryDocument, {
    variables: { studentId },
    skip: !studentId,
  });

  const quotas: StudentQuotasQuery_studentQuotas[] = quotasData?.studentQuotas ?? [];
  const firstQuota = quotas[0] ?? null;

  const { data: ledgerData } = useQuery(quotaLedgerQueryDocument, {
    variables: {
      quotaId: firstQuota?.id ?? "",
      pagination: { after: null, before: null, first: 5, last: null, maxCount: null, page: null, skip: 0 },
    },
    skip: !firstQuota?.id,
  });

  const ledgerEntries = ledgerData?.quotaLedger?.rows ?? [];

  if (loadingQuotas) {
    return <QuotaLoadingSkeleton t={t} />;
  }

  if (quotas.length === 0) {
    return <QuotaEmptyState message={t.audience.noQuotaAssigned} />;
  }

  return (
    <Stack sx={{ gap: 2 }}>
      {quotas.map(quota => (
        <QuotaBalanceCard key={quota.id ?? ""} quota={quota} t={t} />
      ))}
      <Box>
        <Typography variant="titleLg" sx={{ mb: 1.5 }}>
          {t.audience.recentLedgerEntries}
        </Typography>
        <LedgerEntriesList entries={ledgerEntries} t={t} />
      </Box>
    </Stack>
  );
}
