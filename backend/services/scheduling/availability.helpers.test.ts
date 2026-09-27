import { describe, expect, it } from "bun:test";
import { computeSlotBounds } from "@/backend/services/scheduling/availability.helpers";

describe("computeSlotBounds", () => {
  it("computes bounds correctly for a single slot", () => {
    const start = new Date("2026-03-01T10:00:00Z");
    const end = new Date("2026-03-01T11:00:00Z");

    const bounds = computeSlotBounds([{ startTime: start, endTime: end }]);

    expect(bounds.earliestStart.toISOString()).toBe("2026-03-01T10:00:00.000Z");
    expect(bounds.latestEnd.toISOString()).toBe("2026-03-01T11:00:00.000Z");
  });

  it("computes bounds correctly for multiple unsorted slots", () => {
    const slots = [
      {
        startTime: new Date("2026-03-15T14:00:00Z"),
        endTime: new Date("2026-03-15T15:00:00Z"),
      },
      {
        startTime: new Date("2026-03-01T08:00:00Z"),
        endTime: new Date("2026-03-01T09:00:00Z"),
      },
      {
        startTime: new Date("2026-03-20T12:00:00Z"),
        endTime: new Date("2026-03-20T18:00:00Z"),
      },
    ];

    const bounds = computeSlotBounds(slots);

    expect(bounds.earliestStart.toISOString()).toBe("2026-03-01T08:00:00.000Z");
    expect(bounds.latestEnd.toISOString()).toBe("2026-03-20T18:00:00.000Z");
  });

  it("handles a large array of slots without stack overflow", () => {
    const baseTime = Date.parse("2026-01-01T00:00:00Z");
    const slotsCount = 800_000;
    const slots = Array.from({ length: slotsCount }, (_, i) => ({
      startTime: new Date(baseTime + i * 3600_000),
      endTime: new Date(baseTime + (i + 1) * 3600_000),
    }));

    const bounds = computeSlotBounds(slots);

    expect(bounds.earliestStart.getTime()).toBe(baseTime);
    expect(bounds.latestEnd.getTime()).toBe(baseTime + slotsCount * 3600_000);
  });
});
