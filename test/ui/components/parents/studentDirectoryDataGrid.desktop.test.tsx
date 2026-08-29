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

import {
  type StudentDirectoryDataGridLabels,
  type StudentDirectoryRowExtended,
  StudentEnrollmentStatus,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import { StudentDirectoryDataGrid } from "@/frontend/desktop/views/dashboard/admin/parents/students/components/studentDirectoryDataGrid.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

const labels: StudentDirectoryDataGridLabels = {
  index: "Custom index",
  student: "Custom student",
  email: "Custom email",
  status: "Custom status",
  hoursPerWeek: "Custom hours",
  classesLeft: "Custom classes left",
  actions: "Custom actions",
  showingOf: (shown, total) => `${shown}/${total}`,
  previous: "Custom previous",
  next: "Custom next",
  viewProfile: "Custom view profile",
  viewHistory: "Custom view history",
  noEntries: "Custom empty message",
  statusLabels: {
    regular: "Custom regular",
    on_leave: "Custom on leave",
    suspended: "Custom suspended",
    on_trial: "Custom on trial",
    deactivated: "Custom deactivated",
  },
};

function makeRow(index: number): StudentDirectoryRowExtended {
  return {
    id: `student-${index}`,
    index,
    name: `Student Number ${index}`,
    email: `student-${index}@example.com`,
    avatarUrl: null,
    status: "regular",
    classesRemaining: 5,
    classesTotal: 10,
    hoursPerWeek: 2,
    teacherName: "Teacher Example",
    createdAt: null,
    updatedAt: null,
    accountStatus: "regular",
    enrollmentStatus: StudentEnrollmentStatus.REGULAR,
    isDeactivated: false,
  };
}

function makeRows(count: number): StudentDirectoryRowExtended[] {
  return Array.from({ length: count }, (_, i) => makeRow(i + 1));
}

describe("StudentDirectoryDataGrid pagination", () => {
  test("uses server pagination when totalCount and onPageChange are provided", () => {
    const onPageChange = mock((page: number) => page);
    const view = renderWithWrapper(
      <StudentDirectoryDataGrid
        rows={makeRows(12)}
        labels={labels}
        page={0}
        pageSize={10}
        totalCount={100}
        onPageChange={onPageChange}
        onViewProfile={() => undefined}
        onViewHistory={() => undefined}
      />,
      { locale }
    );

    // Server mode does not slice the handed rows: all 12 render on page 0.
    expect(view.getByText("Student Number 12")).toBeInTheDocument();

    const nextWrapper = view.getByLabelText(adminLabels.nextPage);
    const nextButton = nextWrapper.querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      fireEvent.click(nextButton);
    }
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("falls back to client pagination when totalCount and onPageChange are omitted", () => {
    const view = renderWithWrapper(
      <StudentDirectoryDataGrid
        rows={makeRows(12)}
        labels={labels}
        onViewProfile={() => undefined}
        onViewHistory={() => undefined}
      />,
      { locale }
    );

    expect(view.getByText("Student Number 10")).toBeInTheDocument();
    expect(view.queryByText("Student Number 12")).not.toBeInTheDocument();

    const nextWrapper = view.getByLabelText(adminLabels.nextPage);
    const nextButton = nextWrapper.querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    expect(view.getByText("Student Number 12")).toBeInTheDocument();
    expect(view.queryByText("Student Number 1")).not.toBeInTheDocument();
  });
});
