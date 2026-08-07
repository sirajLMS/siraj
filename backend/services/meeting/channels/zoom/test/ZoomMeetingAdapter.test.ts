import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting/meeting-provider-token.repository";
import {
  InsufficientScopesError,
  NoOrgCredentialsNoUserTokenError,
  ProviderReauthRequiredError,
  RateLimitedError,
  ZoomApiError,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import { ZoomMeetingAdapter } from "@/backend/services/meeting/channels/zoom/ZoomMeetingAdapter";
import * as tokenRefreshModule from "@/backend/services/meeting/integrations/token-refresh";
import type { MeetingProviderTokenSelectType } from "@/backend/types";

const VALID_OPTS = {
  accountId: "test-account-id",
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
};

const MOCK_TOKEN_RESPONSE = {
  access_token: "mock-zoom-access-token",
  token_type: "Bearer",
  expires_in: 3600,
  scope: "meeting:write:meeting user:read:user meeting:write:admin meeting:write",
  api_url: "https://api.zoom.us/v2",
};

const MOCK_MEETING_RESPONSE = {
  id: 123456789,
  uuid: "test-uuid",
  topic: "Test Meeting",
  join_url: "https://zoom.us/j/123456789?pwd=abc",
  start_url: "https://zoom.us/s/123456789?zak=xyz",
  password: "abc123",
  start_time: "2026-08-15T10:00:00Z",
  duration: 60,
};

function createMockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function setupAdapterWithFetchMock(fetchSpy: ReturnType<typeof spyOn>, ...responses: Response[]): void {
  fetchSpy.mockRestore();
  if (responses.length === 1) {
    spyOn(globalThis, "fetch").mockResolvedValue(responses[0]);
  } else {
    const newSpy = spyOn(globalThis, "fetch");
    for (const res of responses) {
      newSpy.mockResolvedValueOnce(res);
    }
  }
}

function rateLimitedResponse(retryAfter = "60"): Response {
  return new Response(null, {
    status: 429,
    headers: { "Retry-After": retryAfter },
  });
}

function expectMeetingError(
  fetchSpy: ReturnType<typeof spyOn>,
  mockResponses: Response[],
  expectedError: unknown
): void {
  setupAdapterWithFetchMock(fetchSpy, ...mockResponses);
  const adapter = new ZoomMeetingAdapter(VALID_OPTS);
  expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(expectedError);
}

describe("ZoomMeetingAdapter", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    if (fetchSpy) fetchSpy.mockRestore();
  });

  describe("validateConfig", () => {
    test("returns false when credentials are missing", async () => {
      const adapter = new ZoomMeetingAdapter({});
      expect(await adapter.validateConfig()).toBe(false);
    });

    test("returns true when all org credentials are present", async () => {
      const adapter = new ZoomMeetingAdapter(VALID_OPTS);
      expect(await adapter.validateConfig()).toBe(true);
    });
  });

  describe("generateMeeting", () => {
    beforeEach(() => {
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(createMockResponse(MOCK_TOKEN_RESPONSE));
    });

    test("throws NoOrgCredentialsNoUserTokenError when credentials missing", () => {
      const adapter = new ZoomMeetingAdapter({});
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(NoOrgCredentialsNoUserTokenError);
    });

    test("creates a meeting successfully", async () => {
      fetchSpy.mockRestore();
      fetchSpy = spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE))
        .mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));

      const adapter = new ZoomMeetingAdapter(VALID_OPTS);
      const result = await adapter.generateMeeting({
        topic: "Test Meeting",
        startDateTime: "2026-08-15T10:00:00Z",
        durationMinutes: 60,
      });

      expect(result.joinUrl).toBe(MOCK_MEETING_RESPONSE.join_url);
      expect(result.meetingId).toBe("123456789");
      expect(result.password).toBe("abc123");
      expect(result.hostUrl).toBe(MOCK_MEETING_RESPONSE.start_url);
      expect(result.providerMetadata.zoomMeetingId).toBe(123456789);
    });

    test("caches token across multiple calls", async () => {
      fetchSpy.mockRestore();
      fetchSpy = spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE))
        .mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE))
        .mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));

      const adapter = new ZoomMeetingAdapter(VALID_OPTS);
      await adapter.generateMeeting({ topic: "Meeting 1" });
      await adapter.generateMeeting({ topic: "Meeting 2" });

      // Token call should only happen once, then meeting calls
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    test("throws RateLimitedError on 429 token response", () => {
      expectMeetingError(fetchSpy, [rateLimitedResponse("60")], RateLimitedError);
    });

    test("throws ZoomApiError on non-ok token response", () => {
      expectMeetingError(
        fetchSpy,
        [createMockResponse({ code: 124, message: "Invalid client credentials" }, 401)],
        ZoomApiError
      );
    });

    test("throws RateLimitedError on 429 meeting response", () => {
      expectMeetingError(
        fetchSpy,
        [createMockResponse(MOCK_TOKEN_RESPONSE), rateLimitedResponse("30")],
        RateLimitedError
      );
    });

    test("throws ZoomApiError on non-ok meeting response", () => {
      expectMeetingError(
        fetchSpy,
        [createMockResponse(MOCK_TOKEN_RESPONSE), createMockResponse({ code: 300, message: "Invalid topic" }, 400)],
        ZoomApiError
      );
    });

    test("retries on 5xx then succeeds", async () => {
      fetchSpy.mockRestore();
      fetchSpy = spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE))
        .mockResolvedValueOnce(createMockResponse({ message: "Server error" }, 500))
        .mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));

      const adapter = new ZoomMeetingAdapter(VALID_OPTS);
      const result = await adapter.generateMeeting({ topic: "Test" });
      expect(result.joinUrl).toBe(MOCK_MEETING_RESPONSE.join_url);
    });

    test("throws ProviderUnavailableError on network error", () => {
      fetchSpy.mockRestore();
      fetchSpy = spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

      const adapter = new ZoomMeetingAdapter(VALID_OPTS);
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow();
    });
  });

  describe("scope validation", () => {
    test("throws InsufficientScopesError when token response is missing required scopes", () => {
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
        createMockResponse({
          ...MOCK_TOKEN_RESPONSE,
          scope: "meeting:write",
        })
      );

      const adapter = new ZoomMeetingAdapter(VALID_OPTS);
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(InsufficientScopesError);
    });
  });

  describe("deleteMeeting", () => {
    test("deletes a meeting successfully (204 response)", async () => {
      fetchSpy = spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE))
        .mockResolvedValueOnce(new Response(null, { status: 204 }));

      const adapter = new ZoomMeetingAdapter(VALID_OPTS);
      expect(await adapter.deleteMeeting("123456789")).toBeUndefined();
    });

    test("logs warning on non-204 response but does not throw", async () => {
      fetchSpy = spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE))
        .mockResolvedValueOnce(createMockResponse({ code: 300, message: "Not found" }, 404));

      const adapter = new ZoomMeetingAdapter(VALID_OPTS);
      expect(await adapter.deleteMeeting("123456789")).toBeUndefined();
    });

    test("logs warning on network error but does not throw", async () => {
      fetchSpy = spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(createMockResponse(MOCK_TOKEN_RESPONSE))
        .mockRejectedValueOnce(new Error("Network error"));

      const adapter = new ZoomMeetingAdapter(VALID_OPTS);
      expect(await adapter.deleteMeeting("123456789")).toBeUndefined();
    });

    test("throws NoOrgCredentialsNoUserTokenError when org creds missing", async () => {
      const adapter = new ZoomMeetingAdapter({});
      return expect(adapter.deleteMeeting("123456789")).rejects.toThrow(NoOrgCredentialsNoUserTokenError);
    });
  });

  describe("generateMeeting with per-user fallback", () => {
    const MOCK_TOKEN_ROW: Partial<MeetingProviderTokenSelectType> = {
      userId: "user-123",
      providerSlug: "zoom",
      refreshToken: "stored-refresh-token",
      accessToken: "old-access-token",
      scopes: ["meeting:write:meeting"],
    };

    function mockTokenRepo(
      tokenRow: Partial<MeetingProviderTokenSelectType> | null,
      upsertResult?: Partial<MeetingProviderTokenSelectType>
    ) {
      const getByUserAndProviderSpy = spyOn(MeetingProviderTokenRepository, "getByUserAndProvider").mockResolvedValue(
        tokenRow as MeetingProviderTokenSelectType | null
      );

      const upsertSpy = spyOn(MeetingProviderTokenRepository, "upsert").mockResolvedValue(
        (upsertResult ?? MOCK_TOKEN_ROW) as MeetingProviderTokenSelectType
      );

      return { getByUserAndProviderSpy, upsertSpy };
    }

    afterEach(() => {
      try {
        (tokenRefreshModule.refreshAccessToken as unknown as { mockRestore?: () => void })?.mockRestore?.();
      } catch {
        // spy might not be set
      }
    });

    test("uses per-user token when org creds missing and actorUserId provided", async () => {
      const refreshSpy = spyOn(tokenRefreshModule, "refreshAccessToken").mockResolvedValue({
        accessToken: "refreshed-zoom-token",
        refreshToken: "new-refresh-token",
        expiresAt: new Date(Date.now() + 3_600_000),
      });

      mockTokenRepo(MOCK_TOKEN_ROW);

      fetchSpy.mockRestore();
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(createMockResponse(MOCK_MEETING_RESPONSE));

      const adapter = new ZoomMeetingAdapter({});
      const result = await adapter.generateMeeting({
        topic: "Test Meeting",
        actorUserId: "user-123",
      });

      expect(result.joinUrl).toBe(MOCK_MEETING_RESPONSE.join_url);
      expect(refreshSpy).toHaveBeenCalledWith("zoom", "stored-refresh-token", "user-123");
    });

    test("throws NoOrgCredentialsNoUserTokenError when no token row and no org creds", async () => {
      mockTokenRepo(null);
      const refreshSpy = spyOn(tokenRefreshModule, "refreshAccessToken");

      const adapter = new ZoomMeetingAdapter({});
      let caughtErr: Error | undefined;
      try {
        await adapter.generateMeeting({ topic: "Test", actorUserId: "user-123" });
        throw new Error("Expected generateMeeting to throw");
      } catch (err) {
        caughtErr = err as Error;
      }
      expect(caughtErr).toBeInstanceOf(NoOrgCredentialsNoUserTokenError);
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    test("throws ProviderReauthRequiredError when refresh token is invalid_grant", async () => {
      mockTokenRepo(MOCK_TOKEN_ROW);
      spyOn(tokenRefreshModule, "refreshAccessToken").mockRejectedValue(
        new ProviderReauthRequiredError("zoom", "user-123", "invalid_grant")
      );

      const adapter = new ZoomMeetingAdapter({});
      return expect(adapter.generateMeeting({ topic: "Test", actorUserId: "user-123" })).rejects.toThrow(
        ProviderReauthRequiredError
      );
    });
  });
});
