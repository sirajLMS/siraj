"use client";

import { Card, CardContent, CardHeader, Typography, useTheme } from "@mui/material";
import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import {
  type ChartCardRenderer,
  DeliveryRateChartWrapper,
  ExpiredSlippageChartWrapper,
  PendingBacklogGaugeContent,
  PurchasesOverTimeChartWrapper,
  RedemptionByTypeChartWrapper,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaInsightsChartsShared";
import {
  type GaugeComponentProps,
  getChartColors,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/quotaInsightsChartsShared.types";
import type { QuotaInsightsViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";

interface MobileChartCardProps {
  readonly title: string;
  readonly height: number;
  readonly children: ReactElement;
}

function MobileChartCard({ title, height, children }: Readonly<MobileChartCardProps>): ReactElement {
  return (
    <Card variant="outlined" aria-label={title}>
      <CardHeader title={title} />
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const renderMobileCard: ChartCardRenderer = (title, children) => (
  <MobileChartCard title={title} height={220}>
    {children}
  </MobileChartCard>
);

function PendingBacklogGaugeMobile({ metrics, chartLabels, chartColors }: Readonly<GaugeComponentProps>): ReactElement {
  return (
    <Card variant="outlined" aria-label={chartLabels.pendingCreditBacklogGauge}>
      <CardHeader title={chartLabels.pendingCreditBacklogGauge} />
      <CardContent>
        <PendingBacklogGaugeContent
          metrics={metrics}
          chartLabels={chartLabels}
          chartColors={chartColors}
          height={200}
        />
        <Typography variant="h4" sx={{ textAlign: "center", fontWeight: 700, mt: -2 }}>
          {metrics.pendingBacklogCount}
        </Typography>
        <Typography variant="caption" sx={{ textAlign: "center", display: "block" }}>
          {chartLabels.pendingCredits}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function QuotaInsightsChartsMobile({
  chartData,
  metrics,
  labels,
}: Readonly<{
  chartData: QuotaInsightsViewModel["chartData"];
  metrics: QuotaInsightsViewModel["metrics"];
  labels: QuotaInsightsViewModel["labels"];
}>): ReactElement {
  const theme = useTheme();
  const chartColors = getChartColors(theme.palette);
  const chartLabels = labels.charts;

  return (
    <>
      <PurchasesOverTimeChartWrapper
        data={chartData.purchasesOverTime}
        chartLabels={chartLabels}
        chartColors={chartColors}
        showClassesArea={false}
        renderCard={renderMobileCard}
      />
      <RedemptionByTypeChartWrapper
        data={chartData.redemptionByType}
        chartLabels={chartLabels}
        chartColors={chartColors}
        innerRadius={50}
        outerRadius={80}
        renderCard={renderMobileCard}
      />
      <DeliveryRateChartWrapper
        data={chartData.deliveryRate}
        chartLabels={chartLabels}
        chartColors={chartColors}
        renderCard={renderMobileCard}
      />
      <PendingBacklogGaugeMobile metrics={metrics} chartLabels={chartLabels} chartColors={chartColors} />
      <ExpiredSlippageChartWrapper
        data={chartData.expiredSlippage}
        chartLabels={chartLabels}
        chartColors={chartColors}
        renderCard={renderMobileCard}
      />
    </>
  );
}
