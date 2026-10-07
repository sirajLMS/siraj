import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { GraphQLError } from "graphql";
import type {
  ConnectMeetingProviderOAuthSubmitInput,
  CreateAuditLogInput,
  DisconnectMeetingProviderOAuthSubmitInput,
  MeetingProviderTokenSelectType,
  UserSelectType,
} from "@/backend/types";
import { errorsEn } from "@/shared/locale/en/errors";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "sess-12345-abcde";
const FAKE_ERRORS = errorsEn;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// --- PermissionsService
const hasPermissionMock = mock(async (): Promise<boolean> => true);

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
}));

// --- CacheService
const setNxMock = mock(async (_key: string, _value: string, _ttlMs?: number): Promise<string | null> => "OK");

await mock.module("@/backend/services/cache/CacheServiceFactory", () => ({
  cacheService: {
    setNx: setNxMock,
  },
}));

// --- Env Config
await mock.module("@/backend/lib/env", () => ({
  getEnvironmentConfig: () => ({
    jwtSecret: "test-jwt-secret-at-least-32-bytes-long!!",
    oauthRedirectBaseUrl: "https://app.example.com",
    nextPublicBaseUrl: "https://app.example.com",
  }),
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

// --- Repositories
const listByUserMock = mock(async (): Promise<MeetingProviderTokenSelectType[]> => []);
const getByUserAndProviderMock = mock(async (): Promise<MeetingProviderTokenSelectType | null> => null);
const deleteByUserAndProviderMock = mock(async (): Promise<void> => undefined);
const upsertMock = mock(async (input: any): Promise<MeetingProviderTokenSelectType> => ({
  id: "token-id-1",
  userId: input.userId,
  providerSlug: input.providerSlug,
  accessToken: input.accessToken,
  refreshToken: input.refreshToken,
  expiresAt: input.expiresAt,
  scopes: input.scopes,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

await mock.module("@/backend/db/repo/meeting/meeting-provider-token.repository", () => ({
  MeetingProviderTokenRepository: {
    listByUser: listByUserMock,
    getByUserAndProvider: getByUserAndProviderMock,
    deleteByUserAndProvider: deleteByUserAndProviderMock,
    upsert: upsertMock,
  },
}));

const userFindByIdMock = mock(async (_id: string): Promise<UserSelectType | null> => null);

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

// --- MeetingChannelFactory
const disconnectAdapterMock = mock(async (): Promise<void> => undefined);
await mock.module("@/backend/services/meeting/channels/MeetingChannelFactory", () => ({
  getMeetingChannel: mock(async () => ({
    disconnect: disconnectAdapterMock,
  })),
}));

// --- Meeting OAuth Token Exchange
await mock.module("@/backend/services/meeting/integrations/meeting-oauth-token-exchange", () => ({
  exchangeCodeForTokens: mock(async () => ({
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    scope: "read write",
  })),
}));

// ---------------------------------------------------------------------------
// SUT — deferred import so mocks are registered first.
// ---------------------------------------------------------------------------

async function importOAuthModule() {
  return import("@/backend/services/meeting/integrations/meeting-oauth.service");
}

// ---------------------------------------------------------------------------
// Reset helpers
// ---------------------------------------------------------------------------

function resetMocks(): void {
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);

  setNxMock.mockReset();
  setNxMock.mockResolvedValue("OK");

  listByUserMock.mockReset();
  listByUserMock.mockResolvedValue([]);

  getByUserAndProviderMock.mockReset();
  getByUserAndProviderMock.mockResolvedValue(null);

  deleteByUserAndProviderMock.mockReset();
  deleteByUserAndProviderMock.mockResolvedValue(undefined);

  upsertMock.mockReset();
  upsertMock.mockImplementation(async (input: any) => ({
    id: "token-id-1",
    userId: input.userId,
    providerSlug: input.providerSlug,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: input.expiresAt,
    scopes: input.scopes,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  userFindByIdMock.mockReset();
  userFindByIdMock.mockResolvedValue(null);

  createManyAuditLogsMock.mockReset();
  createManyAuditLogsMock.mockResolvedValue([]);

  disconnectAdapterMock.mockReset();
  disconnectAdapterMock.mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  mock.restore();
});

describe("MeetingOAuthService", () => {
  describe("connectProviderOAuth & Nonce Cache Claiming", () => {
    test("claims the nonce in cache using setNx with oauth:nonce:<nonce> key and 600,000ms (10m) TTL", async () => {
      const { MeetingOAuthService } = await importOAuthModule();

      const input: ConnectMeetingProviderOAuthSubmitInput = {
        providerSlug: "zoom",
        returnPath: "/dashboard/settings",
      };

      const result = await MeetingOAuthService.connectProviderOAuth(input, ACTOR_ID, SESSION_ID, FAKE_ERRORS);

      expect(result.state).toBeDefined();
      expect(result.authorizeUrl).toContain("https://zoom.us/oauth/authorize");

      // Verify setNx was called for the initial nonce claim
      expect(setNxMock).toHaveBeenCalledTimes(1);
      const [claimedKey, claimedValue, ttlMs] = setNxMock.mock.calls[0];

      expect(claimedKey).toMatch(/^oauth:nonce:[a-f0-9-]+$/);
      expect(claimedValue).toBe("1");
      expect(ttlMs).toBe(10 * 60 * 1000); // OAUTH_STATE_NONCE_TTL_MS
    });

    test("throws GraphQLError oauthStateCollision if cacheService.setNx returns null for nonce key", async () => {
      const { MeetingOAuthService } = await importOAuthModule();

      // Mock setNx returning null (key already exists, collision)
      setNxMock.mockResolvedValue(null);

      const input: ConnectMeetingProviderOAuthSubmitInput = {
        providerSlug: "zoom",
        returnPath: "/dashboard/settings",
      };

      let error: unknown = null;
      try {
        await MeetingOAuthService.connectProviderOAuth(input, ACTOR_ID, SESSION_ID, FAKE_ERRORS);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).message).toBe("oauthStateCollision");
    });

    test("throws GraphQLError if returnPath is unsafe", async () => {
      const { MeetingOAuthService } = await importOAuthModule();

      const input: ConnectMeetingProviderOAuthSubmitInput = {
        providerSlug: "zoom",
        returnPath: "https://evil.com/redirect",
      };

      let error: unknown = null;
      try {
        await MeetingOAuthService.connectProviderOAuth(input, ACTOR_ID, SESSION_ID, FAKE_ERRORS);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).message).toBe(FAKE_ERRORS.meetingProvider.invalidReturnPath);
    });

    test("throws GraphQLError if sessionId is missing", async () => {
      const { MeetingOAuthService } = await importOAuthModule();

      const input: ConnectMeetingProviderOAuthSubmitInput = {
        providerSlug: "zoom",
        returnPath: "/dashboard/settings",
      };

      let error: unknown = null;
      try {
        await MeetingOAuthService.connectProviderOAuth(input, ACTOR_ID, undefined, FAKE_ERRORS);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).message).toBe(FAKE_ERRORS.unauthorizedAction);
    });
  });

  describe("verifyAndConsumeOAuthState", () => {
    test("verifies valid state and atomically consumes nonce with setNx", async () => {
      const { MeetingOAuthService, verifyAndConsumeOAuthState } = await importOAuthModule();

      const input: ConnectMeetingProviderOAuthSubmitInput = {
        providerSlug: "zoom",
        returnPath: "/dashboard/settings",
      };

      const { state } = await MeetingOAuthService.connectProviderOAuth(input, ACTOR_ID, SESSION_ID, FAKE_ERRORS);

      setNxMock.mockReset();
      setNxMock.mockResolvedValue("OK"); // consumed-marker setNx succeeds

      const verified = await verifyAndConsumeOAuthState(state, SESSION_ID);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(ACTOR_ID);
      expect(verified?.providerSlug).toBe("zoom");
      expect(verified?.returnPath).toBe("/dashboard/settings");
      expect(verified?.sessionId).toBe(SESSION_ID);
      expect(verified?.codeVerifier).toBeDefined();

      // Check consumed setNx call
      expect(setNxMock).toHaveBeenCalledTimes(1);
      const [consumedKey, consumedVal, ttlMs] = setNxMock.mock.calls[0];
      expect(consumedKey).toMatch(/^oauth:nonce:consumed:[a-f0-9-]+$/);
      expect(consumedVal).toBe("1");
      expect(ttlMs).toBe(10 * 60 * 1000);
    });

    test("rejects state if session ID mismatches", async () => {
      const { MeetingOAuthService, verifyAndConsumeOAuthState } = await importOAuthModule();

      const { state } = await MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "zoom", returnPath: "/dashboard" },
        ACTOR_ID,
        SESSION_ID,
        FAKE_ERRORS
      );

      const verified = await verifyAndConsumeOAuthState(state, "different-session-id");
      expect(verified).toBeNull();
    });

    test("rejects state on replay if consumed setNx returns null", async () => {
      const { MeetingOAuthService, verifyAndConsumeOAuthState } = await importOAuthModule();

      const { state } = await MeetingOAuthService.connectProviderOAuth(
        { providerSlug: "zoom", returnPath: "/dashboard" },
        ACTOR_ID,
        SESSION_ID,
        FAKE_ERRORS
      );

      setNxMock.mockReset();
      setNxMock.mockResolvedValue(null); // Already consumed replay!

      const verified = await verifyAndConsumeOAuthState(state, SESSION_ID);
      expect(verified).toBeNull();
    });

    test("rejects malformed or invalid JWT state", async () => {
      const { verifyAndConsumeOAuthState } = await importOAuthModule();

      const verified = await verifyAndConsumeOAuthState("invalid.jwt.token", SESSION_ID);
      expect(verified).toBeNull();
    });
  });

  describe("disconnectProviderOAuth", () => {
    test("revokes token, deletes DB record, and logs audit", async () => {
      const { MeetingOAuthService } = await importOAuthModule();

      getByUserAndProviderMock.mockResolvedValue({
        id: "tok-1",
        userId: ACTOR_ID,
        providerSlug: "zoom",
        accessToken: "access-123",
        refreshToken: "refresh-123",
        expiresAt: new Date(),
        scopes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input: DisconnectMeetingProviderOAuthSubmitInput = { providerSlug: "zoom" };
      const res = await MeetingOAuthService.disconnectProviderOAuth(input, ACTOR_ID, FAKE_ERRORS);

      expect(res.ok).toBe(true);
      expect(res.providerSlug).toBe("zoom");
      expect(deleteByUserAndProviderMock).toHaveBeenCalledWith(ACTOR_ID, "zoom");
      expect(disconnectAdapterMock).toHaveBeenCalledWith({ accessToken: "access-123", refreshToken: "refresh-123" });
      expect(createManyAuditLogsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("listOwnConnectedProviders", () => {
    test("lists providers for caller", async () => {
      const { MeetingOAuthService } = await importOAuthModule();

      const now = new Date();
      listByUserMock.mockResolvedValue([
        {
          id: "tok-1",
          userId: ACTOR_ID,
          providerSlug: "zoom",
          accessToken: "access",
          refreshToken: null,
          expiresAt: null,
          scopes: [],
          createdAt: now,
          updatedAt: now,
        },
      ]);
      userFindByIdMock.mockResolvedValue({
        id: ACTOR_ID,
        email: "actor@example.com",
      } as any);

      const result = await MeetingOAuthService.listOwnConnectedProviders(ACTOR_ID, FAKE_ERRORS);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        providerSlug: "zoom",
        email: "actor@example.com",
        connectedAt: now,
        expiresAt: null,
      });
    });
  });
});
