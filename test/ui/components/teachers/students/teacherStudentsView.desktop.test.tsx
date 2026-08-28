import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "ar", routingIncludeReplaceAndPrefetch: false });

await mock.module("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent } from "@testing-library/react";

expect.extend(matchers);

import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  TeacherStudentsLabels,
  TeacherStudentsViewModel,
} from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";
import { TeacherStudentsDesktopView } from "@/frontend/desktop/views/dashboard/teachers/students/teacherStudentsView.desktop";
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

function renderDesktopView(overrides: Partial<TeacherStudentsViewModel> = {}) {
  const viewModel: TeacherStudentsViewModel = {
    rows: overrides.rows ?? [makeRow()],
    loading: overrides.loading ?? false,
    error: overrides.error ?? null,
    labels,
    paginationOptions: overrides.paginationOptions ?? { mode: "client" },
  };
  return renderWithWrapper(<TeacherStudentsDesktopView {...viewModel} />, { locale });
}

describe("TeacherStudentsDesktopView", () => {
  test("renders the grid column headers from the labels contract", () => {
    const view = renderDesktopView();

    expect(view.getByText(labels.columns.name)).toBeInTheDocument();
    expect(view.getByText(labels.columns.status)).toBeInTheDocument();
    expect(view.getByText(labels.columns.quota)).toBeInTheDocument();
    expect(view.getByText(labels.columns.hours)).toBeInTheDocument();
  });

  test("renders the student name as a profile link cell", () => {
    const view = renderDesktopView();

    const nameLinks = view.getAllByRole("link", { name: /Ahmed Hassan/ });
    expect(nameLinks[0]).toHaveAttribute("href", "/students/student-1/profile?tab=status");
  });

  test("renders status badge plus quota and hours text cells", () => {
    const view = renderDesktopView();

    expect(view.getByText(labels.statusLabel(StudentStatus.Regular))).toBeInTheDocument();
    expect(view.getByText(labels.quotaLabel(4, 10))).toBeInTheDocument();
    expect(view.getByText(labels.hoursLabel(3))).toBeInTheDocument();
  });

  test("shows the grid empty overlay when there are no rows", () => {
    const view = renderDesktopView({ rows: [] });

    expect(view.getByText(labels.noStudents)).toBeInTheDocument();
  });

  test("shows the loading state instead of the grid while loading", () => {
    const view = renderDesktopView({ loading: true });

    expect(view.queryByText(labels.columns.name)).not.toBeInTheDocument();
  });

  test("renders the grid inside the section panel shell", () => {
    const { container } = renderDesktopView();

    const panel = container.querySelector(".MuiPaper-root");
    expect(panel).not.toBeNull();
    expect(panel?.querySelector(".MuiDataGrid-root")).not.toBeNull();
  });

  test("renders failures through the error state instead of the grid", () => {
    const view = renderDesktopView({ error: new Error("boom") });

    const alert = view.getByRole("alert");
    expect(alert.textContent).toContain(labels.failedToLoad);
    expect(view.queryByText(labels.columns.name)).not.toBeInTheDocument();
  });

  test("paginates rows client-side through the shared pager", () => {
    const view = renderDesktopView({
      rows: [
        makeRow(),
        makeRow({ id: "student-2", name: "Sara Mahmoud" }),
        makeRow({ id: "student-3", name: "Omar Khalid" }),
      ],
      paginationOptions: { mode: "client", pageSize: 2, pageSizeOptions: [2] },
    });

    expect(view.getByText("Sara Mahmoud")).toBeInTheDocument();
    expect(view.queryByText("Omar Khalid")).not.toBeInTheDocument();

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
