import { describe, expect, test } from "bun:test";
import { formatScheduleTimeOnly } from "@/frontend/views/dashboard/dashboard/utils/formatScheduleTime";

describe("formatScheduleTimeOnly", () => {
  test("formats ISO timestamps as hh:mm AM/PM", () => {
    const formatted = formatScheduleTimeOnly("2028-06-15T14:30:00.000Z", "en");
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    expect(formatted).not.toContain("2028");
  });

  test("returns plain time strings unchanged when not ISO", () => {
    expect(formatScheduleTimeOnly("11:00 AM", "en")).toBe("11:00 AM");
  });

  test("strips trailing timezone labels from formatted strings", () => {
    expect(formatScheduleTimeOnly("3:00 PM (Asia/Riyadh)", "en")).toBe("3:00 PM");
  });
});
