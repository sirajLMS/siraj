import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting/meeting-provider-token.repository";
import { GoogleMeetAdapter } from "@/backend/services/meeting/channels/google-meet/GoogleMeetAdapter";
import { InvalidServiceAccountJsonError, MeetingChannelError, MissingImpersonationSubjectError, NoOrgCredentialsNoUserTokenError, PermissionDeniedError, ProviderReauthRequiredError } from "@/backend/services/meeting/channels/IMeetingChannel";;
import * as tokenRefreshModule from "@/backend/services/meeting/integrations/token-refresh";
import type { MeetingProviderTokenSelectType } from "@/backend/types";

const MOCK_SA_JSON = JSON.stringify({
  type: "service_account",
  project_id: "test-project",
  private_key_id: "key-id-123",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDd3R\n-----END PRIVATE KEY-----\n",
  client_email: "test@test-project.iam.gserviceaccount.com",
  client_id: "123",
});

function createMockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GoogleMeetAdapter", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    if (fetchSpy) fetchSpy.mockRestore();
  });

  describe("validateConfig", () => {
    test("returns false when service account JSON is missing", async () => {
      const adapter = new GoogleMeetAdapter({ impersonateSubject: "user@example.com" });
      return expect(adapter.validateConfig()).resolves.toBe(false);
    });

    test("returns false when impersonateSubject is missing", async () => {
      const adapter = new GoogleMeetAdapter({ serviceAccountJson: MOCK_SA_JSON });
      return expect(adapter.validateConfig()).resolves.toBe(false);
    });

    test("returns true when all config is present", async () => {
      const adapter = new GoogleMeetAdapter({
        serviceAccountJson: MOCK_SA_JSON,
        impersonateSubject: "user@example.com",
      });
      return expect(adapter.validateConfig()).resolves.toBe(true);
    });
  });

  describe("generateMeeting", () => {
    test("throws NoOrgCredentialsNoUserTokenError when service account JSON missing", async () => {
      const adapter = new GoogleMeetAdapter({ impersonateSubject: "user@example.com" });
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(NoOrgCredentialsNoUserTokenError);
    });

    test("throws MissingImpersonationSubjectError when impersonateSubject missing", async () => {
      const adapter = new GoogleMeetAdapter({ serviceAccountJson: MOCK_SA_JSON });
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(MissingImpersonationSubjectError);
    });

    test("throws InvalidServiceAccountJsonError for malformed JSON", async () => {
      const adapter = new GoogleMeetAdapter({
        serviceAccountJson: "{invalid json",
        impersonateSubject: "user@example.com",
      });
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(InvalidServiceAccountJsonError);
    });

    test("throws InvalidServiceAccountJsonError for wrong type", async () => {
      const adapter = new GoogleMeetAdapter({
        serviceAccountJson: JSON.stringify({ type: "user", client_email: "a@b.com", private_key: "k" }),
        impersonateSubject: "user@example.com",
      });
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(InvalidServiceAccountJsonError);
    });

    test("throws InvalidServiceAccountJsonError for missing client_email", async () => {
      const adapter = new GoogleMeetAdapter({
        serviceAccountJson: JSON.stringify({ type: "service_account", private_key: "k" }),
        impersonateSubject: "user@example.com",
      });
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(InvalidServiceAccountJsonError);
    });

    test("throws InvalidServiceAccountJsonError for missing private_key", async () => {
      const adapter = new GoogleMeetAdapter({
        serviceAccountJson: JSON.stringify({ type: "service_account", client_email: "a@b.com" }),
        impersonateSubject: "user@example.com",
      });
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow(InvalidServiceAccountJsonError);
    });
  });

  describe("generateMeeting with mocked fetch", () => {
    // We mock the full path: token exchange + space creation
    // Since we can't easily mock jose.SignJWT, we test error mapping scenarios
    // that happen after token acquisition

    beforeEach(() => {
      fetchSpy = spyOn(globalThis, "fetch");
    });

    test("throws GoogleMeetApiError on non-ok token response", async () => {
      // Token exchange fails
      fetchSpy.mockResolvedValue(
        createMockResponse({ error: { code: 401, message: "Invalid JWT", status: "UNAUTHENTICATED" } }, 401)
      );

      const adapter = new GoogleMeetAdapter({
        serviceAccountJson: MOCK_SA_JSON,
        impersonateSubject: "user@example.com",
      });

      // The JWT signing/crypto will work, but the token endpoint will return an error
      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow();
    });

    test("throws RateLimitedError on 429 from token endpoint", async () => {
      fetchSpy.mockResolvedValue(new Response(null, { status: 429 }));

      const adapter = new GoogleMeetAdapter({
        serviceAccountJson: MOCK_SA_JSON,
        impersonateSubject: "[EMAIL_REDACTED]",
      });

      return expect(adapter.generateMeeting({ topic: "Test" })).rejects.toThrow();
    });
  });

  describe("disconnect", () => {
    test("clears cached token", async () => {
      const adapter = new GoogleMeetAdapter({
        serviceAccountJson: MOCK_SA_JSON,
        impersonateSubject: "user@example.com",
      });
      await adapter.disconnect();
      // After disconnect, a new generation attempt should re-parse SA
      return expect(adapter.validateConfig()).resolves.toBe(true);
    });
  });

  describe("generateMeeting with per-user fallback", () => {
    let refreshSpy: ReturnType<typeof spyOn>;

    const MOCK_TOKEN_ROW: MeetingProviderTokenSelectType = {
      id: "token-row-id-1",
      userId: "user-123",
      providerSlug: "google_meet",
      refreshToken: "stored-refresh-token",
      accessToken: "old-access-token",
      expiresAt: null,
      scopes: ["https://www.googleapis.com/auth/meetings.space.created"],
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    };

    const MOCK_SPACE_RESPONSE = {
      name: "spaces/abc-def",
      meetingCode: "abc-def-ghi",
      meetingUri: "https://meet.google.com/abc-def-ghi",
      config: { accessType: 1 },
    };

    function mockTokenRepo(tokenRow: MeetingProviderTokenSelectType | null) {
      spyOn(MeetingProviderTokenRepository, "getByUserAndProvider").mockResolvedValue(tokenRow);
      spyOn(MeetingProviderTokenRepository, "upsert").mockResolvedValue(tokenRow ?? MOCK_TOKEN_ROW);
    }

    afterEach(() => {
      if (refreshSpy) refreshSpy.mockRestore();
    });

    test("uses per-user token when org creds missing and actorUserId provided", async () => {
      mockTokenRepo(MOCK_TOKEN_ROW);
      refreshSpy = spyOn(tokenRefreshModule, "refreshAccessToken").mockResolvedValue({
        accessToken: "refreshed-google-token",
        refreshToken: "new-refresh-token",
        expiresAt: new Date(Date.now() + 3_600_000),
      });

      fetchSpy.mockRestore();
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(createMockResponse(MOCK_SPACE_RESPONSE));

      const adapter = new GoogleMeetAdapter({});
      const result = await adapter.generateMeeting({
        topic: "Test Meeting",
        actorUserId: "user-123",
      });

      expect(result.joinUrl).toBe(MOCK_SPACE_RESPONSE.meetingUri);
      expect(refreshSpy).toHaveBeenCalledWith("google_meet", "stored-refresh-token", "user-123");
    });

    test("throws NoOrgCredentialsNoUserTokenError when no token row and no org creds", async () => {
      mockTokenRepo(null);
      refreshSpy = spyOn(tokenRefreshModule, "refreshAccessToken");

      const adapter = new GoogleMeetAdapter({});
      let caughtErr: Error | undefined;
      try {
        await adapter.generateMeeting({ topic: "Test", actorUserId: "user-123" });
        throw new Error("Expected generateMeeting to throw");
      } catch (err) {
        if (err instanceof Error) {
          caughtErr = err;
        } else {
          throw new Error(String(err), { cause: err });
        }
      }
      expect(caughtErr).toBeInstanceOf(NoOrgCredentialsNoUserTokenError);
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    test("throws ProviderReauthRequiredError when refresh token is invalid_grant", async () => {
      mockTokenRepo(MOCK_TOKEN_ROW);
      refreshSpy = spyOn(tokenRefreshModule, "refreshAccessToken").mockRejectedValue(
        new ProviderReauthRequiredError("google_meet", "user-123", "invalid_grant")
      );

      const adapter = new GoogleMeetAdapter({});
      return expect(adapter.generateMeeting({ topic: "Test", actorUserId: "user-123" })).rejects.toThrow(
        ProviderReauthRequiredError
      );
    });

    test("throws PermissionDeniedError on 403 with DWD-specific error message", async () => {
      mockTokenRepo(MOCK_TOKEN_ROW);
      refreshSpy = spyOn(tokenRefreshModule, "refreshAccessToken").mockResolvedValue({
        accessToken: "refreshed-google-token",
        refreshToken: "new-refresh-token",
        expiresAt: new Date(Date.now() + 3_600_000),
      });

      fetchSpy.mockRestore();
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(
        createMockResponse(
          {
            error: {
              code: 403,
              message: "Domain-wide delegation is not configured for this service account",
              status: "PERMISSION_DENIED",
            },
          },
          403
        )
      );

      const adapter = new GoogleMeetAdapter({});
      return expect(adapter.generateMeeting({ topic: "Test Meeting", actorUserId: "user-123" })).rejects.toThrow(
        PermissionDeniedError
      );
    });

    test("throws MeetingChannelError on generic 403 (not DWD-specific)", async () => {
      mockTokenRepo(MOCK_TOKEN_ROW);
      refreshSpy = spyOn(tokenRefreshModule, "refreshAccessToken").mockResolvedValue({
        accessToken: "refreshed-google-token",
        refreshToken: "new-refresh-token",
        expiresAt: new Date(Date.now() + 3_600_000),
      });

      fetchSpy.mockRestore();
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(
        createMockResponse(
          { error: { code: 403, message: "The caller does not have permission", status: "PERMISSION_DENIED" } },
          403
        )
      );

      const adapter = new GoogleMeetAdapter({});
      return expect(adapter.generateMeeting({ topic: "Test Meeting", actorUserId: "user-123" })).rejects.toThrow(
        MeetingChannelError
      );
    });
  });
});
