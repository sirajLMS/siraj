import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import type { MetricItem } from "@/frontend/common/types/shared.types";
import { PerformanceOverviewCard } from "@/frontend/common/views/dashboard/classes/details/teacher/PerformanceOverviewCard";
import { buildPerformanceOverviewMetrics } from "@/frontend/common/views/dashboard/classes/details/teacher/performanceOverviewMetrics";
import type { ClassDetailsMetricGridSlotProps } from "@/frontend/common/views/dashboard/classes/details/types";
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
  previousPerformanceOverview: t.performance.previousPerformanceOverview,
  attendanceRate: t.performance.attendanceRate,
  avgGrade: t.performance.avgGrade,
  lastClass: t.performance.lastClass,
  days: t.performance.days,
  noData: t.performance.noData,
};

function makeCapturingGrid(captured: MetricItem[][]) {
  return function CapturingMetricGrid({ metrics }: ClassDetailsMetricGridSlotProps) {
    captured.push([...metrics]);
    return (
      <div data-testid="performance-metric-grid">
        {metrics.map(m => (
          <div key={m.key} data-metric-key={m.key}>
            <span>{m.label}</span>
            <span>{m.count}</span>
          </div>
        ))}
      </div>
    );
  };
}

describe("PerformanceOverviewCard", () => {
  test("builds MetricItem[] with translated labels and formatted values", () => {
    const items = buildPerformanceOverviewMetrics({
      attendanceRate: 85,
      avgGrade: "A",
      lastClassDaysAgo: 3,
      labels,
    });

    expect(items).toHaveLength(3);
    expect(items.map(i => i.key)).toEqual(["attendanceRate", "avgGrade", "lastClass"]);
    expect(items.map(i => i.label)).toEqual([labels.attendanceRate, labels.avgGrade, labels.lastClass]);
    expect(items[0]?.count).toBe("85%");
    expect(items[1]?.count).toBe("A");
    expect(items[2]?.count).toBe(`3 ${labels.days}`);
    expect(items.every(i => typeof i.icon === "function" || typeof i.icon === "object")).toBe(true);
  });

  test("renders the injected metric grid with MetricItem[] when data exists", () => {
    const captured: MetricItem[][] = [];
    renderWithWrapper(
      <PerformanceOverviewCard
        attendanceRate={85}
        avgGrade="A"
        lastClassDaysAgo={3}
        hasData={true}
        labels={labels}
        MetricGrid={makeCapturingGrid(captured)}
      />,
      { locale }
    );

    expect(screen.getByText(labels.previousPerformanceOverview)).toBeInTheDocument();
    expect(screen.getByTestId("performance-metric-grid")).toBeInTheDocument();
    expect(captured.at(-1)?.map(m => m.key)).toEqual(["attendanceRate", "avgGrade", "lastClass"]);
    expect(screen.getByText(labels.attendanceRate)).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.queryByText(labels.noData)).toBeNull();
  });

  test("renders no-data message and skips the grid when hasData is false", () => {
    const captured: MetricItem[][] = [];
    renderWithWrapper(
      <PerformanceOverviewCard
        attendanceRate={0}
        avgGrade="—"
        lastClassDaysAgo={0}
        hasData={false}
        labels={labels}
        MetricGrid={makeCapturingGrid(captured)}
      />,
      { locale }
    );

    expect(screen.getByText(labels.noData)).toBeInTheDocument();
    expect(screen.queryByTestId("performance-metric-grid")).toBeNull();
    expect(captured).toHaveLength(0);
  });
});
