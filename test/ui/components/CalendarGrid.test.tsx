import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { CalendarGrid } from "@/frontend/views/dashboard/students/history/components/CalendarGrid";
import type { ClassSession } from "@/frontend/views/dashboard/students/history/types";
import { renderWithWrapper } from "./TestWrapper";

afterEach(() => {
  cleanup();
});

const currentMonth = new Date(2026, 5, 1); // June 2026 (30 days)

describe("CalendarGrid", () => {
  test("renders all days of the month", () => {
    const classes = {};

    renderWithWrapper(<CalendarGrid currentMonth={currentMonth} classes={classes} />, {
      permissions: [],
    });

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
      status: "present",
      instructor: "Teacher John",
      timeSlot: "morning",
      room: "Room A",
      notes: "Algebra lesson",
    };

    const classes = { 15: session };

    renderWithWrapper(<CalendarGrid currentMonth={currentMonth} classes={classes} />, {
      permissions: [],
    });

    const day15Cell = screen.getByText("15").closest("a");
    expect(day15Cell).toContainElement(screen.getByText("Math Class"));
    expect(day15Cell).toContainElement(screen.getByText("10:00"));
  });

  test("days with sessions link to class details", () => {
    const session: ClassSession = {
      id: "class-session-42",
      dayOfMonth: 15,
      title: "Math Class",
      time: "10:00",
      duration: 60,
      status: "present",
      instructor: "Teacher John",
      timeSlot: "morning",
      room: "Room A",
      notes: "Algebra lesson",
    };

    const classes = { 15: session };

    renderWithWrapper(<CalendarGrid currentMonth={currentMonth} classes={classes} />, {
      permissions: [],
    });

    const day15Link = screen.getByText("15").closest("a");
    expect(day15Link).toHaveAttribute("href", "/classes/class-session-42");
  });

  test("empty cells render correctly", () => {
    const classes = {};

    renderWithWrapper(<CalendarGrid currentMonth={currentMonth} classes={classes} />, {
      permissions: [],
    });

    expect(screen.queryByText("Math Class")).toBeNull();
    expect(screen.queryByText("Science Lab")).toBeNull();
  });
});
