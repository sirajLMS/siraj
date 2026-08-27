import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import type { MetricItem } from "@/frontend/common/types/shared.types";
import { LivePerformanceGrid } from "@/frontend/common/views/dashboard/classes/details/admin/LivePerformanceGrid";
import { buildLivePerformanceMetricItems } from "@/frontend/common/views/dashboard/classes/details/admin/livePerformanceMetrics";
import type { ClassDetailsMetricGridSlotProps } from "@/frontend/common/views/dashboard/classes/details/types";
import type { PerformanceMetric } from "@/frontend/common/views/dashboard/types/dashboard";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.ClassDetails, locale);

const labels = {
  livePerformanceOverview: t.performance.livePerformanceOverview,
  last30Mins: t.performance.last30Mins,
  engagementScore: t.performance.engagementScore,
  assessmentProgress: t.performance.assessmentProgress,
  focusLevel: t.performance.focusLevel,
  sessionHealth: t.performance.sessionHealth,
  noData: t.performance.noData,
};

const metrics: readonly PerformanceMetric[] = [
  { key: "engagement", labelKey: "engagementScore", value: "92" },
  { key: "assessment", labelKey: "assessmentProgress", value: "3/5" },
  { key: "focus", labelKey: "focusLevel", value: "High" },
  { key: "health", labelKey: "sessionHealth", value: "Stable" },
];

function makeCapturingGrid(captured: MetricItem[][]) {
  return function CapturingMetricGrid({ metrics: items }: ClassDetailsMetricGridSlotProps) {
    captured.push([...items]);
    return (
      <div data-testid="live-metric-grid">
        {items.map(m => (
          <div key={m.key} data-metric-key={m.key}>
            <span>{m.label}</span>
            <span>{m.count}</span>
          </div>
        ))}
      </div>
    );
  };
}

describe("LivePerformanceGrid", () => {
  test("maps raw metrics to MetricItem[] with translated labels", () => {
    const items = buildLivePerformanceMetricItems(metrics, labels);

    expect(items).toHaveLength(4);
    expect(items.map(i => i.key)).toEqual(["engagement", "assessment", "focus", "health"]);
    expect(items.map(i => i.label)).toEqual([
      labels.engagementScore,
      labels.assessmentProgress,
      labels.focusLevel,
      labels.sessionHealth,
    ]);
    expect(items.map(i => i.count)).toEqual(["92", "3/5", "High", "Stable"]);
    expect(items.every(i => typeof i.icon === "function" || typeof i.icon === "object")).toBe(true);
  });

  test("renders the injected metric grid with MetricItem[] when data exists", () => {
    const captured: MetricItem[][] = [];
    renderWithWrapper(
      <LivePerformanceGrid metrics={metrics} hasData={true} labels={labels} MetricGrid={makeCapturingGrid(captured)} />,
      { locale }
    );

    expect(screen.getByText(labels.livePerformanceOverview)).toBeInTheDocument();
    expect(screen.getByText(labels.last30Mins)).toBeInTheDocument();
    expect(screen.getByTestId("live-metric-grid")).toBeInTheDocument();
    expect(captured.at(-1)?.map(m => m.key)).toEqual(["engagement", "assessment", "focus", "health"]);
    expect(screen.getByText(labels.sessionHealth)).toBeInTheDocument();
  });

  test("renders no-data message and skips the grid when hasData is false", () => {
    const emptyMetrics: readonly PerformanceMetric[] = [];
    const captured: MetricItem[][] = [];
    renderWithWrapper(
      <LivePerformanceGrid
        metrics={emptyMetrics}
        hasData={false}
        labels={labels}
        MetricGrid={makeCapturingGrid(captured)}
      />,
      { locale }
    );

    expect(screen.getByText(labels.noData)).toBeInTheDocument();
    expect(screen.queryByTestId("live-metric-grid")).toBeNull();
    expect(screen.queryByText(labels.last30Mins)).toBeNull();
    expect(captured).toHaveLength(0);
  });
});
