import { describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as matchers from "@testing-library/jest-dom/matchers";
import { fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import { formatStatusLabel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsStatusFormatters";
import type { AssignedStudentsListLabels } from "@/frontend/common/views/dashboard/profile/teacher/students/types/assignedStudentsList.types";
import { AssignedStudentsCardList } from "@/frontend/mobile/views/dashboard/profile/teacher/students/assignedStudentsCardList.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const profileBase = readTranslation(Translation.Profile.Base, locale);
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

const labels: AssignedStudentsListLabels = {
  columns: profileBase.students.columns,
  emptyMessage: profileBase.students.mobileListLabel,
};

function makeRow(overrides: Partial<AssignedStudentsRow> = {}): AssignedStudentsRow {
  return {
    id: "student-1",
    studentName: "Sara Ahmad",
    studentAvatarUrl: null,
    parentName: "Mona Ahmad",
    parentAvatarUrl: null,
    parentId: "parent-1",
    parentUserId: "parent-user-1",
    className: "Math A",
    status: "REGULAR",
    hoursPerWeek: 3,
    classesRemaining: 5,
    classesTotal: 12,
    ...overrides,
  };
}

describe("AssignedStudentsCardList (mobile)", () => {
  test("renders rows with the status badge label", async () => {
    const rows = [makeRow(), makeRow({ id: "student-2", studentName: "Omar Khalid", status: "ON_LEAVE" })];
    renderWithWrapper(
      <AssignedStudentsCardList
        rows={rows}
        labels={labels}
        paginationOptions={buildServerPaginationOptions({
          page: 0,
          pageSize: 10,
          totalCount: 2,
          onPageChange: () => {},
        })}
      />,
      { locale }
    );

    expect(await screen.findByText("Sara Ahmad")).toBeInTheDocument();
    expect(screen.getByText(formatStatusLabel("REGULAR"))).toBeInTheDocument();
    expect(screen.getByText(formatStatusLabel("ON_LEAVE"))).toBeInTheDocument();
  });

  test("renders exactly one server-mode pager wired to onPageChange", async () => {
    const onPageChange = mock(() => {});
    renderWithWrapper(
      <AssignedStudentsCardList
        rows={[makeRow()]}
        labels={labels}
        paginationOptions={buildServerPaginationOptions({ page: 0, pageSize: 10, totalCount: 25, onPageChange })}
      />,
      { locale }
    );

    await screen.findByText("Sara Ahmad");
    expect(screen.getAllByText(adminLabels.paginationRange(1, 10, 25))).toHaveLength(1);
    expect(screen.getByLabelText(adminLabels.goToPage)).toBeInTheDocument();

    // MUI Tooltip forwards the aria-label to its wrapper span; the IconButton sits inside it.
    const nextButton = screen.getByLabelText(adminLabels.nextPage).querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      fireEvent.click(nextButton);
    }
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("keeps the pager visible even for a single server page", async () => {
    renderWithWrapper(
      <AssignedStudentsCardList
        rows={[makeRow()]}
        labels={labels}
        paginationOptions={buildServerPaginationOptions({
          page: 0,
          pageSize: 10,
          totalCount: 1,
          onPageChange: () => {},
        })}
      />,
      { locale }
    );

    await screen.findByText("Sara Ahmad");
    expect(screen.getByText(adminLabels.pageOf(1, 1))).toBeInTheDocument();
  });

  test("source contract: consumes the mobile badge primitive, not the common one", () => {
    const source = readFileSync(
      resolve(
        import.meta.dirname,
        "../../../../frontend/mobile/views/dashboard/profile/teacher/students/assignedStudentsCardList.mobile.tsx"
      ),
      "utf8"
    );
    expect(source).toContain('from "@/frontend/mobile/components/ui/badge"');
    expect(source).not.toMatch(/import\s[^;\n]*\bStatusBadge\b[^;\n]*from\s*['"]@\/frontend\/common/);
  });
});
