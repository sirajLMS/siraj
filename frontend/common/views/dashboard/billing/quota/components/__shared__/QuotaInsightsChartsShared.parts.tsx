import type { ReactElement } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import {
  type ChartLabels,
  monthAxisKey,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/quotaInsightsChartsShared.types";
import type { ChartColors } from "@/frontend/common/views/dashboard/billing/quota/utils";

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

function PurchasesOverTimeAreas({
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

function ExpiredSlippageLines({
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
