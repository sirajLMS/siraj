import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "en", routingIncludeReplaceAndPrefetch: false });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { TeacherLessonReportsDesktopView } from "@/frontend/desktop/views/dashboard/teachers/lesson-reports/teacherLessonReportsView.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import { buildTeacherLessonReportsViewModel } from "@/test/ui/components/teachers/lesson-reports/lessonReportsViewModelFixtures";

const locale: AppLocale = "en";
const t = readTranslation(Translation.Dashboard.LmsLessonReports, locale);

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

describe("TeacherLessonReportsDesktopView", () => {
  test("renders the status filter inside the section panel actions", () => {
    renderWithWrapper(<TeacherLessonReportsDesktopView {...buildTeacherLessonReportsViewModel(locale)} />, {
      locale,
      viewport: "desktop",
    });

    expect(screen.getByText(t.historyTitle)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: t.status })).toBeVisible();
  });

  test("renders the reports grid with the lesson-report columns and status badges", () => {
    renderWithWrapper(<TeacherLessonReportsDesktopView {...buildTeacherLessonReportsViewModel(locale)} />, {
      locale,
      viewport: "desktop",
    });

    for (const header of [t.lessonDate, t.status, t.durationMinutes, t.completionPercentage, t.teacherNotes]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
    }

    expect(screen.getByText(t.approved)).toBeInTheDocument();
    expect(screen.getByText(t.pendingReview)).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Covered grammar basics and reading aloud.")).toBeInTheDocument();
  });

  test("propagates filter selection to the store-backed onStatusFilterChange handler", () => {
    const onStatusFilterChange = mock(() => {});
    renderWithWrapper(
      <TeacherLessonReportsDesktopView {...buildTeacherLessonReportsViewModel(locale, { onStatusFilterChange })} />,
      { locale, viewport: "desktop" }
    );

    fireEvent.mouseDown(screen.getByRole("combobox", { name: t.status }));
    fireEvent.click(screen.getByRole("option", { name: t.approved }));

    expect(onStatusFilterChange).toHaveBeenCalledWith(LessonReportStatus.Approved);
  });

  test("shows the empty message through the grid overlay when there are no rows", () => {
    renderWithWrapper(
      <TeacherLessonReportsDesktopView {...buildTeacherLessonReportsViewModel(locale, { rows: [] })} />,
      {
        locale,
        viewport: "desktop",
      }
    );

    expect(screen.getByText(t.noReports)).toBeInTheDocument();
  });
});
