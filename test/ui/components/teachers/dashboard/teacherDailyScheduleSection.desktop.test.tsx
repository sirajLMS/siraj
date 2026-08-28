import { afterEach, describe, expect, mock, test } from "bun:test";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "ar";
const teacherDashboardT = readTranslation(Translation.Dashboard.TeacherDashboard, locale);
const adminDashboardT = readTranslation(Translation.Dashboard.Admin, locale);
const meetingConfigT = readTranslation(Translation.Ui.MeetingConfig, locale);

// Stub the data grid: this suite asserts the section chrome (single panel
// shell + inset date navigator), not grid row content.
await mock.module(
  "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleDataGrid.desktop",
  () => ({
    TeacherScheduleDataGridDesktop: () => <div data-testid="teacher-schedule-grid" />,
  })
);

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, within } from "@testing-library/react";

expect.extend(matchers);

import type { TeacherDailyScheduleSectionProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { buildTeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardLabels";
import { TeacherDailyScheduleSectionDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherDailyScheduleSection.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const labels = buildTeacherDashboardLabels(teacherDashboardT, adminDashboardT, meetingConfigT.join.emptyTeacher);

function makeProps(overrides: Partial<TeacherDailyScheduleSectionProps> = {}): TeacherDailyScheduleSectionProps {
  return {
    title: labels.schedule.title,
    dateValue: "2026-08-27",
    todayLabel: labels.dateFilter.today,
    previousDayLabel: labels.dateFilter.previousDay,
    nextDayLabel: labels.dateFilter.nextDay,
    dateLabel: labels.dateFilter.dateLabel,
    onDateChange: mock(() => {}),
    rows: [],
    labels,
    instanceStatusLabels: labels.instanceStatusLabels,
    canActivate: false,
    loading: false,
    emptyMessage: labels.schedule.noEntries,
    ...overrides,
  };
}

function renderSection(overrides: Partial<TeacherDailyScheduleSectionProps> = {}) {
  return renderWithWrapper(<TeacherDailyScheduleSectionDesktop {...makeProps(overrides)} />, { locale });
}

afterEach(() => {
  cleanup();
});

describe("TeacherDailyScheduleSectionDesktop shell", () => {
  test("renders a single panel shell (no double Paper) containing the title, date navigator, and grid", () => {
    const { container } = renderSection();
    const section = within(container);

    const papers = container.querySelectorAll(".MuiPaper-root");
    expect(papers).toHaveLength(1);

    const panel = papers.item(0);
    expect(section.getByText(labels.schedule.title)).toBeVisible();

    const previousDayButton = section.getByRole("button", { name: labels.dateFilter.previousDay });
    const nextDayButton = section.getByRole("button", { name: labels.dateFilter.nextDay });
    expect(panel.contains(previousDayButton)).toBe(true);
    expect(panel.contains(nextDayButton)).toBe(true);

    const gridStub = section.getByTestId("teacher-schedule-grid");
    expect(panel.contains(gridStub)).toBe(true);
  });

  test("date navigator lives in the same single panel as the title bar (no nested panel shell)", () => {
    const { container } = renderSection();
    const section = within(container);

    const titlePanel = section.getByText(labels.schedule.title).closest(".MuiPaper-root");
    const navigatorPanel = section
      .getByRole("button", { name: labels.dateFilter.previousDay })
      .closest(".MuiPaper-root");

    expect(titlePanel).not.toBeNull();
    expect(navigatorPanel).toBe(titlePanel);
  });

  test("previous-day navigation wires through the single panel shell", () => {
    const onDateChange = mock(() => {});
    const { container } = renderSection({ onDateChange });

    within(container).getByRole("button", { name: labels.dateFilter.previousDay }).click();
    expect(onDateChange).toHaveBeenCalledWith("2026-08-26");
  });
});
