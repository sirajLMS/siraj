import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AttendanceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StudentHistoryLabelsProvider } from "@/frontend/common/views/dashboard/students/history/studentHistoryLabelsContext";
import type { ClassSession } from "@/frontend/common/views/dashboard/students/history/types";
import { CalendarGridDesktop } from "@/frontend/desktop/views/dashboard/students/history/components/calendarGrid.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const studentHistoryLabels = readTranslation(Translation.Dashboard.StudentHistory, locale);

const currentMonth = new Date(2026, 5, 1); // June 2026 (30 days)

function renderCalendarGrid(ui: React.ReactElement) {
  return renderWithWrapper(
    <StudentHistoryLabelsProvider labels={studentHistoryLabels}>{ui}</StudentHistoryLabelsProvider>,
    { permissions: [], locale }
  );
}

describe("CalendarGridDesktop", () => {
  test("renders all days of the month", () => {
    const classes = {};

    renderCalendarGrid(<CalendarGridDesktop currentMonth={currentMonth} classes={classes} />);

    for (let day = 1; day <= 30; day++) {
      const dayElements = screen.getAllByText(String(day));
      expect(dayElements.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("days with sessions are visually distinct", () => {
    const session: ClassSession = {
      id: "1",
      dayOfMonth: 15,
      title: "Math Class",
      time: "10:00",
      duration: 60,
      status: AttendanceStatus.Present,
      instructor: "Teacher John",
      timeSlot: "morning",
      room: "Room A",
      notes: "Algebra lesson",
    };

    const classes = { 15: session };

    renderCalendarGrid(<CalendarGridDesktop currentMonth={currentMonth} classes={classes} />);

    const day15Cell = screen.getByText("15").closest("a");
    expect(day15Cell).toContainElement(screen.getByText("Math Class"));
    expect(day15Cell).toContainElement(screen.getByText("morning"));
  });

  test("days with sessions link to class details", () => {
    const session: ClassSession = {
      id: "class-session-42",
      dayOfMonth: 15,
      title: "Math Class",
      time: "10:00",
      duration: 60,
      status: AttendanceStatus.Present,
      instructor: "Teacher John",
      timeSlot: "morning",
      room: "Room A",
      notes: "Algebra lesson",
    };

    const classes = { 15: session };

    renderCalendarGrid(<CalendarGridDesktop currentMonth={currentMonth} classes={classes} />);

    const day15Link = screen.getByText("15").closest("a");
    expect(day15Link).toHaveAttribute("href", "/classes/class-session-42");
  });

  test("empty cells render correctly", () => {
    const classes = {};

    renderCalendarGrid(<CalendarGridDesktop currentMonth={currentMonth} classes={classes} />);

    expect(screen.queryByText("Math Class")).toBeNull();
    expect(screen.queryByText("Science Lab")).toBeNull();
  });
});
