import { afterEach, describe, expect, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/teachers/schedule/future", { locale: "ar" });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import type { TeacherFutureScheduleQuery_teacherFutureSchedule_classes as FutureClass } from "@/frontend/common/graphql/generated/gql/graphql";
import { FutureScheduleViewDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/futureScheduleView.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.TeacherFutureSchedule, locale);

function makeFutureClass(id: string, courseName: string): FutureClass {
  return {
    id,
    courseName,
    scheduledDate: "2026-09-01",
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    isRescheduled: false,
    leaveRequestDisabled: false,
    leaveRequestDisabledReason: null,
    studentCount: 1,
    location: "Online",
    subjectId: null,
    subjectName: null,
    classType: null,
    executionState: null,
    outcome: null,
    avatarUrl: null,
    effectiveMeeting: null,
  };
}

// The desktop column keeps a plain, intentionally unpaginated card stack, so
// every class in the collection must be materialized — nothing is sliced or
// dropped. These fixtures exceed the mobile pager's typical page size to pin
// that contract down.
const CLASS_COUNT = 12;

function makeClassRows(): FutureClass[] {
  return Array.from({ length: CLASS_COUNT }, (_, index) =>
    makeFutureClass(`class-${index + 1}`, `Course ${index + 1}`)
  );
}

function renderDesktopView(rows: readonly FutureClass[]) {
  return renderWithWrapper(
    <FutureScheduleViewDesktop
      classes={rows}
      leaveQuotaUsed={0}
      leaveQuotaTotal={5}
      totalClasses={rows.length}
      onRequestLeave={async () => {}}
      selectedDate="2026-09-01"
      onDateChange={() => {}}
      notes={[]}
      contact={null}
      classDates={[]}
      loading={false}
      error={null}
      onSupportContact={async () => {}}
      labelsBySection={{
        schedule: labels,
        supportContact: { supportContact: labels.supportContact, contactAdmin: labels.contactAdmin },
      }}
    />,
    { locale, viewport: "desktop" }
  );
}

afterEach(() => {
  cleanup();
});

describe("FutureScheduleViewDesktop render completeness", () => {
  test("renders the page header", () => {
    renderDesktopView(makeClassRows());

    expect(screen.getByText(labels.pageTitle)).toBeInTheDocument();
  });

  test("materializes every class of a large collection without pagination", () => {
    const rows = makeClassRows();
    renderDesktopView(rows);

    expect(screen.getByText(labels.futureClasses)).toBeInTheDocument();
    for (const row of rows) {
      expect(screen.getByText(row.courseName ?? "")).toBeInTheDocument();
    }
  });

  test("renders the per-class info and leave action for the whole collection", () => {
    renderDesktopView(makeClassRows());

    const studentCountLabels = screen.getAllByText(labels.studentCount(1));
    expect(studentCountLabels).toHaveLength(CLASS_COUNT);

    const leaveButtons = screen.getAllByRole("button", { name: labels.requestLeave });
    expect(leaveButtons).toHaveLength(CLASS_COUNT);
  });
});
