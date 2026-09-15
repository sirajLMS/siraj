"use client";

import { type SvgIconComponent, WarningAmberOutlined } from "@mui/icons-material";
import { Alert, Box, Stack, Typography } from "@mui/material";
import type { ReactElement } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge";
import { BaseCard } from "@/frontend/common/components/ui/card";
import { EmptyState, LoadingState } from "@/frontend/common/components/ui/state";
import type { StudentQuotasQuery_studentQuotas } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  getExpiryWarningThreshold,
  isExpiringSoon,
  isQuotaExhausted,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceHelpers";
import { getQuotaStatusLabel } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceStatus.utils";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

type QuotaRow = StudentQuotasQuery_studentQuotas;

export interface QuotaBalanceCardProps {
  readonly quota: QuotaRow;
  readonly t: StudentQuotaLabels;
  readonly showName?: boolean;
}

function formatDate(dateStr: string | null | undefined): string {
  if (dateStr == null || dateStr.length === 0) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export function QuotaBalanceCard({ quota, t, showName = true }: Readonly<QuotaBalanceCardProps>): ReactElement {
  const remaining = quota.remaining ?? 0;
  const total = quota.totalClasses ?? 0;
  const exhausted = isQuotaExhausted(quota.remaining);
  const expiring = isExpiringSoon(quota.validUntil);

  return (
    <BaseCard sx={showName ? undefined : { boxShadow: "none" }}>
      <Stack sx={{ gap: 1.5 }}>
        {showName && quota.name != null ? <Typography variant="titleLg">{quota.name}</Typography> : null}
        <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="labelMd">{t.audience.remainingCredits}</Typography>
          <Typography variant="headlineLg" sx={{ fontWeight: 700 }}>
            {t.audience.remainingOfTotal(remaining, total)}
          </Typography>
        </Stack>
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
          <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t.audience.status}:
          </Typography>
          <StatusBadge
            category="quotaStatus"
            status={quota.status ?? ""}
            label={getQuotaStatusLabel(quota.status, t)}
            size="small"
            component="output"
          />
        </Stack>
        <Stack sx={{ flexDirection: "row", gap: 2, flexWrap: "wrap" }}>
          {quota.validFrom != null ? (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.audience.validFrom}: {formatDate(quota.validFrom)}
            </Typography>
          ) : null}
          {quota.validUntil != null ? (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.audience.validUntil}: {formatDate(quota.validUntil)}
            </Typography>
          ) : null}
        </Stack>
        {exhausted ? (
          <Alert severity="error" icon={false}>
            <Typography>{t.audience.quotaExhausted}</Typography>
          </Alert>
        ) : null}
        {expiring && !exhausted ? (
          <Alert severity="warning" icon={<WarningAmberOutlined />}>
            <Typography>{t.audience.expiryWarning(getExpiryWarningThreshold())}</Typography>
          </Alert>
        ) : null}
      </Stack>
    </BaseCard>
  );
}

export interface QuotaEmptyStateProps {
  readonly message: string;
  readonly icon?: SvgIconComponent;
}

export function QuotaEmptyState({ message, icon: Icon }: Readonly<QuotaEmptyStateProps>): ReactElement {
  return <EmptyState title={message} icon={Icon ? <Icon /> : undefined} />;
}

export function QuotaLoadingSkeleton({ t }: Readonly<{ t: StudentQuotaLabels }>): ReactElement {
  return (
    <Box component="output" aria-busy="true">
      <LoadingState message={t.audience.loadingData} embedded />
    </Box>
  );
}
