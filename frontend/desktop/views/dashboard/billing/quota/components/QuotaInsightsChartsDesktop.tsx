"use client";

import { Card, CardContent, CardHeader, Grid, Typography, useTheme } from "@mui/material";
import type { ReactElement } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { QuotaInsightsViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";
import {
  type ChartColors,
  makeBarShape,
  makeDonutShape,
  makeGaugeShape,
} from "@/frontend/common/views/dashboard/billing/quota/utils";

function getChartColors(palette: {
  primary: { main: string; light: string };
  success: { main: string; light: string };
  warning: { main: string };
  error: { main: string };
}): ChartColors {
  return {
    primary: palette.primary.main,
    primaryLight: palette.primary.light,
    success: palette.success.main,
    successLight: palette.success.light,
    warning: palette.warning.main,
    error: palette.error.main,
    donutColors: [palette.primary.main, palette.success.main, palette.warning.main],
    barColors: [palette.success.main, palette.error.main],
  };
}

type ChartLabels = QuotaInsightsViewModel["labels"]["charts"];

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

interface ChartComponentProps<TData> {
  readonly data: TData;
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
}

interface GaugeComponentProps {
  readonly metrics: QuotaInsightsViewModel["metrics"];
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
}

const monthAxisKey = "month";

function ChartAxisGrid(): ReactElement {
  return (
    <>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={monthAxisKey} />
      <YAxis />
      <Tooltip />
      <Legend />
    </>
  );
}

function PurchasesOverTimeChart({
  data,
  chartLabels,
  chartColors,
}: Readonly<ChartComponentProps<QuotaInsightsViewModel["chartData"]["purchasesOverTime"]>>): ReactElement {
  return (
    <ChartCard title={chartLabels.quotaPurchasesOverTime} gridSpan={{ xs: 12, lg: 6 }}>
      <AreaChart data={data}>
        <ChartAxisGrid />
        <Area
          type="monotone"
          dataKey="purchases"
          name={chartLabels.months}
          fill={chartColors.primaryLight}
          stroke={chartColors.primary}
          fillOpacity={0.3}
          isAnimationActive
          animationDuration={500}
        />
        <Area
          type="monotone"
          dataKey="classes"
          name={chartLabels.classes}
          fill={chartColors.successLight}
          stroke={chartColors.success}
          fillOpacity={0.3}
          isAnimationActive
          animationDuration={500}
        />
      </AreaChart>
    </ChartCard>
  );
}

function RedemptionByTypeChart({
  data,
  chartLabels,
  chartColors,
}: Readonly<ChartComponentProps<QuotaInsightsViewModel["chartData"]["redemptionByType"]>>): ReactElement {
  const donutShape = makeDonutShape(chartColors);
  return (
    <ChartCard title={chartLabels.redemptionRateByType} gridSpan={{ xs: 12, md: 6, lg: 3 }}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => {
            const pctNum = typeof percent === "number" ? Math.round(percent * 100) : 0;
            return `${name} ${pctNum}%`;
          }}
          shape={donutShape}
          isAnimationActive
          animationDuration={500}
        />
        <Tooltip />
      </PieChart>
    </ChartCard>
  );
}

function DeliveryRateChart({
  data,
  chartLabels,
  chartColors,
}: Readonly<ChartComponentProps<QuotaInsightsViewModel["chartData"]["deliveryRate"]>>): ReactElement {
  const barShape = makeBarShape(chartColors);
  return (
    <ChartCard title={chartLabels.packageDeliveryRate} gridSpan={{ xs: 12, md: 6, lg: 3 }}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar
          dataKey="count"
          name={chartLabels.deliveryRate}
          shape={barShape}
          isAnimationActive
          animationDuration={500}
        />
      </BarChart>
    </ChartCard>
  );
}

function PendingBacklogGauge({ metrics, chartLabels, chartColors }: Readonly<GaugeComponentProps>): ReactElement {
  const gaugeShape = makeGaugeShape(chartColors);
  return (
    <Grid size={{ xs: 12, md: 6, lg: 3 }}>
      <Card variant="outlined" aria-label={chartLabels.pendingCreditBacklogGauge}>
        <CardHeader title={chartLabels.pendingCreditBacklogGauge} />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: chartLabels.pendingCredits, value: metrics.pendingBacklogCount },
                  { name: "", value: Math.max(50 - metrics.pendingBacklogCount, 0) },
                ]}
                cx="50%"
                cy="80%"
                startAngle={180}
                endAngle={0}
                innerRadius="90%"
                outerRadius="100%"
                dataKey="value"
                shape={gaugeShape}
                isAnimationActive
                animationDuration={500}
              />
            </PieChart>
          </ResponsiveContainer>
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

function ExpiredSlippageChart({
  data,
  chartLabels,
  chartColors,
}: Readonly<ChartComponentProps<QuotaInsightsViewModel["chartData"]["expiredSlippage"]>>): ReactElement {
  return (
    <ChartCard title={chartLabels.expiredSlippage} gridSpan={{ xs: 12, lg: 9 }}>
      <LineChart data={data}>
        <ChartAxisGrid />
        <Line
          type="monotone"
          dataKey="cumulativeExpired"
          name={chartLabels.expiredClasses}
          stroke={chartColors.error}
          strokeWidth={2}
          isAnimationActive
          animationDuration={500}
        />
        <Line
          type="monotone"
          dataKey="cumulativeRedeemed"
          name={chartLabels.redeemedClasses}
          stroke={chartColors.success}
          strokeWidth={2}
          isAnimationActive
          animationDuration={500}
        />
      </LineChart>
    </ChartCard>
  );
}

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
      <PurchasesOverTimeChart data={chartData.purchasesOverTime} chartLabels={chartLabels} chartColors={chartColors} />
      <RedemptionByTypeChart data={chartData.redemptionByType} chartLabels={chartLabels} chartColors={chartColors} />
      <DeliveryRateChart data={chartData.deliveryRate} chartLabels={chartLabels} chartColors={chartColors} />
      <PendingBacklogGauge metrics={metrics} chartLabels={chartLabels} chartColors={chartColors} />
      <ExpiredSlippageChart data={chartData.expiredSlippage} chartLabels={chartLabels} chartColors={chartColors} />
    </Grid>
  );
}
