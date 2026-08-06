import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting/meeting-provider-token.repository";
import {
  NoAppAccessPolicyError,
  NoOrgCredentialsNoUserTokenError,
  ProviderReauthRequiredError,
  RateLimitedError,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import { MicrosoftTeamsAdapter } from "@/backend/services/meeting/channels/microsoft-teams/MicrosoftTeamsAdapter";
import * as tokenRefreshModule from "@/backend/services/meeting/integrations/token-refresh";
import type { MeetingProviderTokenSelectType } from "@/backend/types";

const VALID_OPTS = {
  tenantId: "test-tenant-id",
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  organizerUserId: "organizer@org.com",
};

const MOCK_TOKEN_RESPONSE = {
  token_type: "Bearer",
  expires_in: 3599,
  access_token: "mock-teams-access-token",
};

const MOCK_MEETING_RESPONSE = {
  id: "MSpmYzNmZTcxLT",
  joinWebUrl: "https://teams.microsoft.com/l/meetup-join/abc",
  subject: "Test Meeting",
  startDateTime: "2026-08-15T10:00:00Z",
  endDateTime: "2026-08-15T11:00:00Z",
  joinMeetingIdSettings: {
    joinMeetingId: "123456789",
    passcode: "abc123",
  },
};

function createMockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MicrosoftTeamsAdapter", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    if (fetchSpy) fetchSpy.mockRestore();
  });

  describe("validateConfig", () => {
    test("returns false when credentials are missing", async () => {
      const adapter = new MicrosoftTeamsAdapter({});
      expect(await adapter.validateConfig()).toBe(false);
    });

    test("returns false when organizerUserId is missing", async () => {
      const adapter = new MicrosoftTeamsAdapter({
        tenantId: "t",
        clientId: "c",
        clientSecret: "s",
      });
      expect(await adapter.validateConfig()).toBe(false);
    });

    test("returns true when all config is present", async () => {
      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      expect(await adapter.validateConfig()).toBe(true);
    });
  });

  describe("generateMeeting", () => {
    beforeEach(() => {
      fetchSpy = spyOn(globalThis, "fetch");
    });

    test("throws NoOrgCredentialsNoUserTokenError when credentials missing", async () => {
      const adapter = new MicrosoftTeamsAdapter({});
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(NoOrgCredentialsNoUserTokenError);
    });

    test("creates a meeting successfully", async () => {
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE));
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));

      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      const result = await adapter.generateMeeting({
        topic: "Test Meeting",
        startDateTime: "2026-08-15T10:00:00Z",
        durationMinutes: 60,
      });

      expect(result.joinUrl).toBe(MOCK_MEETING_RESPONSE.joinWebUrl);
      expect(result.meetingId).toBe(MOCK_MEETING_RESPONSE.id);
      expect(result.password).toBe("abc123");
      expect(result.providerMetadata.onlineMeetingId).toBe(MOCK_MEETING_RESPONSE.id);
      expect(result.providerMetadata.joinMeetingId).toBe("123456789");
    });

    test("caches token across multiple calls", async () => {
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE));
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));

      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      await adapter.generateMeeting({ topic: "Meeting 1" });
      await adapter.generateMeeting({ topic: "Meeting 2" });

      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    test("throws RateLimitedError on 429 token response", async () => {
      fetchSpy.mockResolvedValue(new Response(null, { status: 429 }));

      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(RateLimitedError);
    });

    test("throws NoAppAccessPolicyError on 403 with access policy message", async () => {
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE));
      fetchSpy.mockResolvedValueOnce(
        createMockResponse(
          { error: { code: "Forbidden", message: "No application access policy found for this app" } },
          403
        )
      );

      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(NoAppAccessPolicyError);
    });

    test("throws RateLimitedError on 429 meeting response", async () => {
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE));
      fetchSpy.mockResolvedValueOnce(new Response(null, { status: 429 }));

      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(RateLimitedError);
    });

    test("throws MicrosoftTeamsApiError on non-ok meeting response", async () => {
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE));
      fetchSpy.mockResolvedValueOnce(
        createMockResponse({ error: { code: "BadRequest", message: "Invalid subject" } }, 400)
      );

      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow();
    });

    test("retries on 5xx then succeeds", async () => {
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE));
      fetchSpy.mockResolvedValueOnce(createMockResponse({ error: { message: "Server error" } }, 500));
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));

      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      const result = await adapter.generateMeeting({ topic: "Test" });
      expect(result.joinUrl).toBe(MOCK_MEETING_RESPONSE.joinWebUrl);
    });

    test("uses default duration when not provided", async () => {
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE));
      fetchSpy.mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));

      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      const result = await adapter.generateMeeting({ topic: "Test" });
      expect(result.joinUrl).toBe(MOCK_MEETING_RESPONSE.joinWebUrl);
    });

    test("throws ProviderUnavailableError on network error", async () => {
      fetchSpy.mockRejectedValue(new Error("Network error"));

      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow();
    });
  });

  describe("disconnect", () => {
    test("clears cached token", async () => {
      const adapter = new MicrosoftTeamsAdapter(VALID_OPTS);
      await adapter.disconnect();
      expect(await adapter.validateConfig()).toBe(true);
    });
  });

  describe("generateMeeting with per-user fallback", () => {
    const MOCK_TOKEN_ROW: Partial<MeetingProviderTokenSelectType> = {
      userId: "user-123",
      providerSlug: "microsoft_teams",
      refreshToken: "stored-refresh-token",
      accessToken: "old-access-token",
      scopes: ["https://graph.microsoft.com/OnlineMeetings.ReadWrite"],
    };

    function mockTokenRepo(tokenRow: Partial<MeetingProviderTokenSelectType> | null) {
      spyOn(MeetingProviderTokenRepository, "getByUserAndProvider").mockResolvedValue(
        tokenRow as MeetingProviderTokenSelectType | null
      );
      spyOn(MeetingProviderTokenRepository, "upsert").mockResolvedValue(
        (tokenRow ?? MOCK_TOKEN_ROW) as MeetingProviderTokenSelectType
      );
    }

    afterEach(() => {
      (tokenRefreshModule.refreshAccessToken as unknown as { mockRestore?: () => void })?.mockRestore?.();
    });

    test("uses per-user token when org creds missing and actorUserId provided", async () => {
      mockTokenRepo(MOCK_TOKEN_ROW);
      const refreshSpy = spyOn(tokenRefreshModule, "refreshAccessToken").mockResolvedValue({
        accessToken: "refreshed-teams-token",
        refreshToken: "new-refresh-token",
        expiresAt: new Date(Date.now() + 3600000),
      });

      fetchSpy.mockRestore();
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));

      const adapter = new MicrosoftTeamsAdapter({});
      const result = await adapter.generateMeeting({
        topic: "Test Meeting",
        actorUserId: "user-123",
      });

      expect(result.joinUrl).toBe(MOCK_MEETING_RESPONSE.joinWebUrl);
      expect(refreshSpy).toHaveBeenCalledWith("microsoft_teams", "stored-refresh-token", "user-123");

      const meetingCall = fetchSpy.mock.calls.find((call: Parameters<typeof fetch>) =>
        (call[0] as string).includes("/onlineMeetings")
      );
      expect(meetingCall?.[0]).toContain("/me/onlineMeetings");
      expect(meetingCall?.[0]).not.toContain("/users/me/");
    });

    test("throws NoOrgCredentialsNoUserTokenError when no token row and no org creds", async () => {
      mockTokenRepo(null);
      const refreshSpy = spyOn(tokenRefreshModule, "refreshAccessToken");

      const adapter = new MicrosoftTeamsAdapter({});
      return expect(adapter.generateMeeting({ topic: "Test", actorUserId: "user-123" })).rejects.toThrow(
        NoOrgCredentialsNoUserTokenError
      ).then(() => {
        expect(refreshSpy).not.toHaveBeenCalled();
      });
    });

    test("throws ProviderReauthRequiredError when refresh token is invalid_grant", async () => {
      mockTokenRepo(MOCK_TOKEN_ROW);
      spyOn(tokenRefreshModule, "refreshAccessToken").mockRejectedValue(
        new ProviderReauthRequiredError("microsoft_teams", "user-123", "invalid_grant")
      );

      const adapter = new MicrosoftTeamsAdapter({});
      return expect(adapter.generateMeeting({ topic: "Test", actorUserId: "user-123" })).rejects.toThrow(
        ProviderReauthRequiredError
      );
    });
  });
});
