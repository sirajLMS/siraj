import { afterEach, describe, expect, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "ar", routingIncludeReplaceAndPrefetch: false });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent } from "@testing-library/react";

expect.extend(matchers);

import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  TeacherStudentsLabels,
  TeacherStudentsViewModel,
} from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";
import { TeacherStudentsMobileView } from "@/frontend/mobile/views/dashboard/teachers/students/teacherStudentsView.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

const labels: TeacherStudentsLabels = {
  pageTitle: "Custom students page",
  pageSubtitle: "Custom students subtitle",
  noStudents: "Custom no students yet",
  columns: {
    name: "Custom name column",
    status: "Custom status column",
    quota: "Custom quota column",
    hours: "Custom hours column",
  },
  statusLabel: status => `Status: ${status}`,
  quotaLabel: (remaining, total) => `Remaining: ${remaining}/${total}`,
  hoursLabel: hours => `${hours}h weekly`,
  failedToLoad: "Custom failed to load",
};

type StudentRow = TeacherStudentsViewModel["rows"][number];

function makeRow(overrides: Partial<StudentRow> = {}): StudentRow {
  return {
    id: "student-1",
    name: "Ahmed Hassan",
    status: StudentStatus.Regular,
    hoursPerWeek: 3,
    classesRemaining: 4,
    classesTotal: 10,
    ...overrides,
  };
}

function renderMobileView(overrides: Partial<TeacherStudentsViewModel> = {}) {
  const viewModel: TeacherStudentsViewModel = {
    rows: overrides.rows ?? [makeRow()],
    loading: overrides.loading ?? false,
    error: overrides.error ?? null,
    labels,
    paginationOptions: overrides.paginationOptions ?? { mode: "client" },
  };
  return renderWithWrapper(<TeacherStudentsMobileView {...viewModel} />, { locale });
}

describe("TeacherStudentsMobileView", () => {
  test("renders each student as a card with name, status, quota and hours", () => {
    const view = renderMobileView();

    expect(view.getByText("Ahmed Hassan")).toBeInTheDocument();
    expect(view.getByText(labels.statusLabel(StudentStatus.Regular))).toBeInTheDocument();
    expect(view.getByText(labels.quotaLabel(4, 10))).toBeInTheDocument();
    expect(view.getByText(labels.hoursLabel(3))).toBeInTheDocument();
  });

  test("shows the list empty state when there are no students", () => {
    const view = renderMobileView({ rows: [] });

    expect(view.getByText(labels.noStudents)).toBeInTheDocument();
  });

  test("shows the loading state instead of the list while loading", () => {
    const view = renderMobileView({ loading: true });

    expect(view.queryByText("Ahmed Hassan")).not.toBeInTheDocument();
  });

  test("paginates cards client-side through the shared pager", () => {
    const view = renderMobileView({
      rows: [
        makeRow(),
        makeRow({ id: "student-2", name: "Sara Mahmoud" }),
        makeRow({ id: "student-3", name: "Omar Khalid" }),
      ],
      paginationOptions: { mode: "client", pageSize: 2, pageSizeOptions: [2] },
    });

    expect(view.getByText("Sara Mahmoud")).toBeInTheDocument();
    expect(view.queryByText("Omar Khalid")).not.toBeInTheDocument();
    expect(view.getByText(adminLabels.paginationRange(1, 2, 3))).toBeInTheDocument();

    const nextWrapper = view.getByLabelText(adminLabels.nextPage);
    const nextButton = nextWrapper.querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    expect(view.getByText("Omar Khalid")).toBeInTheDocument();
    expect(view.queryByText("Ahmed Hassan")).not.toBeInTheDocument();
  });
});
