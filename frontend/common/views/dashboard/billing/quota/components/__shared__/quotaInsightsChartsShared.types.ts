import type { QuotaInsightsViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";
import type { ChartColors } from "@/frontend/common/views/dashboard/billing/quota/utils";

export type ChartLabels = QuotaInsightsViewModel["labels"]["charts"];

export interface ChartComponentProps<TData> {
  readonly data: TData;
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
}

export interface GaugeComponentProps {
  readonly metrics: QuotaInsightsViewModel["metrics"];
  readonly chartLabels: ChartLabels;
  readonly chartColors: ChartColors;
}

export const monthAxisKey = "month";

export function getChartColors(palette: {
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
