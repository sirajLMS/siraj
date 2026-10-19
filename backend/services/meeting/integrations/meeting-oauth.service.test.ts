import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { GraphQLError } from "graphql";
import type { MeetingProviderTokenSelectType, OAuthCallbackConfig } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";
import { errorsEn } from "@/shared/locale/en/errors";

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID_A = "session-aaaa-1111-2222-3333";
const SESSION_ID_B = "session-bbbb-4444-5555-6666";
const DEFAULT_RETURN_PATH = "/dashboard/settings";
const FAKE_ERRORS: ErrorsLabels = errorsEn;

type OAuthServiceModule = typeof import("@/backend/services/meeting/integrations/meeting-oauth.service");

// ---------------------------------------------------------------------------
// In-memory cache mock to test setNx atomic key claiming & replay protection
// ---------------------------------------------------------------------------

const cacheStore = new Map<string, string>();

const setNxMock = mock(async (key: string, value: string, _ttlMs?: number): Promise<"OK" | null> => {
  if (cacheStore.has(key)) return null;
  cacheStore.set(key, value);
  return "OK";
});

await mock.module("@/backend/services/cache/CacheServiceFactory", () => ({
  cacheService: {
    setNx: setNxMock,
  },
}));

// ---------------------------------------------------------------------------
// Environment Config Mock
// ---------------------------------------------------------------------------

await mock.module("@/backend/lib/env", () => ({
  getEnvironmentConfig: () => ({
    jwtSecret: "test-jwt-secret-for-meeting-oauth-test-32bytes-long",
    nextPublicBaseUrl: "https://app.example.com",
    oauthRedirectBaseUrl: "https://app.example.com",
    zoomClientId: "zoom-client-id",
    googleMeetClientId: "google-client-id",
    msTeamsClientId: "ms-client-id",
  }),
  ensureEnvironmentValidated: () => ({}),
}));

// ---------------------------------------------------------------------------
// Permissions Service Mock
// ---------------------------------------------------------------------------

const hasPermissionMock = mock(async (): Promise<boolean> => true);

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
}));

// ---------------------------------------------------------------------------
// Repositories Mock
// ---------------------------------------------------------------------------

const getByUserAndProviderMock = mock(async (): Promise<unknown> => null);
const deleteByUserAndProviderMock = mock(async (): Promise<unknown> => undefined);
const listByUserMock = mock(async (): Promise<unknown[]> => []);
const upsertMock = mock(async (input: Record<string, unknown>) => ({
  id: "token-id-123",
  ...input,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

await mock.module("@/backend/db/repo/meeting/meeting-provider-token.repository", () => ({
  MeetingProviderTokenRepository: {
    getByUserAndProvider: getByUserAndProviderMock,
    deleteByUserAndProvider: deleteByUserAndProviderMock,
    listByUser: listByUserMock,
    upsert: upsertMock,
  },
}));

const findByIdMock = mock(async (id: string) => ({
  id,
  email: "teacher@example.com",
}));

await mock.module("@/backend/db/repo/users/user.repository", () => ({
  UserRepository: {
    findById: findByIdMock,
  },
}));

// ---------------------------------------------------------------------------
// Audit & Channel Mocks
// ---------------------------------------------------------------------------

const createManyAuditLogsMock = mock(async () => []);

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: createManyAuditLogsMock,
  },
}));

const adapterDisconnectMock = mock(async (): Promise<void> => undefined);

await mock.module("@/backend/services/meeting/channels/MeetingChannelFactory", () => ({
  getMeetingChannel: mock(async () => ({
    disconnect: adapterDisconnectMock,
  })),
}));

// ---------------------------------------------------------------------------
// Token Exchange Mock
// ---------------------------------------------------------------------------

const exchangeCodeForTokensMock = mock(async () => ({
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  scope: "meeting:write",
  token_type: "Bearer",
}));

await mock.module("@/backend/services/meeting/integrations/meeting-oauth-token-exchange", () => ({
  exchangeCodeForTokens: exchangeCodeForTokensMock,
}));

// ---------------------------------------------------------------------------
// Logger Mock
// ---------------------------------------------------------------------------

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

// ---------------------------------------------------------------------------
// Deferred Service Import
// ---------------------------------------------------------------------------

