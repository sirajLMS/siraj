import { afterEach, describe, expect, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "en", routingIncludeReplaceAndPrefetch: false });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { TeacherLessonReportRow } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import { TeacherLessonReportsMobileView } from "@/frontend/mobile/views/dashboard/teachers/lesson-reports/teacherLessonReportsView.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import { buildTeacherLessonReportsViewModel } from "@/test/ui/components/teachers/lesson-reports/lessonReportsViewModelFixtures";

const locale: AppLocale = "en";
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

/**
 * The mobile lesson-reports view pins `paginationOptions={{ mode: "client" }}`
 * on its MobileCardList — paging must happen entirely client-side with the
 * list's default page size.
 */
const PAGED_ROWS: readonly TeacherLessonReportRow[] = Array.from({ length: 12 }, (_, index) => ({
  id: `report-${index + 1}`,
  classInstanceId: `class-${index + 1}`,
  lessonDate: "2026-02-02T10:00:00.000Z",
  durationMinutes: 60,
  completionPercentage: 80,
  status: LessonReportStatus.Approved,
  submittedAt: "2026-02-02T11:00:00.000Z",
  teacherNotes: `Paged notes entry ${index + 100}`,
  rejectionReason: null,
}));

function renderView(rows: readonly TeacherLessonReportRow[] = PAGED_ROWS) {
  return renderWithWrapper(
    <TeacherLessonReportsMobileView {...buildTeacherLessonReportsViewModel(locale, { rows })} />,
    { locale, viewport: "mobile" }
  );
}

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
});

describe("TeacherLessonReportsMobileView client-mode pagination (regression)", () => {
  test("slices rows client-side with the default page size", () => {
    renderView();

    expect(screen.getByText(content => content.includes("Paged notes entry 100"))).toBeInTheDocument();
    expect(screen.queryByText(content => content.includes("Paged notes entry 110"))).toBeNull();
    expect(screen.getByText(adminLabels.paginationRange(1, 10, 12))).toBeInTheDocument();
    expect(screen.getByText(adminLabels.pageOf(1, 2))).toBeInTheDocument();
  });

  test("pages to the next slice without any server round-trip", () => {
    const { container } = renderView();

    const nextButton = container.querySelector(`[aria-label="${adminLabels.nextPage}"] button`);
    if (!nextButton) {
      throw new Error("next page button not found in card list pager");
    }
    fireEvent.click(nextButton);

    expect(screen.getByText(content => content.includes("Paged notes entry 110"))).toBeInTheDocument();
    expect(screen.getByText(content => content.includes("Paged notes entry 111"))).toBeInTheDocument();
    expect(screen.queryByText(content => content.includes("Paged notes entry 100"))).toBeNull();
    expect(screen.getByText(adminLabels.paginationRange(11, 12, 12))).toBeInTheDocument();
  });
});
