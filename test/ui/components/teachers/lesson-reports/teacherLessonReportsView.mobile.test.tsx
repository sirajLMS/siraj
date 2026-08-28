import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "en", routingIncludeReplaceAndPrefetch: false });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { TeacherLessonReportsMobileView } from "@/frontend/mobile/views/dashboard/teachers/lesson-reports/teacherLessonReportsView.mobile";
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

describe("TeacherLessonReportsMobileView", () => {
  test("renders the status filter inside the section panel actions", () => {
    renderWithWrapper(<TeacherLessonReportsMobileView {...buildTeacherLessonReportsViewModel(locale)} />, {
      locale,
      viewport: "mobile",
    });

    expect(screen.getByText(t.historyTitle)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: t.status })).toBeVisible();
  });

  test("renders each report as a card with badge, metrics, and notes", () => {
    renderWithWrapper(<TeacherLessonReportsMobileView {...buildTeacherLessonReportsViewModel(locale)} />, {
      locale,
      viewport: "mobile",
    });

    expect(screen.getByText(t.approved)).toBeInTheDocument();
    expect(screen.getByText(t.pendingReview)).toBeInTheDocument();
    expect(
      screen.getByText(content => content.includes("Covered grammar basics and reading aloud."))
    ).toBeInTheDocument();
    expect(screen.getByText(content => content.includes(`${t.durationMinutes}: 60`))).toBeInTheDocument();
    expect(screen.getByText(content => content.includes(`${t.completionPercentage}: 55%`))).toBeInTheDocument();
  });

  test("propagates filter selection to the store-backed onStatusFilterChange handler", () => {
    const onStatusFilterChange = mock(() => {});
    renderWithWrapper(
      <TeacherLessonReportsMobileView {...buildTeacherLessonReportsViewModel(locale, { onStatusFilterChange })} />,
      { locale, viewport: "mobile" }
    );

    fireEvent.mouseDown(screen.getByRole("combobox", { name: t.status }));
    fireEvent.click(screen.getByRole("option", { name: t.pendingReview }));

    expect(onStatusFilterChange).toHaveBeenCalledWith(LessonReportStatus.PendingReview);
  });

  test("shows the empty message through the card list when there are no rows", () => {
    renderWithWrapper(
      <TeacherLessonReportsMobileView {...buildTeacherLessonReportsViewModel(locale, { rows: [] })} />,
      {
        locale,
        viewport: "mobile",
      }
    );

    expect(screen.getByText(t.noReports)).toBeInTheDocument();
  });
});