async function importOAuthService() {
  return import("@/backend/services/meeting/integrations/meeting-oauth.service");
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  cacheStore.clear();
  setNxMock.mockClear();
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);
  getByUserAndProviderMock.mockReset();
  getByUserAndProviderMock.mockResolvedValue(null);
  deleteByUserAndProviderMock.mockReset();
  deleteByUserAndProviderMock.mockResolvedValue(undefined);
  listByUserMock.mockReset();
  listByUserMock.mockResolvedValue([]);
  upsertMock.mockClear();
  findByIdMock.mockClear();
  createManyAuditLogsMock.mockClear();
  adapterDisconnectMock.mockClear();
  exchangeCodeForTokensMock.mockClear();
});

afterEach(() => {
  mock.restore();
});

// ---------------------------------------------------------------------------
// Shared Test Factories & Builders
// ---------------------------------------------------------------------------

function buildConnectInput(returnPath: string = DEFAULT_RETURN_PATH) {
  return { providerSlug: "zoom" as const, returnPath };
}

function buildProviderTokenRow(
  overrides: Partial<MeetingProviderTokenSelectType> = {}
): MeetingProviderTokenSelectType {
  const now = new Date();
  return {
    id: "tok-1",
    userId: ACTOR_ID,
    providerSlug: "zoom",
    accessToken: "acc-tok",
    refreshToken: "ref-tok",
    expiresAt: null,
    scopes: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function connectAndCatch(
  sessionId: string | undefined,
  returnPath: string = DEFAULT_RETURN_PATH
): Promise<unknown> {
  const { MeetingOAuthService } = await importOAuthService();
  try {
    await MeetingOAuthService.connectProviderOAuth(buildConnectInput(returnPath), ACTOR_ID, sessionId, FAKE_ERRORS);
  } catch (error) {
    return error;
  }
  return null;
}

async function expectConnectRejected(options: {
  sessionId: string | undefined;
  returnPath?: string;
  graphqlError: boolean;
  expectedMessage: string;
}): Promise<void> {
  const caught = await connectAndCatch(options.sessionId, options.returnPath);
  if (options.graphqlError) {
    expect(caught).toBeInstanceOf(GraphQLError);
    if (caught instanceof GraphQLError) {
      expect(caught.message).toBe(options.expectedMessage);
    }
    return;
  }
  expect(caught).toBeInstanceOf(Error);
  if (caught instanceof Error) {
    expect(caught.message).toBe(options.expectedMessage);
  }
}

async function mintStateWithVerifier(): Promise<{ state: string; service: OAuthServiceModule }> {
  const service = await importOAuthService();
  const { state } = await service.MeetingOAuthService.connectProviderOAuth(
    buildConnectInput(),
    ACTOR_ID,
    SESSION_ID_A,
    FAKE_ERRORS
  );
  return { state, service };
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe("MeetingOAuthService", () => {
  describe("connectProviderOAuth", () => {
    test("requires sessionId and throws GraphQLError when sessionId is undefined", async () => {
      await expectConnectRejected({
        sessionId: undefined,
        graphqlError: true,
        expectedMessage: FAKE_ERRORS.unauthorizedAction,
      });
    });

    test("requires sessionId and throws GraphQLError when sessionId is empty string", async () => {
      await expectConnectRejected({
        sessionId: "",
        graphqlError: true,
        expectedMessage: FAKE_ERRORS.unauthorizedAction,
      });
    });

    test("throws error if user lacks permission to manage own meeting configs", async () => {
      hasPermissionMock.mockResolvedValue(false);

      await expectConnectRejected({
        sessionId: SESSION_ID_A,
        graphqlError: false,
        expectedMessage: FAKE_ERRORS.unauthorizedAction,
      });
    });

    test("throws GraphQLError if returnPath is unsafe / absolute URL", async () => {
      await expectConnectRejected({
        sessionId: SESSION_ID_A,
        returnPath: "https://malicious.com/phishing",
        graphqlError: true,
        expectedMessage: FAKE_ERRORS.meetingProvider.invalidReturnPath,
      });
    });

    test("successfully mints state and returns authorizeUrl when sessionId is present", async () => {
      const { MeetingOAuthService } = await importOAuthService();

      const result = await MeetingOAuthService.connectProviderOAuth(
        buildConnectInput(),
        ACTOR_ID,
        SESSION_ID_A,
        FAKE_ERRORS
      );

      expect(result).toHaveProperty("state");
      expect(result).toHaveProperty("authorizeUrl");
      expect(typeof result.state).toBe("string");
      expect(result.authorizeUrl).toContain("https://zoom.us/oauth/authorize");
      expect(result.authorizeUrl).toContain(`state=${encodeURIComponent(result.state)}`);
      expect(result.authorizeUrl).toContain("code_challenge=");
    });
  });

  describe("verifyAndConsumeOAuthState & session binding", () => {
    test("verifies state when expectedSessionId matches the sessionId bound to state", async () => {
      const { state, service } = await mintStateWithVerifier();

      const verified = await service.verifyAndConsumeOAuthState(state, SESSION_ID_A);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(ACTOR_ID);
      expect(verified?.providerSlug).toBe("zoom");
      expect(verified?.returnPath).toBe(DEFAULT_RETURN_PATH);
      expect(verified?.sessionId).toBe(SESSION_ID_A);
      expect(typeof verified?.codeVerifier).toBe("string");
    });

    test("rejects state when expectedSessionId is undefined", async () => {
      const { state, service } = await mintStateWithVerifier();

      const verified = await service.verifyAndConsumeOAuthState(state, undefined);

      expect(verified).toBeNull();
    });

    test("rejects state when expectedSessionId does not match bound sessionId", async () => {
      const { state, service } = await mintStateWithVerifier();

      const verified = await service.verifyAndConsumeOAuthState(state, SESSION_ID_B);

      expect(verified).toBeNull();
    });

    test("enforces single-use / replay protection on state consumption", async () => {
      const { state, service } = await mintStateWithVerifier();

      const firstConsumer = await service.verifyAndConsumeOAuthState(state, SESSION_ID_A);
      expect(firstConsumer).not.toBeNull();

      const secondConsumer = await service.verifyAndConsumeOAuthState(state, SESSION_ID_A);
      expect(secondConsumer).toBeNull();
    });

    test("rejects tampered or invalid state strings", async () => {
      const { verifyAndConsumeOAuthState } = await importOAuthService();

      const verified = await verifyAndConsumeOAuthState("invalid.jwt.string", SESSION_ID_A);

      expect(verified).toBeNull();
    });
  });

  describe("disconnectProviderOAuth", () => {
    test("revokes token, calls adapter disconnect, deletes repo entry, and logs audit", async () => {
      const { MeetingOAuthService } = await importOAuthService();

      getByUserAndProviderMock.mockResolvedValueOnce(buildProviderTokenRow());

      const result = await MeetingOAuthService.disconnectProviderOAuth({ providerSlug: "zoom" }, ACTOR_ID, FAKE_ERRORS);

      expect(result).toEqual({ ok: true, providerSlug: "zoom" });
      expect(adapterDisconnectMock).toHaveBeenCalledWith({ accessToken: "acc-tok", refreshToken: "ref-tok" });
      expect(deleteByUserAndProviderMock).toHaveBeenCalledWith(ACTOR_ID, "zoom");
      expect(createManyAuditLogsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("listOwnConnectedProviders", () => {
    test("returns connected providers with caller's email", async () => {
      const { MeetingOAuthService } = await importOAuthService();

      listByUserMock.mockResolvedValueOnce([
        buildProviderTokenRow({
          accessToken: "acc",
          refreshToken: null,
          expiresAt: new Date("2026-12-31"),
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-01-01"),
        }),
      ]);

      const result = await MeetingOAuthService.listOwnConnectedProviders(ACTOR_ID, FAKE_ERRORS);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        providerSlug: "zoom",
        email: "teacher@example.com",
        connectedAt: new Date("2026-01-01"),
        expiresAt: new Date("2026-12-31"),
      });
    });
  });

  describe("exchangeAndPersistTokens", () => {
    test("exchanges code for tokens and upserts into database", async () => {
      const { MeetingOAuthService } = await importOAuthService();

      const cfg: OAuthCallbackConfig = {
        providerSlug: "zoom",
        displayName: "Zoom",
        buildTokenUrl: () => "https://zoom.us/oauth/token",
        resolveClientId: () => "zoom-client-id",
        resolveClientSecret: () => "zoom-client-secret",
      };

      const result = await MeetingOAuthService.exchangeAndPersistTokens(
        cfg,
        ACTOR_ID,
        "auth-code-123",
        "https://app.example.com/api/oauth/zoom/callback",
        "pkce-verifier-123"
      );

      expect(exchangeCodeForTokensMock).toHaveBeenCalledWith(
        cfg,
        "auth-code-123",
        "https://app.example.com/api/oauth/zoom/callback",
        "pkce-verifier-123"
      );

      expect(upsertMock).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty("id");
      expect(result.userId).toBe(ACTOR_ID);
      expect(result.accessToken).toBe("test-access-token");
    });
  });
});
