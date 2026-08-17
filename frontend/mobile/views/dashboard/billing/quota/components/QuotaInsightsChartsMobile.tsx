"use client";

import { Card, CardContent, CardHeader, Typography, useTheme } from "@mui/material";
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

interface MobileChartProps<TData> {
  readonly data: TData;
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
}

interface MobileGaugeProps {
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

function PurchasesOverTimeMobile({
  data,
  chartLabels,
  chartColors,
}: Readonly<MobileChartProps<QuotaInsightsViewModel["chartData"]["purchasesOverTime"]>>): ReactElement {
  return (
    <MobileChartCard title={chartLabels.quotaPurchasesOverTime} height={220}>
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
      </AreaChart>
    </MobileChartCard>
  );
}

function RedemptionByTypeMobile({
  data,
  chartLabels,
  chartColors,
}: Readonly<MobileChartProps<QuotaInsightsViewModel["chartData"]["redemptionByType"]>>): ReactElement {
  const donutShape = makeDonutShape(chartColors);
  return (
    <MobileChartCard title={chartLabels.redemptionRateByType} height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
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
    </MobileChartCard>
  );
}

function PendingBacklogGaugeMobile({ metrics, chartLabels, chartColors }: Readonly<MobileGaugeProps>): ReactElement {
  const gaugeShape = makeGaugeShape(chartColors);
  return (
    <Card variant="outlined" aria-label={chartLabels.pendingCreditBacklogGauge}>
      <CardHeader title={chartLabels.pendingCreditBacklogGauge} />
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
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

function ExpiredSlippageMobile({
  data,
  chartLabels,
  chartColors,
}: Readonly<MobileChartProps<QuotaInsightsViewModel["chartData"]["expiredSlippage"]>>): ReactElement {
  return (
    <MobileChartCard title={chartLabels.expiredSlippage} height={220}>
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
    </MobileChartCard>
  );
}

function DeliveryRateChartMobile({
  data,
  chartLabels,
  chartColors,
}: Readonly<MobileChartProps<QuotaInsightsViewModel["chartData"]["deliveryRate"]>>): ReactElement {
  const barShape = makeBarShape(chartColors);
  return (
    <MobileChartCard title={chartLabels.packageDeliveryRate} height={220}>
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
    </MobileChartCard>
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
      <PurchasesOverTimeMobile data={chartData.purchasesOverTime} chartLabels={chartLabels} chartColors={chartColors} />
      <RedemptionByTypeMobile data={chartData.redemptionByType} chartLabels={chartLabels} chartColors={chartColors} />
      <DeliveryRateChartMobile data={chartData.deliveryRate} chartLabels={chartLabels} chartColors={chartColors} />
      <PendingBacklogGaugeMobile metrics={metrics} chartLabels={chartLabels} chartColors={chartColors} />
      <ExpiredSlippageMobile data={chartData.expiredSlippage} chartLabels={chartLabels} chartColors={chartColors} />
    </>
  );
}
