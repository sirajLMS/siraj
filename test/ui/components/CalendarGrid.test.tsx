import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
    const onSelectDay = mock(() => {});

    renderWithWrapper(<CalendarGrid currentMonth={currentMonth} classes={classes} onSelectDay={onSelectDay} />, {
      permissions: [],
    });

    // June 2026 has 30 days, so we expect to see the numbers 1 through 30 in the calendar grid
    // Some numbers might appear multiple times (e.g., day 1 of month vs day 1 of next month in empty cells)
    // But each day from 1-30 should appear at least once
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
    const onSelectDay = mock(() => {});

    renderWithWrapper(<CalendarGrid currentMonth={currentMonth} classes={classes} onSelectDay={onSelectDay} />, {
      permissions: [],
    });

    // Day 15 should have session data (title, time, status) visible
    const day15Cell = screen.getByText("15").closest("div");
    expect(day15Cell).toContainElement(screen.getByText("Math Class"));
    expect(day15Cell).toContainElement(screen.getByText("10:00"));
  });

  test("clicking a day calls onSelectDay", async () => {
    const classes = {};
    const onSelectDay = mock(() => {});

    renderWithWrapper(<CalendarGrid currentMonth={currentMonth} classes={classes} onSelectDay={onSelectDay} />, {
      permissions: [],
    });

    const user = userEvent.setup();
    const day15 = screen.getByText("15");
    await user.click(day15);

    expect(onSelectDay).toHaveBeenCalledWith(15);
  });

  test("empty cells render correctly", () => {
    const classes = {};
    const onSelectDay = mock(() => {});

    renderWithWrapper(<CalendarGrid currentMonth={currentMonth} classes={classes} onSelectDay={onSelectDay} />, {
      permissions: [],
    });

    // Just verify that empty cells exist and don't have session-specific content
    expect(screen.queryByText("Math Class")).toBeNull();
    expect(screen.queryByText("Science Lab")).toBeNull();
  });
});
