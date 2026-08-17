"use client";

import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import {
  formatQuotaDate,
  formatQuotaKind,
  formatQuotaPeriodType,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaFormatters";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card/MobileCardListItem";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

interface QuotaDetailSummaryMobileProps {
  readonly quota: QuotaItem;
  readonly t: QuotaLabels;
}

interface SummaryRowProps {
  readonly label: string;
  readonly children: ReactNode;
}

function SummaryRow({ label, children }: Readonly<SummaryRowProps>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "end" }}>
          {children}
        </Typography>
      </Stack>
    </MobileCardListItem>
  );
}

const statusLabelMap: Record<string, (t: QuotaLabels) => string> = {
  ACTIVE: t => t.statuses.ACTIVE,
  EXPIRED: t => t.statuses.EXPIRED,
  ARCHIVED: t => t.statuses.ARCHIVED,
  PENDING: t => t.statuses.PENDING,
};

export function QuotaDetailSummaryMobile({ quota, t }: Readonly<QuotaDetailSummaryMobileProps>) {
  const statusResolver = statusLabelMap[quota.status ?? ""];
  const statusLabel = statusResolver ? statusResolver(t) : (quota.status ?? "—");

  return (
    <>
      <SummaryRow label={t.fields.name}>{quota.name ?? "—"}</SummaryRow>
      <SummaryRow label={t.fields.kind}>{formatQuotaKind(quota.kind ?? "", t)}</SummaryRow>
      <SummaryRow label={t.fields.periodType}>{formatQuotaPeriodType(quota.periodType ?? "", t)}</SummaryRow>
      <SummaryRow label={t.fields.periodDays}>{quota.periodDays ?? "—"}</SummaryRow>
      <SummaryRow label={t.fields.validFrom}>{formatQuotaDate(quota.validFrom)}</SummaryRow>
      <SummaryRow label={t.fields.validUntil}>{formatQuotaDate(quota.validUntil)}</SummaryRow>
      <SummaryRow label={t.fields.totalClasses}>{quota.totalClasses ?? "—"}</SummaryRow>
      <SummaryRow label={t.fields.remaining}>{quota.remaining ?? "—"}</SummaryRow>
      <SummaryRow label={t.fields.reservedClasses}>{quota.reservedClasses ?? "—"}</SummaryRow>
      <SummaryRow label={t.fields.priority}>{quota.priority ?? "—"}</SummaryRow>
      <MobileCardListItem variant="edge-to-edge">
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t.fields.status}
          </Typography>
          <MobileStatusBadge
            category="quotaStatus"
            status={quota.status ?? ""}
            label={statusLabel}
            size="small"
            component="output"
          />
        </Stack>
      </MobileCardListItem>
    </>
  );
}
