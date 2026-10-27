import { describe, expect, it } from "bun:test";
import {
  sortHistoryEvents,
  toMillis,
  type HistoryEvent,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentHistoryTimeline.helpers";

describe("PaymentHistoryTimeline.helpers", () => {
  describe("toMillis", () => {
    it("returns epoch milliseconds for Date object", () => {
      const d = new Date("2026-05-15T12:00:00Z");
      expect(toMillis(d)).toBe(d.getTime());
    });

    it("parses valid ISO date strings using Date.parse without creating Date objects", () => {
      const iso = "2026-05-15T12:00:00Z";
      expect(toMillis(iso)).toBe(Date.parse(iso));
    });

    it("returns numeric values directly if passed a number", () => {
      expect(toMillis(1700000000000 as unknown as string)).toBe(1700000000000);
    });

    it("returns 0 for invalid string, null, or undefined values", () => {
      expect(toMillis("invalid-date")).toBe(0);
      expect(toMillis(null)).toBe(0);
      expect(toMillis(undefined as unknown as string)).toBe(0);
    });
  });

  describe("sortHistoryEvents", () => {
    it("returns an empty array when input events list is empty", () => {
      expect(sortHistoryEvents([])).toEqual([]);
    });

    it("sorts history events in descending order (newest first)", () => {
      const events: HistoryEvent[] = [
        {
          id: "evt-1",
          kind: "PAYMENT_RECORDED",
          occurredAt: "2026-01-01T10:00:00Z",
          hoursDelta: "10",
          notes: "First payment",
        },
        {
          id: "evt-2",
          kind: "HOURS_CREDITED",
          occurredAt: new Date("2026-02-01T10:00:00Z"),
          hoursDelta: "5",
          notes: "Bonus hours",
        },
        {
          id: "evt-3",
          kind: "MARKED_PAID",
          occurredAt: "2026-01-15T10:00:00Z",
          hoursDelta: null,
          notes: null,
        },
      ];

      const sorted = sortHistoryEvents(events);

      expect(sorted).toHaveLength(3);
      expect(sorted[0].id).toBe("evt-2"); // Feb 1 (newest)
      expect(sorted[1].id).toBe("evt-3"); // Jan 15
      expect(sorted[2].id).toBe("evt-1"); // Jan 1 (oldest)
    });

    it("handles null or missing occurredAt gracefully by putting them at the end", () => {
      const events: HistoryEvent[] = [
        {
          id: "evt-null",
          kind: "PAYMENT_RECORDED",
          occurredAt: null,
          hoursDelta: null,
          notes: null,
        },
        {
          id: "evt-valid",
          kind: "HOURS_CREDITED",
          occurredAt: "2026-01-01T10:00:00Z",
          hoursDelta: "5",
          notes: null,
        },
      ];

      const sorted = sortHistoryEvents(events);
      expect(sorted[0].id).toBe("evt-valid");
      expect(sorted[1].id).toBe("evt-null");
    });
  });
});
