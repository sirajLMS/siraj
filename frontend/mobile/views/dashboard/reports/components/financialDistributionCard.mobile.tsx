"use client";

import { FinancialDistributionCardContent } from "@/frontend/common/views/dashboard/reports/components/__shared__/FinancialDistributionCardShared";
import type { FinancialDistributionCardProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

export function FinancialDistributionCardMobile({
  currencyDistribution,
  title,
  subtitle,
}: Readonly<FinancialDistributionCardProps>) {
  return (
    <MobileBaseCard sx={{ p: 2 }}>
      <FinancialDistributionCardContent
        currencyDistribution={currencyDistribution}
        title={title}
        subtitle={subtitle}
        barHeight={12}
        legendDirection="column"
        legendMt={1.5}
      />
    </MobileBaseCard>
  );
}
