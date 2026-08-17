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
import {
  type ChartLabels,
  type GaugeComponentProps,
  monthAxisKey,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/quotaInsightsChartsShared.types";
import {
  type ChartColors,
  makeBarShape,
  makeDonutShape,
  makeGaugeShape,
} from "@/frontend/common/views/dashboard/billing/quota/utils";

export function ChartAxisGrid(): ReactElement {
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

export function PurchasesOverTimeAreas({
  chartLabels,
  chartColors,
  showClassesArea,
}: {
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
  readonly showClassesArea: boolean;
}): ReactElement {
  return (
    <>
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
      {showClassesArea ? (
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
      ) : null}
    </>
  );
}

export function ExpiredSlippageLines({
  chartLabels,
  chartColors,
}: {
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
}): ReactElement {
  return (
    <>
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
    </>
  );
}

export function PurchasesOverTimeChartContent({
  data,
  chartLabels,
  chartColors,
  showClassesArea,
}: {
  readonly data: readonly Record<string, unknown>[];
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
  readonly showClassesArea: boolean;
}): ReactElement {
  return (
    <AreaChart data={data}>
      <ChartAxisGrid />
      <PurchasesOverTimeAreas chartLabels={chartLabels} chartColors={chartColors} showClassesArea={showClassesArea} />
    </AreaChart>
  );
}

export function ExpiredSlippageChartContent({
  data,
  chartLabels,
  chartColors,
}: {
  readonly data: readonly Record<string, unknown>[];
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
}): ReactElement {
  return (
    <LineChart data={data}>
      <ChartAxisGrid />
      <ExpiredSlippageLines chartLabels={chartLabels} chartColors={chartColors} />
    </LineChart>
  );
}

export type ChartCardRenderer = (title: string, children: ReactElement) => ReactElement;

export function PurchasesOverTimeChartWrapper({
  data,
  chartLabels,
  chartColors,
  showClassesArea,
  renderCard,
}: {
  readonly data: readonly Record<string, unknown>[];
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
  readonly showClassesArea: boolean;
  readonly renderCard: ChartCardRenderer;
}): ReactElement {
  return renderCard(
    chartLabels.quotaPurchasesOverTime,
    <PurchasesOverTimeChartContent
      data={data}
      chartLabels={chartLabels}
      chartColors={chartColors}
      showClassesArea={showClassesArea}
    />
  );
}

export function ExpiredSlippageChartWrapper({
  data,
  chartLabels,
  chartColors,
  renderCard,
}: {
  readonly data: readonly Record<string, unknown>[];
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
  readonly renderCard: ChartCardRenderer;
}): ReactElement {
  return renderCard(
    chartLabels.expiredSlippage,
    <ExpiredSlippageChartContent data={data} chartLabels={chartLabels} chartColors={chartColors} />
  );
}

/**
 * Shared PieChart gauge element for pending backlog. Both desktop and mobile
 * render the same Pie structure; they differ only in `height` and outer card
 * wrapping (handled by the caller).
 */
export function PendingBacklogGaugeContent({
  metrics,
  chartLabels,
  chartColors,
  height,
}: Readonly<GaugeComponentProps & { readonly height: number }>): ReactElement {
  const gaugeShape = makeGaugeShape(chartColors);
  return (
    <ResponsiveContainer width="100%" height={height}>
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
  );
}

export function RedemptionByTypeChartWrapper({
  data,
  chartLabels,
  chartColors,
  innerRadius,
  outerRadius,
  renderCard,
}: {
  readonly data: readonly Record<string, unknown>[];
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly renderCard: ChartCardRenderer;
}): ReactElement {
  const donutShape = makeDonutShape(chartColors);
  return renderCard(
    chartLabels.redemptionRateByType,
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={innerRadius}
        outerRadius={outerRadius}
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
  );
}

export function DeliveryRateChartWrapper({
  data,
  chartLabels,
  chartColors,
  renderCard,
}: {
  readonly data: readonly Record<string, unknown>[];
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
  readonly renderCard: ChartCardRenderer;
}): ReactElement {
  const barShape = makeBarShape(chartColors);
  return renderCard(
    chartLabels.packageDeliveryRate,
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" name={chartLabels.deliveryRate} shape={barShape} isAnimationActive animationDuration={500} />
    </BarChart>
  );
}
