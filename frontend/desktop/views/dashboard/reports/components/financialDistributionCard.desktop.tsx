"use client";

import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { FinancialDistributionCardContent } from "@/frontend/common/views/dashboard/reports/components/__shared__/FinancialDistributionCardShared";
import type { FinancialDistributionCardProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";

export function FinancialDistributionCardDesktop({
  currencyDistribution,
  title,
  subtitle,
}: Readonly<FinancialDistributionCardProps>) {
  return (
    <BaseCard>
      <FinancialDistributionCardContent
        currencyDistribution={currencyDistribution}
        title={title}
        subtitle={subtitle}
        barHeight={16}
        legendDirection="row"
        legendMt={2}
      />
    </BaseCard>
  );
}
