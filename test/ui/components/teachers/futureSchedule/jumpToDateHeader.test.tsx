import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  type JumpToDateHeaderCardComponent,
  type JumpToDateHeaderMetricsRenderer,
  JumpToDateHeaderShared,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/jumpToDateHeaderShared";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

expect.extend(matchers);

import { formatScheduleFilterDate } from "@/frontend/common/utils/scheduleFilterDate";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.TeacherFutureSchedule, locale);

const TestCard: JumpToDateHeaderCardComponent = ({ children }: Readonly<{ children?: ReactNode }>) => (
  <div data-testid="header-card">{children}</div>
);

const SELECTED_DATE = "2026-08-20";

function renderHeader(overrides?: {
  onDateChange?: (date: string) => void;
  renderMetricsGrid?: JumpToDateHeaderMetricsRenderer;
}) {
  return renderWithWrapper(
    <JumpToDateHeaderShared
      leaveQuotaUsed={3}
      leaveQuotaTotal={10}
      totalClasses={7}
      selectedDate={SELECTED_DATE}
      onDateChange={overrides?.onDateChange ?? (() => {})}
      labels={labels}
      CardComponent={TestCard}
      renderMetricsGrid={overrides?.renderMetricsGrid}
    />,
    { locale, viewport: "desktop" }
  );
}

afterEach(() => {
  cleanup();
});

describe("JumpToDateHeaderShared date navigation", () => {
  test("wires the shared DateNavigator chevrons to onDateChange", async () => {
    const onDateChange = mock((_: string) => {});
    const { container } = renderHeader({ onDateChange });
    const section = within(container);

    const previousDayButton = await section.findByRole("button", { name: labels.ariaLabels.previousDay });
    previousDayButton.click();
    expect(onDateChange).toHaveBeenCalledWith("2026-08-19");

    const nextDayButton = await section.findByRole("button", { name: labels.ariaLabels.nextDay });
    nextDayButton.click();
    expect(onDateChange).toHaveBeenCalledWith("2026-08-21");
  });

  test("today reset returns the current local date", async () => {
    const onDateChange = mock((_: string) => {});
    const { container } = renderHeader({ onDateChange });
    const section = within(container);

    const todayButton = await section.findByRole("button", { name: labels.today });
    todayButton.click();
    expect(onDateChange).toHaveBeenCalledWith(formatScheduleFilterDate(new Date()));
  });
});

describe("JumpToDateHeaderShared metrics", () => {
  test("maps quota and class totals onto tier metric grid items", async () => {
    let captured: readonly MetricItem[] = [];
    const renderMetricsGrid = mock(({ metrics }: { readonly metrics: readonly MetricItem[] }) => {
      captured = metrics;
      return <div data-testid="metric-grid" />;
    });
    const { container } = renderHeader({ renderMetricsGrid });

    expect(within(container).getByTestId("metric-grid")).toBeInTheDocument();
    expect(captured).toHaveLength(2);

    const [leaveQuota, totalClassesMetric] = captured;
    expect(leaveQuota?.key).toBe("leave-quota");
    expect(leaveQuota?.label).toBe(labels.leaveQuotaDesc(10));
    expect(leaveQuota?.count).toBe(labels.remaining(7, 10));

    expect(totalClassesMetric?.key).toBe("total-classes");
    expect(totalClassesMetric?.label).toBe(labels.totalClassesDesc(7));
    expect(totalClassesMetric?.count).toBe(`7 ${labels.totalClasses}`);
  });

  test("falls back to plain label/value rows when no metric grid is injected", async () => {
    const { container } = renderHeader();
    const section = within(container);

    expect(await section.findByText(labels.leaveQuotaDesc(10))).toBeVisible();
    expect(section.getByText(labels.remaining(7, 10))).toBeVisible();
    expect(section.getByText(labels.totalClassesDesc(7))).toBeVisible();
    expect(section.getByText(`7 ${labels.totalClasses}`)).toBeVisible();
  });
});
