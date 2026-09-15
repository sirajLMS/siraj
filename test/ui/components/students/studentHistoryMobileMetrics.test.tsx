import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryViewModel";
import { StudentHistoryMobileView } from "@/frontend/mobile/views/dashboard/students/history/studentHistory.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.StudentHistory, locale);

const metrics: StudentHistoryMetrics = {
  totalClasses: 2,
  attendanceRate: 90,
  hoursStudied: 2,
  performance: 85,
};

function buildViewModel(): StudentHistoryViewModel {
  return {
    studentName: "Ahmed Student",
    currentMonth: new Date(2026, 6, 1),
    metrics,
    classes: {},
    selectedWeek: 1,
    selectedDay: null,
    embedded: false,
    onSelectWeek: () => {},
    onSelectDay: () => {},
    onPrevMonth: () => {},
    onNextMonth: () => {},
    onPrint: () => {},
    enrollmentMonth: undefined,
    nowMonth: undefined,
    locale,
    labels,
    loading: false,
  };
}

function renderHistoryMobileView() {
  return renderWithWrapper(<StudentHistoryMobileView {...buildViewModel()} />, {
    locale,
    viewport: "mobile",
    permissions: [AppPermission.StudentHistoryViewOther],
  });
}

describe("StudentHistoryMobileView metrics grid", () => {
  test("renders the four metrics through MobileMetricCardGrid", () => {
    const { container } = renderHistoryMobileView();

    // MetricCardIconWrap renders exactly one instance per metric card.
    expect(container.querySelectorAll(".metric-icon-wrap")).toHaveLength(4);

    expect(screen.getByText(labels.metrics.totalClasses(metrics.totalClasses))).toBeInTheDocument();
    expect(screen.getByText(labels.metrics.attendanceRate(metrics.attendanceRate))).toBeInTheDocument();
    expect(screen.getByText(labels.metrics.hoursStudied(metrics.hoursStudied))).toBeInTheDocument();
    expect(screen.getByText(labels.metrics.performance(metrics.performance))).toBeInTheDocument();

    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
  });
});
