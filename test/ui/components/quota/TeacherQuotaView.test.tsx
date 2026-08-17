import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { teacherAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers";
import { TeacherQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const t = readTranslation(Translation.Dashboard.StudentQuota, locale);

function assignedStudentsMock(rows: Record<string, unknown>[], loading = false) {
  return {
    request: { query: teacherAssignedStudentsQueryDocument },
    result: {
      data: {
        teacherAssignedStudents: {
          id: "teacher-1",
          totalCount: rows.length,
          rows,
          __typename: "TeacherAssignedStudents",
        },
      },
    },
    delay: loading ? 500 : 0,
  };
}

const mockEligibleStudent = {
  id: "student-1",
  name: "Alice",
  status: "ACTIVE",
  hoursPerWeek: 4,
  classesRemaining: 10,
  classesTotal: 20,
  __typename: "Student",
};

const mockExhaustedStudent = {
  id: "student-2",
  name: "Bob",
  status: "ACTIVE",
  hoursPerWeek: 2,
  classesRemaining: 0,
  classesTotal: 15,
  __typename: "Student",
};

describe("TeacherQuotaView", () => {
  afterEach(() => cleanup());

  function renderTeacherView(mocks: ReturnType<typeof assignedStudentsMock>[]) {
    renderWithWrapper(<TeacherQuotaView t={t} />, {
      locale,
      viewport: "desktop",
      mocks,
    });
  }

  test("renders student rows for teacher's assigned students", async () => {
    renderTeacherView([assignedStudentsMock([mockEligibleStudent, mockExhaustedStudent])]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.teacherTitle)).toBeVisible();
    });

    expect(screen.getByText("Alice")).toBeVisible();
    expect(screen.getByText("Bob")).toBeVisible();
  });

  test("renders no data when teacher has no assigned students", async () => {
    renderTeacherView([assignedStudentsMock([])]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.noData)).toBeVisible();
    });
  });

  test("renders loading state while students are loading", async () => {
    renderTeacherView([assignedStudentsMock([], true)]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.loadingData)).toBeVisible();
    });
  });

  test("uses teacherTitle as page title", async () => {
    renderTeacherView([assignedStudentsMock([mockEligibleStudent])]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.teacherTitle)).toBeVisible();
    });
  });

  test("renders eligible student with eligibility label", async () => {
    renderTeacherView([assignedStudentsMock([mockEligibleStudent])]);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeVisible();
    });

    expect(screen.getByText(t.audience.eligibleForNextClass)).toBeVisible();
  });

  test("renders exhausted student with not-eligible label", async () => {
    renderTeacherView([assignedStudentsMock([mockExhaustedStudent])]);

    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeVisible();
    });

    expect(screen.getByText(t.audience.notEligibleForNextClass)).toBeVisible();
  });
});
