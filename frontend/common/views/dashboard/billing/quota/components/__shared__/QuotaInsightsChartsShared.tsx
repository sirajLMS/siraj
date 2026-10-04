import type { ReactElement } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import {
  ExpiredSlippageChartContent,
  PurchasesOverTimeChartContent,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaInsightsChartsShared.parts";
import type { ChartLabels } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/quotaInsightsChartsShared.types";
import { type ChartColors, makeBarShape, makeDonutShape } from "@/frontend/common/views/dashboard/billing/quota/utils";

export { PendingBacklogGaugeContent } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaInsightsChartsShared.gauge";

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
