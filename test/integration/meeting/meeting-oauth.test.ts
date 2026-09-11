import { describe, expect, spyOn, test } from "bun:test";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { cacheService } from "@/backend/services/cache/CacheServiceFactory";
import {
  MeetingOAuthService,
  verifyAndConsumeOAuthState,
} from "@/backend/services/meeting/integrations/meeting-oauth.service";
import type { ErrorsLabels } from "@/shared/locale";

const mockTErrors = {
  unauthorizedAction: "unauthorizedAction",
  meetingProvider: {
    invalidReturnPath: "invalidReturnPath",
  },
} as unknown as ErrorsLabels;

describe("MeetingOAuthService and state verification", () => {
  test("connectProviderOAuth creates state and claims nonce in cache", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const setNxSpy = spyOn(cacheService, "setNx").mockResolvedValue("OK");

    const userId = "user-123";
    const sessionId = "session-abc";
    const returnPath = "/dashboard";

    const res = await MeetingOAuthService.connectProviderOAuth(
      { providerSlug: "zoom", returnPath },
      userId,
      sessionId,
      mockTErrors
    );

    expect(res.authorizeUrl).toContain("https://zoom.us/oauth/authorize");
    expect(res.state).toBeTruthy();

    expect(setNxSpy).toHaveBeenCalled();
    const setNxCalls = setNxSpy.mock.calls;
    const nonceCall = setNxCalls.find(call => (call[0] as string).startsWith("oauth:nonce:"));
    expect(nonceCall).toBeTruthy();
    expect(nonceCall?.[1]).toBe("1");

    setNxSpy.mockRestore();
  });

  test("connectProviderOAuth throws on nonce collision when cache setNx fails", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const setNxSpy = spyOn(cacheService, "setNx").mockResolvedValue(null);

    const userId = "user-123";
    const sessionId = "session-abc";

    await expect(
      MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "zoom", returnPath: "/dashboard" },
        userId,
        sessionId,
        mockTErrors
      )
    ).rejects.toThrow("oauthStateCollision");

    setNxSpy.mockRestore();
  });

  test("connectProviderOAuth validates returnPath", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);

    const userId = "user-123";
    const sessionId = "session-abc";

    await expect(
      MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "zoom", returnPath: "//evil.com" },
        userId,
        sessionId,
        mockTErrors
      )
    ).rejects.toThrow("invalidReturnPath");

    await expect(
      MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "zoom", returnPath: "/\\evil.com" },
        userId,
        sessionId,
        mockTErrors
      )
    ).rejects.toThrow("invalidReturnPath");
  });

  test("connectProviderOAuth requires sessionId", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);

    await expect(
      MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "zoom", returnPath: "/dashboard" },
        "user-123",
        undefined,
        mockTErrors
      )
    ).rejects.toThrow("unauthorizedAction");
  });

  test("verifyAndConsumeOAuthState validates session binding and single-use consume", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);

    // Allow setNx to succeed for both signing and consuming
    const setNxSpy = spyOn(cacheService, "setNx").mockResolvedValue("OK");

    const userId = "user-123";
    const sessionId = "session-abc";

    const { state } = await MeetingOAuthService.connectProviderOAuth(
      { providerSlug: "google_meet", returnPath: "/profile" },
      userId,
      sessionId,
      mockTErrors
    );

    // 1. Session mismatch should reject
    const mismatch = await verifyAndConsumeOAuthState(state, "wrong-session");
    expect(mismatch).toBeNull();

    // 2. Matching session should verify and consume state
    const payload = await verifyAndConsumeOAuthState(state, sessionId);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(userId);
    expect(payload?.providerSlug).toBe("google_meet");
    expect(payload?.returnPath).toBe("/profile");
    expect(payload?.sessionId).toBe(sessionId);

    // 3. Replay protection — second call to setNx returns null for consumed key
    setNxSpy.mockImplementation(async (key: string) => {
      if (key.startsWith("oauth:nonce:consumed:")) {
        return null;
      }
      return "OK";
    });

    const replayed = await verifyAndConsumeOAuthState(state, sessionId);
    expect(replayed).toBeNull();

    setNxSpy.mockRestore();
  });
});
