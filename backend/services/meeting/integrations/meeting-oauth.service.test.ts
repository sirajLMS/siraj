import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type {
  CreateAuditLogInput,
  IMeetingChannel,
  MeetingProviderTokenSelectType,
  UserSelectType,
} from "@/backend/types";
import { errorsEn } from "@/shared/locale/en/errors";

// ---------------------------------------------------------------------------
// Constants & Fakes
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "sess_abc123xyz";
const FAKE_ERRORS = errorsEn;
const JWT_SECRET = "test-jwt-secret-at-least-32-chars-long-123456";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// --- Env Config
await mock.module("@/backend/lib/env", () => ({
  getEnvironmentConfig: () => ({
    jwtSecret: JWT_SECRET,
    oauthRedirectBaseUrl: "https://app.example.com",
    nextPublicBaseUrl: "https://app.example.com",
  }),
}));

// --- PermissionsService
const hasPermissionMock = mock(async (): Promise<boolean> => true);

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
}));

// --- CacheService
const setNxMock = mock(async (_key: string, _value: string, _pxMs: number): Promise<string | null> => "OK");

await mock.module("@/backend/services/cache/CacheServiceFactory", () => ({
  cacheService: {
    setNx: setNxMock,
  },
}));

// --- MeetingChannelFactory & Adapter
function makeAdapterMock(): IMeetingChannel {
  return {
    validateConfig: mock(async () => true),
    disconnect: mock(async (): Promise<void> => undefined),
  };
}

let adapterMock = makeAdapterMock();

await mock.module("@/backend/services/meeting/channels/MeetingChannelFactory", () => ({
  getMeetingChannel: mock(async (): Promise<IMeetingChannel> => adapterMock),
  resetMeetingChannel: mock(async (): Promise<void> => undefined),
}));

// --- Repositories
const getByUserAndProviderMock = mock(async (): Promise<MeetingProviderTokenSelectType | null> => null);
const deleteByUserAndProviderMock = mock(async (): Promise<void> => undefined);
const listByUserMock = mock(async (): Promise<MeetingProviderTokenSelectType[]> => []);
const upsertMock = mock(async (input: unknown): Promise<MeetingProviderTokenSelectType> => {
  const inp = input as Partial<MeetingProviderTokenSelectType>;
  return {
    id: "token-1",
    userId: inp.userId ?? ACTOR_ID,
    providerSlug: inp.providerSlug ?? "zoom",
    accessToken: inp.accessToken ?? "at-123",
    refreshToken: inp.refreshToken ?? null,
    expiresAt: inp.expiresAt ?? null,
    scopes: inp.scopes ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

await mock.module("@/backend/db/repo/meeting/meeting-provider-token.repository", () => ({
  MeetingProviderTokenRepository: {
    getByUserAndProvider: getByUserAndProviderMock,
    deleteByUserAndProvider: deleteByUserAndProviderMock,
    listByUser: listByUserMock,
    upsert: upsertMock,
  },
}));

const userFindByIdMock = mock(async (_id: string): Promise<UserSelectType | null> => {
  return {
    id: ACTOR_ID,
    name: "Test User",
    email: "test@example.com",
  } as UserSelectType;
});

await mock.module("@/backend/db/repo/users/user.repository", () => ({
  UserRepository: {
    findById: userFindByIdMock,
  },
}));

// --- AuditService
const createManyAuditLogsMock = mock(
  async (_inputs: readonly CreateAuditLogInput[]): Promise<CreateAuditLogInput[]> => []
);

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: createManyAuditLogsMock,
  },
}));

// --- Token Exchange
const exchangeCodeForTokensMock = mock(async () => ({
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  scope: "user:read meeting:write",
}));

await mock.module("@/backend/services/meeting/integrations/meeting-oauth-token-exchange", () => ({
  exchangeCodeForTokens: exchangeCodeForTokensMock,
}));

// --- Logger
await mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

// ---------------------------------------------------------------------------
// Dynamic SUT loader
// ---------------------------------------------------------------------------

