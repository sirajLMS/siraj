"use client";

import { SuspensionAnalyticsScaffold } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared";
import type { SuspensionAnalyticsTierConfig } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.types";
import type { SuspensionAnalyticsProps } from "@/frontend/common/views/dashboard/classes/status/tracking/types";

const DESKTOP_TIER: SuspensionAnalyticsTierConfig = {
  chartPadding: 3,
  chartTitleFontFamily: '"Hanken Grotesk", sans-serif',
  chartHeight: 160,
  chartGap: 1,
  chartPx: 1,
  chartTitleMb: 2,
  chartDayLabelRowPx: 1,
  chartDayLabelRowMt: 1,
  chartDayLabelFontFamily: '"Inter", sans-serif',
  chartNoteMt: 2,
  chartBarHover: true,
  ctaPadding: 3,
  ctaMinHeight: 220,
  ctaGap: 0,
  topRightBlobSize: 200,
  bottomLeftBlobSize: 160,
  urgentBadgeMb: 2,
  ctaHeadlineFontFamily: '"Hanken Grotesk", sans-serif',
  ctaDescriptionMb: 3,
  ctaButtonFontFamily: '"Inter", sans-serif',
  ctaButtonPaddingInline: 3,
  ctaButtonId: "open-audit-logs-btn",
  outerContainerSx: {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
    gap: 3,
    mt: 3,
  },
};

export function SuspensionAnalytics({ labels, suspendedCount, onOpenAuditLogs }: Readonly<SuspensionAnalyticsProps>) {
  return (
    <SuspensionAnalyticsScaffold
      labels={labels}
      suspendedCount={suspendedCount}
      onOpenAuditLogs={onOpenAuditLogs}
      tier={DESKTOP_TIER}
    />
  );
}
