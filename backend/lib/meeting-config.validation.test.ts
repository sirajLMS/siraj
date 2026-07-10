import { describe, expect, test } from "bun:test";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import type { MeetingProviderReturnType } from "@/backend/types/meeting/meeting-provider.types";

function buildProvider(overrides: Partial<MeetingProviderReturnType> = {}): MeetingProviderReturnType {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "zoom",
    name: { en: "Zoom", ar: "زووم" },
    description: null,
    instructions: null,
    urlAllowlist: ["zoom.us", "*.zoom.us"],
    urlExample: "https://zoom.us/j/123",
    logoUrl: null,
    fieldSchema: { requiresMeetingUrl: true, supportsPassword: true },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("parseMeetingConfigDetails", () => {
  test("accepts URL matching provider allowlist", () => {
    const provider = buildProvider();
    const details = parseMeetingConfigDetails(provider, {
      meetingUrl: "https://zoom.us/j/123456789",
    });
    expect(details.meetingUrl).toBe("https://zoom.us/j/123456789");
  });

  test("rejects URL when switching to a provider with a different allowlist", () => {
    const meetProvider = buildProvider({
      slug: "meet",
      urlAllowlist: ["meet.google.com"],
    });

    expect(() =>
      parseMeetingConfigDetails(meetProvider, {
        meetingUrl: "https://zoom.us/j/123456789",
      })
    ).toThrow();
  });
});
