"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ReactElement } from "react";
import type { StudentQuotasQuery_studentQuotas_Quota } from "@/frontend/common/graphql/generated/gql/operations";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth";
import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  QuotaBalanceCard,
  QuotaEmptyState,
  QuotaLoadingSkeleton,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import { getLedgerReasonLabel } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceStatus.utils";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface StudentQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

function formatDate(dateStr: string | null | undefined): string {
  if (dateStr == null || dateStr.length === 0) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function formatDelta(delta: number | null): string {
  if (delta == null) return "";
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function LedgerEntries({
  entries,
  t,
}: Readonly<{
  entries: ReadonlyArray<{
    readonly id: string | null;
    readonly delta: number | null;
    readonly reason: string | null;
    readonly createdAt: string | null;
  }>;
  t: StudentQuotaLabels;
}>): ReactElement {
  if (entries.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {t.audience.noLedgerEntries}
      </Typography>
    );
  }
  return (
    <Stack sx={{ gap: 1 }}>
      {entries.map(entry => (
        <Paper key={entry.id ?? ""} variant="outlined" sx={{ p: 1.5 }}>
          <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Stack sx={{ gap: 0.5 }}>
              <Typography variant="labelSm">{getLedgerReasonLabel(entry.reason, t)}</Typography>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {formatDate(entry.createdAt)}
              </Typography>
            </Stack>
            <Typography
              variant="labelMd"
              sx={theme => ({
                fontWeight: 700,
                color: (entry.delta ?? 0) >= 0 ? theme.palette.success.main : theme.palette.error.main,
              })}
            >
              {formatDelta(entry.delta)}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

export function StudentQuotaAudienceView({ t }: Readonly<StudentQuotaViewProps>): ReactElement {
  const user = useUserStore(s => s.user);
  const studentId = user?.id ?? "";

  const { data: meData } = useQuery(meQueryDocument, { skip: studentId !== "" });
  const effectiveStudentId = studentId || (meData?.me?.id ?? "");

  const { data: quotasData, loading: loadingQuotas } = useQuery(studentQuotasQueryDocument, {
    variables: { studentId: effectiveStudentId },
    skip: !effectiveStudentId,
  });

  const quotas: StudentQuotasQuery_studentQuotas_Quota[] = quotasData?.studentQuotas ?? [];
  const firstQuota = quotas[0] ?? null;

  const { data: ledgerData } = useQuery(quotaLedgerQueryDocument, {
    variables: {
      quotaId: firstQuota?.id ?? "",
      pagination: { after: null, before: null, first: 5, last: null, maxCount: null, page: null, skip: 0 },
    },
    skip: !firstQuota?.id,
  });

  const ledgerEntries = ledgerData?.quotaLedger?.rows ?? [];

  if (!effectiveStudentId) {
    logger.warn("StudentQuotaAudienceView: No student ID available");
    return <QuotaEmptyState message={t.audience.noQuotaAssigned} />;
  }

  if (loadingQuotas) {
    return <QuotaLoadingSkeleton t={t} />;
  }

  if (quotas.length === 0) {
    return <QuotaEmptyState message={t.audience.noQuotaAssigned} />;
  }

  return (
    <Box component="output" aria-busy={loadingQuotas} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="titleLg">{t.audience.studentTitle}</Typography>
      <Stack sx={{ gap: 2 }}>
        {quotas.map(quota => (
          <QuotaBalanceCard key={quota.id ?? ""} quota={quota} t={t} />
        ))}
      </Stack>
      <Box>
        <Typography variant="titleLg" sx={{ mb: 1.5 }}>
          {t.audience.recentLedgerEntries}
        </Typography>
        <LedgerEntries entries={ledgerEntries} t={t} />
      </Box>
    </Box>
  );
}
