"use client";

import { useQuery } from "@apollo/client/react";
import { Avatar, Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { type ReactElement, useState } from "react";
import type { StudentQuotasQuery_studentQuotas_Quota } from "@/frontend/common/graphql/generated/gql/operations";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth";
import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { parentAssociatedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  QuotaBalanceCard,
  QuotaEmptyState,
  QuotaLoadingSkeleton,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import { getLedgerReasonLabel } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceStatus.utils";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface ParentQuotaViewProps {
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

interface ChildQuotaContentProps {
  readonly studentId: string;
  readonly t: StudentQuotaLabels;
}

function ChildQuotaContent({ studentId, t }: Readonly<ChildQuotaContentProps>): ReactElement {
  const { data: quotasData, loading: loadingQuotas } = useQuery(studentQuotasQueryDocument, {
    variables: { studentId },
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
        {ledgerEntries.length === 0 ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t.audience.noLedgerEntries}
          </Typography>
        ) : (
          <Stack sx={{ gap: 1 }}>
            {ledgerEntries.map(entry => (
              <Box
                key={entry.id ?? ""}
                sx={theme => ({ p: 1.5, border: 1, borderColor: theme.palette.divider, borderRadius: 1 })}
              >
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
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

export function ParentQuotaView({ t }: Readonly<ParentQuotaViewProps>): ReactElement {
  const user = useUserStore(s => s.user);
  const parentIdFromStore = user?.parentId ?? "";

  const { data: meData } = useQuery(meQueryDocument, { skip: parentIdFromStore !== "" });
  const parentId = parentIdFromStore || (meData?.me?.parentId ?? "");

  const { data: childrenData, loading: loadingChildren } = useQuery(parentAssociatedStudentsQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  const children = childrenData?.parentAssociatedStudents ?? [];
  const [selectedTab, setSelectedTab] = useState(0);

  if (!parentId) {
    logger.warn("ParentQuotaView: No parent ID available");
    return <QuotaEmptyState message={t.audience.selectChildPrompt} />;
  }

  if (loadingChildren) {
    return <QuotaLoadingSkeleton t={t} />;
  }

  if (children.length === 0) {
    return <QuotaEmptyState message={t.audience.noChildren} />;
  }

  const safeTabIndex = Math.min(selectedTab, children.length - 1);
  const selectedChild = children[safeTabIndex];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="titleLg">{t.audience.parentTitle}</Typography>
      <Tabs value={safeTabIndex} onChange={(_, v) => setSelectedTab(v)} variant="scrollable" scrollButtons="auto">
        {children.map(child => (
          <Tab
            key={child.id ?? ""}
            icon={child.avatarUrl != null ? <Avatar src={child.avatarUrl} sx={{ width: 28, height: 28 }} /> : undefined}
            iconPosition="start"
            label={child.name ?? t.common.notSet}
          />
        ))}
      </Tabs>
      {selectedChild?.id != null ? (
        <Stack sx={{ gap: 2 }}>
          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5 }}>
            {selectedChild.avatarUrl != null ? (
              <Avatar src={selectedChild.avatarUrl} sx={{ width: 48, height: 48 }} />
            ) : null}
            <Typography variant="titleLg">{selectedChild.name ?? t.common.notSet}</Typography>
          </Stack>
          <ChildQuotaContent studentId={selectedChild.id} t={t} />
        </Stack>
      ) : (
        <QuotaEmptyState message={t.audience.noChildren} />
      )}
    </Box>
  );
}
