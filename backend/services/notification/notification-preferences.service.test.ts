import { describe, expect, test } from "bun:test";
import { NotificationChannel, NotificationEventType } from "@/backend/enum";

describe("NotificationPreferencesService", () => {
  test("channel and event enums produce the expected preference matrix size", () => {
    const channelCount = Object.values(NotificationChannel).length;
    const eventCount = Object.values(NotificationEventType).length;

    expect(channelCount * eventCount).toBe(32);
  });
});
