"use client";

import { Card, CardContent, CardHeader, Grid, Typography, useTheme } from "@mui/material";
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

interface ChartCardProps {
  readonly title: string;
  readonly children: ReactElement;
  readonly gridSpan?: Record<string, number>;
}

function ChartCard({ title, children, gridSpan }: Readonly<ChartCardProps>): ReactElement {
  return (
    <Grid size={gridSpan ?? { xs: 12, md: 6, lg: 3 }}>
      <Card variant="outlined" aria-label={title}>
        <CardHeader title={title} />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {children}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Grid>
  );
}

const renderPurchasesCard: ChartCardRenderer = (title, children) => (
  <ChartCard title={title} gridSpan={{ xs: 12, lg: 6 }}>
    {children}
  </ChartCard>
);

const renderQuartileCard: ChartCardRenderer = (title, children) => (
  <ChartCard title={title} gridSpan={{ xs: 12, md: 6, lg: 3 }}>
    {children}
  </ChartCard>
);

function PendingBacklogGauge({ metrics, chartLabels, chartColors }: Readonly<GaugeComponentProps>): ReactElement {
  return (
    <Grid size={{ xs: 12, md: 6, lg: 3 }}>
      <Card variant="outlined" aria-label={chartLabels.pendingCreditBacklogGauge}>
        <CardHeader title={chartLabels.pendingCreditBacklogGauge} />
        <CardContent>
          <PendingBacklogGaugeContent
            metrics={metrics}
            chartLabels={chartLabels}
            chartColors={chartColors}
            height={300}
          />
          <Typography variant="h3" sx={{ textAlign: "center", fontWeight: 700, mt: -4 }}>
            {metrics.pendingBacklogCount}
          </Typography>
          <Typography variant="caption" sx={{ textAlign: "center", display: "block" }}>
            {chartLabels.pendingCredits}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

const renderSlippageCard: ChartCardRenderer = (title, children) => (
  <ChartCard title={title} gridSpan={{ xs: 12, lg: 9 }}>
    {children}
  </ChartCard>
);

export function QuotaInsightsChartsDesktop({
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
    <Grid container spacing={3}>
      <PurchasesOverTimeChartWrapper
        data={chartData.purchasesOverTime}
        chartLabels={chartLabels}
        chartColors={chartColors}
        showClassesArea
        renderCard={renderPurchasesCard}
      />
      <RedemptionByTypeChartWrapper
        data={chartData.redemptionByType}
        chartLabels={chartLabels}
        chartColors={chartColors}
        innerRadius={60}
        outerRadius={100}
        renderCard={renderQuartileCard}
      />
      <DeliveryRateChartWrapper
        data={chartData.deliveryRate}
        chartLabels={chartLabels}
        chartColors={chartColors}
        renderCard={renderQuartileCard}
      />
      <PendingBacklogGauge metrics={metrics} chartLabels={chartLabels} chartColors={chartColors} />
      <ExpiredSlippageChartWrapper
        data={chartData.expiredSlippage}
        chartLabels={chartLabels}
        chartColors={chartColors}
        renderCard={renderSlippageCard}
      />
    </Grid>
  );
}
