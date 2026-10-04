import type { AdminViewProps } from "@/frontend/common/views/dashboard/classes/details/types";

export interface LivePerformanceMetricRow {
  readonly key: string;
  readonly labelKey: string;
  readonly value: string;
}

// HeatmapData is typed as JSON[] on the GraphQL side; ActivityHeatmap expects number[].
export const coerceHeatmapData = (value: ReadonlyArray<unknown> | null | undefined): readonly number[] => {
  if (!value) return [];
  return value.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
};

export const buildLivePerformanceMetrics = (
  instance: AdminViewProps["instance"]
): { readonly metrics: readonly LivePerformanceMetricRow[]; readonly hasData: boolean } => {
  const perf = instance.performance;
  if (!perf) {
    return { metrics: [], hasData: false };
  }
  const metrics: readonly LivePerformanceMetricRow[] = [
    { key: "engagement", labelKey: "engagementScore", value: String(perf.engagementScore ?? "—") },
    { key: "assessment", labelKey: "assessmentProgress", value: String(perf.assessmentProgress ?? "—") },
    { key: "focus", labelKey: "focusLevel", value: perf.focusLevel ?? "—" },
    { key: "health", labelKey: "sessionHealth", value: perf.sessionHealth ?? "—" },
  ];
  const hasData = metrics.some(m => m.value !== "—");
  return { metrics, hasData };
};