async function importService() {
  return import("@/backend/services/meeting/integrations/meeting-oauth.service");
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);

  setNxMock.mockReset();
  setNxMock.mockResolvedValue("OK");

  getByUserAndProviderMock.mockReset();
  getByUserAndProviderMock.mockResolvedValue(null);

  deleteByUserAndProviderMock.mockReset();
  deleteByUserAndProviderMock.mockResolvedValue(undefined);

  listByUserMock.mockReset();
  listByUserMock.mockResolvedValue([]);

  upsertMock.mockReset();
  upsertMock.mockImplementation(async (input: unknown) => {
    const inp = input as Partial<MeetingProviderTokenSelectType>;
    return {
      id: "token-1",
      userId: inp.userId ?? ACTOR_ID,
      providerSlug: inp.providerSlug ?? "zoom",
      accessToken: inp.accessToken ?? "at-123",
      refreshToken: inp.refreshToken ?? null,
      expiresAt: inp.expiresAt ?? null,
      scopes: inp.scopes ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  userFindByIdMock.mockReset();
  userFindByIdMock.mockResolvedValue({
    id: ACTOR_ID,
    name: "Test User",
    email: "test@example.com",
  } as UserSelectType);

  createManyAuditLogsMock.mockReset();
  createManyAuditLogsMock.mockResolvedValue([]);

  exchangeCodeForTokensMock.mockReset();
  exchangeCodeForTokensMock.mockResolvedValue({
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    scope: "user:read meeting:write",
  });

  adapterMock = makeAdapterMock();
});

afterEach(() => {
  // Do not call mock.restore() as it un-mocks module-level mocks in Bun
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MeetingOAuthService", () => {
  describe("connectProviderOAuth & verifyAndConsumeOAuthState", () => {
    test("connectProviderOAuth creates a valid state JWT that can be verified and consumed atomically", async () => {
      const { MeetingOAuthService, verifyAndConsumeOAuthState } = await importService();

      // Mock setNx behavior: return "OK" for both state claim key and consumed key on first call
      const cacheStore = new Set<string>();
      setNxMock.mockImplementation(async (key: string) => {
        if (cacheStore.has(key)) return null;
        cacheStore.add(key);
        return "OK";
      });

      const connectResult = await MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "zoom", returnPath: "/settings/meetings" },
        ACTOR_ID,
        SESSION_ID,
        FAKE_ERRORS
      );

      expect(connectResult.authorizeUrl).toContain("https://zoom.us/oauth/authorize");
      expect(connectResult.state).toBeTruthy();

      // First consumption call should succeed
      const verified = await verifyAndConsumeOAuthState(connectResult.state, SESSION_ID);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(ACTOR_ID);
      expect(verified?.providerSlug).toBe("zoom");
      expect(verified?.returnPath).toBe("/settings/meetings");
      expect(verified?.sessionId).toBe(SESSION_ID);
      expect(typeof verified?.nonce).toBe("string");
      expect(typeof verified?.codeVerifier).toBe("string");

      // Second consumption call (replay attack) should return null because setNx returns null
      const replayed = await verifyAndConsumeOAuthState(connectResult.state, SESSION_ID);
      expect(replayed).toBeNull();
    });

    test("verifyAndConsumeOAuthState returns null when setNx returns null (simulating nonce replay)", async () => {
      const { MeetingOAuthService, verifyAndConsumeOAuthState } = await importService();

      // First, get a valid state
      const connectResult = await MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "google_meet", returnPath: "/dashboard" },
        ACTOR_ID,
        SESSION_ID,
        FAKE_ERRORS
      );

      // Force setNx to return null when consumed key is checked
      setNxMock.mockImplementation(async (key: string) => {
        if (key.startsWith("oauth:nonce:consumed:")) {
          return null;
        }
        return "OK";
      });

      const result = await verifyAndConsumeOAuthState(connectResult.state, SESSION_ID);
      expect(result).toBeNull();
    });

    test("verifyAndConsumeOAuthState rejects session mismatch", async () => {
      const { MeetingOAuthService, verifyAndConsumeOAuthState } = await importService();

      const connectResult = await MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "zoom", returnPath: "/settings/meetings" },
        ACTOR_ID,
        SESSION_ID,
        FAKE_ERRORS
      );

      // Attempt to verify with a different session ID
      const result = await verifyAndConsumeOAuthState(connectResult.state, "different_session_id");
      expect(result).toBeNull();
    });

    test("verifyAndConsumeOAuthState rejects missing expectedSessionId", async () => {
      const { MeetingOAuthService, verifyAndConsumeOAuthState } = await importService();

      const connectResult = await MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "zoom", returnPath: "/settings/meetings" },
        ACTOR_ID,
        SESSION_ID,
        FAKE_ERRORS
      );

      const result = await verifyAndConsumeOAuthState(connectResult.state, undefined);
      expect(result).toBeNull();
    });

    test("verifyAndConsumeOAuthState rejects invalid/tampered JWT signature", async () => {
      const { verifyAndConsumeOAuthState } = await importService();

      const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature";
      const result = await verifyAndConsumeOAuthState(invalidToken, SESSION_ID);
      expect(result).toBeNull();
    });

    test("connectProviderOAuth throws error for unsafe returnPath", async () => {
      const { MeetingOAuthService } = await importService();

      await expect(
        MeetingOAuthService.connectProviderOAuth(
          { providerSlug: "zoom", returnPath: "https://evil-website.com" },
          ACTOR_ID,
          SESSION_ID,
          FAKE_ERRORS
        )
      ).rejects.toThrow();
    });

    test("connectProviderOAuth throws error when sessionId is missing", async () => {
      const { MeetingOAuthService } = await importService();

      await expect(
        MeetingOAuthService.connectProviderOAuth(
          { providerSlug: "zoom", returnPath: "/settings" },
          ACTOR_ID,
          undefined,
          FAKE_ERRORS
        )
      ).rejects.toThrow();
    });

    test("connectProviderOAuth throws error when user lacks permission", async () => {
      const { MeetingOAuthService } = await importService();

      hasPermissionMock.mockResolvedValue(false);

      await expect(
        MeetingOAuthService.connectProviderOAuth(
          { providerSlug: "zoom", returnPath: "/settings" },
          ACTOR_ID,
          SESSION_ID,
          FAKE_ERRORS
        )
      ).rejects.toThrow();
    });
  });

  describe("disconnectProviderOAuth", () => {
    test("successfully disconnects provider and revokes token", async () => {
      const { MeetingOAuthService } = await importService();

      getByUserAndProviderMock.mockResolvedValue({
        id: "t1",
        userId: ACTOR_ID,
        providerSlug: "zoom",
        accessToken: "at-val",
        refreshToken: "rt-val",
        expiresAt: null,
        scopes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await MeetingOAuthService.disconnectProviderOAuth({ providerSlug: "zoom" }, ACTOR_ID, FAKE_ERRORS);

      expect(result).toEqual({ ok: true, providerSlug: "zoom" });
      expect(deleteByUserAndProviderMock).toHaveBeenCalledWith(ACTOR_ID, "zoom");
      expect(createManyAuditLogsMock).toHaveBeenCalled();
    });
  });

  describe("listOwnConnectedProviders", () => {
    test("returns mapped connected providers for caller", async () => {
      const { MeetingOAuthService } = await importService();

      const created = new Date("2026-01-01");
      const expires = new Date("2026-12-31");
      listByUserMock.mockResolvedValue([
        {
          id: "t1",
          userId: ACTOR_ID,
          providerSlug: "zoom",
          accessToken: "at",
          refreshToken: null,
          expiresAt: expires,
          scopes: [],
          createdAt: created,
          updatedAt: created,
        },
      ]);

      const result = await MeetingOAuthService.listOwnConnectedProviders(ACTOR_ID, FAKE_ERRORS);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        providerSlug: "zoom",
        email: "test@example.com",
        connectedAt: created,
        expiresAt: expires,
      });
    });
  });

  describe("exchangeAndPersistTokens", () => {
    test("exchanges authorization code and persists tokens", async () => {
      const { MeetingOAuthService } = await importService();

      const cfg = {
        providerSlug: "zoom" as const,
        clientId: "client-123",
        clientSecret: "secret-123",
      };

      const result = await MeetingOAuthService.exchangeAndPersistTokens(
        cfg,
        ACTOR_ID,
        "auth-code-123",
        "https://app.example.com/api/oauth/zoom/callback",
        "code-verifier-123"
      );

      expect(exchangeCodeForTokensMock).toHaveBeenCalledWith(
        cfg,
        "auth-code-123",
        "https://app.example.com/api/oauth/zoom/callback",
        "code-verifier-123"
      );
      expect(upsertMock).toHaveBeenCalled();
      expect(result.userId).toBe(ACTOR_ID);
      expect(result.providerSlug).toBe("zoom");
    });
  });
});
