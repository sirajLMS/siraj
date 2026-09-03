import { describe, expect, test } from "bun:test";
import { computeHeartbeatMs, computeHeartbeatSeconds } from "@/backend/services/cron/cron-heartbeat.utils";

describe("cron-heartbeat.utils", () => {
  describe("computeHeartbeatSeconds", () => {
    test("computes heartbeat interval as timeoutSeconds / 4", () => {
      expect(computeHeartbeatSeconds(120)).toBe(30);
      expect(computeHeartbeatSeconds(40)).toBe(10);
      expect(computeHeartbeatSeconds(16)).toBe(4);
    });

    test("floors fractional results from division", () => {
      expect(computeHeartbeatSeconds(11)).toBe(2); // Math.floor(11 / 4) = 2
      expect(computeHeartbeatSeconds(5)).toBe(1);  // Math.floor(5 / 4) = 1
      expect(computeHeartbeatSeconds(7)).toBe(1);  // Math.floor(7 / 4) = 1
    });

    test("returns 0 for timeouts under 4 seconds", () => {
      expect(computeHeartbeatSeconds(0)).toBe(0);
      expect(computeHeartbeatSeconds(1)).toBe(0);
      expect(computeHeartbeatSeconds(2)).toBe(0);
      expect(computeHeartbeatSeconds(3)).toBe(0);
    });

    test("caps heartbeat at maximum of 60 seconds for timeouts >= 240 seconds", () => {
      expect(computeHeartbeatSeconds(240)).toBe(60);
      expect(computeHeartbeatSeconds(300)).toBe(60);
      expect(computeHeartbeatSeconds(1000)).toBe(60);
    });
  });

  describe("computeHeartbeatMs", () => {
    test("converts computed seconds to milliseconds", () => {
      expect(computeHeartbeatMs(120)).toBe(30_000);
      expect(computeHeartbeatMs(40)).toBe(10_000);
      expect(computeHeartbeatMs(16)).toBe(4_000);
    });

    test("floors fractional results when converting to milliseconds", () => {
      expect(computeHeartbeatMs(11)).toBe(2_000);
      expect(computeHeartbeatMs(5)).toBe(1_000);
    });

    test("returns 0ms for timeouts under 4 seconds", () => {
      expect(computeHeartbeatMs(0)).toBe(0);
      expect(computeHeartbeatMs(3)).toBe(0);
    });

    test("caps heartbeat at maximum of 60,000 milliseconds for timeouts >= 240 seconds", () => {
      expect(computeHeartbeatMs(240)).toBe(60_000);
      expect(computeHeartbeatMs(300)).toBe(60_000);
      expect(computeHeartbeatMs(3600)).toBe(60_000);
    });
  });
});
