import { describe, expect, it } from "bun:test";
import {
  createWeekdayFormatter,
  dayKeyOf,
  formatHour,
  groupClassesByDayKey,
  HOURS,
} from "@/frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.helpers";

describe("studentWeekCalendar.helpers", () => {
  it("HOURS contains 16 hours starting at 7", () => {
    expect(HOURS).toHaveLength(16);
    expect(HOURS[0]).toBe(7);
    expect(HOURS[15]).toBe(22);
  });

  it("formatHour formats hours consistently and caches formatted results", () => {
    const formatted7en1 = formatHour(7, "en");
    const formatted7en2 = formatHour(7, "en");
    expect(formatted7en1).toBe(formatted7en2);
    expect(formatted7en1).toMatch(/7\s*AM/i);

    const formatted14en = formatHour(14, "en");
    expect(formatted14en).toMatch(/2\s*PM/i);

    const formatted7ar = formatHour(7, "ar");
    expect(typeof formatted7ar).toBe("string");
    expect(formatted7ar.length).toBeGreaterThan(0);
  });

  it("createWeekdayFormatter returns a functional Intl.DateTimeFormat instance", () => {
    const dtf = createWeekdayFormatter("en");
    const date = new Date(2026, 0, 5); // Monday, Jan 5, 2026
    expect(dtf.format(date)).toBe("Mon");
  });

  it("dayKeyOf formats date into YYYY-M-D string", () => {
    const date = new Date(2026, 4, 15);
    expect(dayKeyOf(date)).toBe("2026-4-15");
  });

  it("groupClassesByDayKey groups classes by their scheduled start date key", () => {
    const classes = [
      {
        id: "1",
        scheduledStartAt: "2026-05-15T09:00:00",
        scheduledEndAt: "2026-05-15T10:00:00",
        subjectName: "Quran",
        instructor: "Teacher A",
        outcome: "PENDING",
        executionState: "ACTIVATED",
      },
      {
        id: "2",
        scheduledStartAt: "2026-05-15T11:00:00",
        scheduledEndAt: "2026-05-15T12:00:00",
        subjectName: "Islamic Studies",
        instructor: "Teacher B",
        outcome: "PENDING",
        executionState: "ACTIVATED",
      },
      {
        id: "3",
        scheduledStartAt: "invalid-date",
        scheduledEndAt: "",
        subjectName: null,
        instructor: "",
        outcome: "",
        executionState: "",
      },
    ];

    const grouped = groupClassesByDayKey(classes);
    const sampleDate = new Date("2026-05-15T09:00:00");
    const key = dayKeyOf(sampleDate);

    const dayGroup = grouped.get(key);
    expect(dayGroup).toBeDefined();
    expect(dayGroup?.length).toBe(2);
    expect(dayGroup?.[0].id).toBe("1");
    expect(dayGroup?.[1].id).toBe("2");
  });
});
