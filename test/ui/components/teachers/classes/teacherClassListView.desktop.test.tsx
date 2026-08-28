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
import { TeacherClassListDesktopView } from "@/frontend/desktop/views/dashboard/teachers/classes/teacherClassListView.desktop";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

function renderDesktopView(overrides: Partial<TeacherClassListViewModel> = {}) {
  const viewModel = buildTeacherClassListViewModel(overrides);
  return render(<TeacherClassListDesktopView {...viewModel} />, {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <TestWrapper locale={teacherClassListLocale}>{children}</TestWrapper>
    ),
  });
}

describe("TeacherClassListDesktopView", () => {
  test("renders the DesktopAppDataGrid with column headers and row values", async () => {
    const { container } = renderDesktopView();

    await waitFor(() => {
      expect(container.querySelector(".MuiDataGrid-root")).not.toBeNull();
    });

    expect(screen.getByText(teacherClassListLabels.columns.student)).toBeInTheDocument();
    expect(screen.getByText(teacherClassListLabels.columns.schedule)).toBeInTheDocument();
    expect(screen.getByText(teacherClassListLabels.columns.status)).toBeInTheDocument();
    expect(screen.getByText(teacherClassListLabels.columns.actions)).toBeInTheDocument();
    expect(screen.getByText("Ahmed Fixture")).toBeInTheDocument();
  });

  test("shows the emptyMessage as the grid empty overlay when rows are empty", async () => {
    renderDesktopView({ rows: [] });

    await waitFor(() => {
      expect(screen.getByText(teacherClassListLabels.noClasses)).toBeInTheDocument();
    });
  });

  test("owns the pager via client paginationOptions and pages rows internally", async () => {
    const rows = Array.from({ length: 12 }, (_, index) =>
      makeTeacherClassRow({ id: `class-${index}`, studentName: `Fixture Student ${index + 1}` })
    );
    const { container } = renderDesktopView({ rows });

    await waitFor(
      () => {
        expect(container.querySelector(".MuiDataGrid-footerContainer")).not.toBeNull();
      },
      { timeout: 5000 }
    );

    const nextButton = container.querySelector(`[aria-label="${adminLabels.nextPage}"] button`);
    if (!nextButton) {
      throw new Error("next page button not found in grid pager");
    }
    expect(screen.queryByText("Fixture Student 12")).toBeNull();

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Fixture Student 12")).toBeInTheDocument();
    });
  });

  test("renders the join-action cell for joinable rows and the audit action for completed rows", async () => {
    renderDesktopView({
      rows: [makeTeacherClassRow(), makeCompletedTeacherClassRow()],
    });

    await waitFor(() => {
      expect(screen.getByLabelText(teacherClassListLabels.joinVideo)).toBeInTheDocument();
    });
    expect(screen.getByText(teacherClassListLabels.viewClassAudit)).toBeInTheDocument();

    const viewDetailsButtons = screen.getAllByText(teacherClassListLabels.viewDetails);
    expect(viewDetailsButtons).toHaveLength(2);
  });

  test("shows the loading overlay through the grid loading prop", async () => {
    const { container } = renderDesktopView({ loading: true, rows: [] });

    await waitFor(() => {
      expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    });
  });

  test("renders the failure message instead of the grid when the query failed", () => {
    const { container } = renderDesktopView({ error: new Error("boom") });

    expect(screen.getByText(teacherClassListLabels.failedToLoad)).toBeInTheDocument();
    expect(container.querySelector(".MuiDataGrid-root")).toBeNull();
  });
});
