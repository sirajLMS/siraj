"use client";

import { SuspensionAnalyticsScaffold } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared";
import type { SuspensionAnalyticsTierConfig } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.types";
import type { SuspensionAnalyticsProps } from "@/frontend/common/views/dashboard/classes/status/tracking/types";

const MOBILE_TIER: SuspensionAnalyticsTierConfig = {
  chartPadding: 2,
  chartTitleFontFamily: "", // uses theme.typography.fontFamily via inherit
  chartHeight: 120,
  chartGap: 0.75,
  chartPx: 0.5,
  chartTitleMb: 1.5,
  chartDayLabelRowPx: 0.5,
  chartDayLabelRowMt: 1,
  chartDayLabelFontFamily: "", // uses theme.typography.fontFamily via inherit
  chartNoteMt: 1.5,
  chartBarHover: false,
  ctaPadding: 2.5,
  ctaMinHeight: 180,
  ctaGap: 2,
  topRightBlobSize: 160,
  bottomLeftBlobSize: 120,
  urgentBadgeMb: 1.5,
  ctaHeadlineFontFamily: "", // uses theme.typography.fontFamily via inherit
  ctaDescriptionMb: 2,
  ctaButtonFontFamily: "", // uses theme.typography.fontFamily via inherit
  ctaButtonPaddingInline: 2.5,
  ctaButtonId: "open-audit-logs-btn-mobile",
  outerContainerSx: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
};

export function SuspensionAnalyticsMobile({
  labels,
  suspendedCount,
  onOpenAuditLogs,
}: Readonly<SuspensionAnalyticsProps>) {
  return (
    <SuspensionAnalyticsScaffold
      labels={labels}
      suspendedCount={suspendedCount}
      onOpenAuditLogs={onOpenAuditLogs}
      tier={MOBILE_TIER}
    />
  );
}
