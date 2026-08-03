import { describe, expect, test } from "bun:test";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";

function buildProvider(overrides: Partial<MeetingProviderSelectType> = {}): MeetingProviderSelectType {
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
    providerKind: "manual",
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

  test("auto-generation provider (providerKind !== manual) does NOT require a URL", () => {
    const autoProvider = buildProvider({
      slug: "zoom",
      providerKind: "zoom_oauth",
      fieldSchema: { requiresMeetingUrl: false, supportsAutoGeneration: true },
    });

    const details = parseMeetingConfigDetails(autoProvider, {});
    expect(details.meetingUrl).toBeUndefined();
  });

  test("auto-generation provider accepts null meetingUrl", () => {
    const autoProvider = buildProvider({
      slug: "google-meet",
      providerKind: "google_meet_oauth",
      fieldSchema: { requiresMeetingUrl: false, supportsAutoGeneration: true },
    });

    const details = parseMeetingConfigDetails(autoProvider, { meetingUrl: null });
    expect(details.meetingUrl).toBeUndefined();
  });

  test("manual provider (providerKind === manual) REQUIRES a URL", () => {
    const manualProvider = buildProvider({
      slug: "zoom",
      providerKind: "manual",
      fieldSchema: { requiresMeetingUrl: true },
    });

    expect(() => parseMeetingConfigDetails(manualProvider, {})).toThrow();
  });

  test("manual provider rejects null meetingUrl", () => {
    const manualProvider = buildProvider({
      slug: "zoom",
      providerKind: "manual",
      fieldSchema: { requiresMeetingUrl: true },
    });

    expect(() => parseMeetingConfigDetails(manualProvider, { meetingUrl: null })).toThrow();
  });

  test("manual provider with supportsAutoGeneration flag still requires a URL", () => {
    // Even if fieldSchema.supportsAutoGeneration is true, a manual providerKind
    // must still require a URL — the bypass gates on providerKind, not the flag.
    const manualProvider = buildProvider({
      slug: "zoom",
      providerKind: "manual",
      fieldSchema: { requiresMeetingUrl: true, supportsAutoGeneration: true },
    });

    expect(() => parseMeetingConfigDetails(manualProvider, {})).toThrow();
  });

  test("auto-provider accepts user-supplied URL on a non-allowlisted host", () => {
    // Auto-generation providers bypass the URL allowlist (plan task 3.2) to be
    // tolerant of upstream host variations. The Zod .url() validation still
    // ensures it's a valid URL — but the host need not match the allowlist.
    const autoProvider = buildProvider({
      slug: "zoom",
      providerKind: "zoom_oauth",
      urlAllowlist: ["zoom.us", "*.zoom.us"],
      fieldSchema: { requiresMeetingUrl: false, supportsAutoGeneration: true },
    });

    const details = parseMeetingConfigDetails(autoProvider, {
      meetingUrl: "https://custom.example.com/meeting",
    });
    expect(details.meetingUrl).toBe("https://custom.example.com/meeting");
  });

  test("auto-provider still requires a valid URL format for user-supplied meetingUrl", () => {
    const autoProvider = buildProvider({
      slug: "zoom",
      providerKind: "zoom_oauth",
      urlAllowlist: ["zoom.us", "*.zoom.us"],
      fieldSchema: { requiresMeetingUrl: false, supportsAutoGeneration: true },
    });

    expect(() => parseMeetingConfigDetails(autoProvider, { meetingUrl: "not-a-valid-url" })).toThrow();
  });
});
