"use client";

import { Grid, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import {
  formatQuotaDate,
  formatQuotaKind,
  formatQuotaPeriodType,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

interface QuotaDetailSummaryDesktopProps {
  readonly quota: QuotaItem;
  readonly t: QuotaLabels;
}

interface SummaryFieldProps {
  readonly label: string;
  readonly children: ReactNode;
}

function SummaryField({ label, children }: Readonly<SummaryFieldProps>) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {children}
      </Typography>
    </Grid>
  );
}

export function QuotaDetailSummaryDesktop({ quota, t }: Readonly<QuotaDetailSummaryDesktopProps>) {
  const statusLabel = formatQuotaStatusLabel(quota.status ?? "", t);

  return (
    <Grid container spacing={3}>
      <SummaryField label={t.fields.name}>{quota.name ?? "—"}</SummaryField>
      <SummaryField label={t.fields.kind}>{formatQuotaKind(quota.kind ?? "", t)}</SummaryField>
      <SummaryField label={t.fields.periodType}>{formatQuotaPeriodType(quota.periodType ?? "", t)}</SummaryField>
      <SummaryField label={t.fields.periodDays}>{quota.periodDays ?? "—"}</SummaryField>
      <SummaryField label={t.fields.validFrom}>{formatQuotaDate(quota.validFrom)}</SummaryField>
      <SummaryField label={t.fields.validUntil}>{formatQuotaDate(quota.validUntil)}</SummaryField>
      <SummaryField label={t.fields.totalClasses}>{quota.totalClasses ?? "—"}</SummaryField>
      <SummaryField label={t.fields.remaining}>{quota.remaining ?? "—"}</SummaryField>
      <SummaryField label={t.fields.reservedClasses}>{quota.reservedClasses ?? "—"}</SummaryField>
      <SummaryField label={t.fields.priority}>{quota.priority ?? "—"}</SummaryField>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
          {t.fields.status}
        </Typography>
        <DesktopStatusBadge
          category="quotaStatus"
          status={quota.status ?? ""}
          label={statusLabel}
          size="small"
          component="output"
        />
      </Grid>
    </Grid>
  );
}

const statusLabelMap: Record<string, (t: QuotaLabels) => string> = {
  ACTIVE: t => t.statuses.ACTIVE,
  EXPIRED: t => t.statuses.EXPIRED,
  ARCHIVED: t => t.statuses.ARCHIVED,
  PENDING: t => t.statuses.PENDING,
};

function formatQuotaStatusLabel(status: string, t: QuotaLabels): string {
  const resolver = statusLabelMap[status];
  return resolver ? resolver(t) : status;
}
