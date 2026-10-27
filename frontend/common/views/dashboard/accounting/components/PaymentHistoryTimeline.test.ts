import { describe, expect, it } from "bun:test";
import {
  type HistoryEvent,
  sortHistoryEvents,
  toMillis,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentHistoryTimeline.helpers";

const makeEvent = (id: string, occurredAt: string | Date | null): HistoryEvent => ({
  id,
  kind: "PAYMENT_RECORDED",
  occurredAt,
  hoursDelta: null,
  notes: null,
});

describe("PaymentHistoryTimeline.helpers", () => {
  describe("toMillis", () => {
    it("returns epoch milliseconds for Date objects", () => {
      const d = new Date("2026-05-15T12:00:00Z");
      expect(toMillis(d)).toBe(d.getTime());
    });

    it("parses valid ISO date strings", () => {
      const iso = "2026-05-15T12:00:00Z";
      expect(toMillis(iso)).toBe(Date.parse(iso));
    });

    it("returns 0 for invalid strings", () => {
      expect(toMillis("invalid-date")).toBe(0);
    });

    it("returns 0 for null", () => {
      expect(toMillis(null)).toBe(0);
    });
  });

  describe("sortHistoryEvents", () => {
    it("returns an empty array for empty input", () => {
      expect(sortHistoryEvents([])).toEqual([]);
    });

    it("sorts events newest-first", () => {
      const events = [
        makeEvent("evt-1", "2026-01-01T10:00:00Z"),
        makeEvent("evt-2", new Date("2026-02-01T10:00:00Z")),
        makeEvent("evt-3", "2026-01-15T10:00:00Z"),
      ];

      const sorted = sortHistoryEvents(events);

      expect(sorted).toHaveLength(3);
      expect(sorted[0]?.id).toBe("evt-2");
      expect(sorted[1]?.id).toBe("evt-3");
      expect(sorted[2]?.id).toBe("evt-1");
    });

    it("places events without occurredAt last", () => {
      const events = [makeEvent("evt-null", null), makeEvent("evt-valid", "2026-01-01T10:00:00Z")];

      const sorted = sortHistoryEvents(events);
      expect(sorted[0]?.id).toBe("evt-valid");
      expect(sorted[1]?.id).toBe("evt-null");
    });

    it("does not mutate the input array", () => {
      const events = [makeEvent("evt-old", "2026-01-01T10:00:00Z"), makeEvent("evt-new", "2026-06-01T10:00:00Z")];
      const copy = [...events];

      sortHistoryEvents(events);

      expect(events).toEqual(copy);
    });
  });
});
