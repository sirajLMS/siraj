import { afterEach, describe, expect, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import {
  adminLabels,
  buildTeacherClassListViewModel,
  makeCompletedTeacherClassRow,
  makeTeacherClassRow,
  teacherClassListLabels,
  teacherClassListLocale,
} from "@/test/ui/components/teachers/classes/teacherClassListFixtures";

await mockNextNavigation("/classes", { locale: teacherClassListLocale });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { TeacherClassListViewModel } from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";
import { TeacherClassListMobileView } from "@/frontend/mobile/views/dashboard/teachers/classes/teacherClassListView.mobile";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

function renderMobileView(overrides: Partial<TeacherClassListViewModel> = {}) {
  const viewModel = buildTeacherClassListViewModel(overrides);
  return render(<TeacherClassListMobileView {...viewModel} />, {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <TestWrapper locale={teacherClassListLocale}>{children}</TestWrapper>
    ),
  });
}

describe("TeacherClassListMobileView", () => {
  test("renders rows as cards with name, schedule, status, and details link", () => {
    renderMobileView();

    expect(screen.getByText("Ahmed Fixture")).toBeInTheDocument();
    expect(screen.getByText(teacherClassListLabels.durationMinutes(60))).toBeInTheDocument();
    expect(screen.getByText(teacherClassListLabels.viewDetails)).toBeInTheDocument();
  });

  test("shows the emptyMessage with the pager when rows are empty", () => {
    const { container } = renderMobileView({ rows: [] });

    expect(screen.getByText(teacherClassListLabels.noClasses)).toBeInTheDocument();
    expect(container.querySelector(`[aria-label="${adminLabels.nextPage}"]`)).not.toBeNull();
  });

  test("owns the pager via client paginationOptions and pages rows internally", async () => {
    const rows = Array.from({ length: 12 }, (_, index) =>
      makeTeacherClassRow({ id: `class-${index}`, studentName: `Fixture Student ${index + 1}` })
    );
    const { container } = renderMobileView({ rows });

    expect(screen.getByText("Fixture Student 1")).toBeInTheDocument();
    expect(screen.queryByText("Fixture Student 12")).toBeNull();

    const nextButton = container.querySelector(`[aria-label="${adminLabels.nextPage}"] button`);
    if (!nextButton) {
      throw new Error("next page button not found in card list pager");
    }
    fireEvent.click(nextButton);

    await waitFor(
      () => {
        expect(screen.getByText("Fixture Student 12")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  test("renders the join action for joinable rows and the audit action for completed rows", () => {
    renderMobileView({
      rows: [makeTeacherClassRow(), makeCompletedTeacherClassRow()],
    });

    expect(screen.getByLabelText(teacherClassListLabels.joinVideo)).toBeInTheDocument();
    expect(screen.getByText(teacherClassListLabels.viewClassAudit)).toBeInTheDocument();
  });

  test("renders the failure message instead of the card list when the query failed", () => {
    const { container } = renderMobileView({ error: new Error("boom"), rows: [] });

    expect(screen.getByText(teacherClassListLabels.failedToLoad)).toBeInTheDocument();
    expect(screen.queryByText(teacherClassListLabels.noClasses)).toBeNull();
    expect(container.querySelector(`[aria-label="${adminLabels.nextPage}"]`)).toBeNull();
  });

  test("renders the student name as a profile link with avatar and student href", () => {
    renderMobileView();

    const profileLink = screen.getByText("Ahmed Fixture").closest("a");
    if (!profileLink) {
      throw new Error("student profile link not found in the card");
    }
    expect(profileLink.getAttribute("href")).toContain("/students/student-1/profile");
    expect(profileLink.querySelector(".MuiAvatar-root")).not.toBeNull();
  });

  test("renders the student name without a link when studentId is missing", () => {
    renderMobileView({ rows: [makeTeacherClassRow({ studentId: null })] });

    expect(screen.getByText("Ahmed Fixture").closest("a")).toBeNull();
  });
});
