import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { MeetingChannelError } from "@/backend/services/meeting/channels/IMeetingChannel";
import * as MeetingChannelFactory from "@/backend/services/meeting/channels/MeetingChannelFactory";
import { isMeetingChannelError, maybeGenerateUrl } from "@/backend/services/meeting/utils/maybe-generate-url";
import type { MeetingConfigDetails, MeetingProviderKind, MeetingProviderSelectType } from "@/backend/types";

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

const baseDetails: MeetingConfigDetails = { meetingUrl: undefined };

function mockGenerateMeeting(joinUrl: string, providerMetadata: Record<string, unknown> = {}) {
  return spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockResolvedValue({
    joinUrl,
    providerMetadata,
  });
}

async function runMaybeGenerateUrl(
  meetingUrl: string | undefined | null,
  topic = "Test",
  providerKind: MeetingProviderKind = "zoom_oauth"
) {
  const provider = buildProvider({ providerKind });
  const details: MeetingConfigDetails = { meetingUrl };
  return { provider, result: await maybeGenerateUrl(provider, details, { topic }) };
}

describe("maybeGenerateUrl", () => {
  afterEach(() => {
    mock.restore();
  });

  test("manual provider — passthrough, no generation", async () => {
    const provider = buildProvider({ providerKind: "manual" });
    const details: MeetingConfigDetails = { meetingUrl: "https://zoom.us/j/123" };

    const result = await maybeGenerateUrl(provider, details, { topic: "Test" });

    expect(result.details.meetingUrl).toBe("https://zoom.us/j/123");
    expect(result.providerMetadata).toBeNull();
  });

  test("auto provider + blank meetingUrl — generates URL via adapter", async () => {
    const generateMeeting = mockGenerateMeeting("https://zoom.us/j/999", { id: "meeting-123" });

    const result = await maybeGenerateUrl(buildProvider({ providerKind: "zoom_oauth" }), baseDetails, {
      topic: "Test Meeting",
    });

    expect(generateMeeting).toHaveBeenCalledTimes(1);
    expect(generateMeeting).toHaveBeenCalledWith("zoom_oauth", expect.objectContaining({ topic: "Test Meeting" }));
    expect(result.details.meetingUrl).toBe("https://zoom.us/j/999");
    expect(result.providerMetadata).toEqual({ id: "meeting-123" });
  });

  test("auto provider + user-supplied meetingUrl — override, no generation", async () => {
    const generateMeeting = mockGenerateMeeting("https://zoom.us/j/999", { id: "meeting-123" });

    const { result } = await runMaybeGenerateUrl("https://zoom.us/j/custom");

    expect(generateMeeting).not.toHaveBeenCalled();
    expect(result.details.meetingUrl).toBe("https://zoom.us/j/custom");
    expect(result.providerMetadata).toBeNull();
  });

  test("auto provider + empty-string meetingUrl — generates URL", async () => {
    const generateMeeting = mockGenerateMeeting("https://zoom.us/j/generated");

    const { result } = await runMaybeGenerateUrl("");

    expect(generateMeeting).toHaveBeenCalledTimes(1);
    expect(result.details.meetingUrl).toBe("https://zoom.us/j/generated");
  });

  test("auto provider + null meetingUrl — generates URL", async () => {
    const generateMeeting = mockGenerateMeeting("https://zoom.us/j/generated");

    const { result } = await runMaybeGenerateUrl(null);

    expect(generateMeeting).toHaveBeenCalledTimes(1);
    expect(result.details.meetingUrl).toBe("https://zoom.us/j/generated");
  });

  test("propagates MeetingChannelError from adapter", async () => {
    const provider = buildProvider({ providerKind: "zoom_oauth" });
    const error = new MeetingChannelError("Rate limited", "RATE_LIMITED");
    spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockRejectedValue(error);

    // Await the call directly and assert the thrown error to avoid awaiting a non-Promise
    try {
      await maybeGenerateUrl(provider, baseDetails, { topic: "Test" });
      // Should not reach here
      throw new Error("Expected maybeGenerateUrl to reject with MeetingChannelError");
    } catch (err) {
      expect(err).toBeInstanceOf(MeetingChannelError);
      // Ensure message is preserved
      expect(err instanceof Error ? err.message : "").toBe("Rate limited");
    }
  });

  test("passes startDateTime and durationMinutes to adapter", async () => {
    const provider = buildProvider({ providerKind: "google_meet_oauth" });
    const generateMeeting = spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockResolvedValue({
      joinUrl: "https://meet.google.com/abc-defg-hij",
      providerMetadata: {},
    });

    await maybeGenerateUrl(provider, baseDetails, {
      topic: "Test",
      startDateTime: "2025-01-15T10:00:00Z",
      durationMinutes: 60,
      actorUserId: "user-123",
    });

    expect(generateMeeting).toHaveBeenCalledWith("google_meet_oauth", {
      topic: "Test",
      startDateTime: "2025-01-15T10:00:00Z",
      durationMinutes: 60,
      actorUserId: "user-123",
    });
  });
});

describe("isMeetingChannelError", () => {
  test("returns true for MeetingChannelError instance", () => {
    const error = new MeetingChannelError("test", "TEST");
    expect(isMeetingChannelError(error)).toBe(true);
  });

  test("returns false for generic Error", () => {
    const error = new Error("generic");
    expect(isMeetingChannelError(error)).toBe(false);
  });

  test("returns false for non-Error values", () => {
    expect(isMeetingChannelError("string")).toBe(false);
    expect(isMeetingChannelError(null)).toBe(false);
    expect(isMeetingChannelError(undefined)).toBe(false);
  });
});
