import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { AccountStatus } from "@/backend/enum/auth/auth.enum";
import {
  MeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountStatus,
} from "@/backend/enum/meeting/meeting-integrations.enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type {
  GenerateMeetingInput,
  GenerateMeetingResult,
  IMeetingChannel,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import type { CreateAuditLogInput, MeetingProviderTokenSelectType, UserSelectType } from "@/backend/types";
import { errorsEn } from "@/shared/locale/en/errors";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID_A = "22222222-2222-4222-8222-222222222222";
const USER_ID_B = "33333333-3333-4333-8333-333333333333";

// Use the real English locale object so the test exercises the same shape
// the service expects (ErrorsLabels) without an unsafe type assertion.
const FAKE_ERRORS = errorsEn;

// ---------------------------------------------------------------------------
// Mock adapter helpers
// ---------------------------------------------------------------------------

function makeAdapterMock(): IMeetingChannel {
  return {
    validateConfig: mock(async () => true),
    generateMeeting: mock(
      async (_input: GenerateMeetingInput): Promise<GenerateMeetingResult> => ({
        joinUrl: "https://test.example/j/123",
        meetingId: "test-meeting-id",
        providerMetadata: { test: true },
      })
    ),
    deleteMeeting: mock(async (_meetingId: string): Promise<void> => undefined),
    disconnect: mock(async (): Promise<void> => undefined),
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported so the mocked
// versions are seen by the service's own `import` statements.
// ---------------------------------------------------------------------------

// --- Adapter static ENDPOINTS (service reads these for listIntegrationProviders)
await mock.module("@/backend/services/meeting/channels/zoom/ZoomMeetingAdapter", () => ({
  ZoomMeetingAdapter: {
    ENDPOINTS: ["https://zoom.us/oauth/token", "https://api.zoom.us/v2/users/me", "https://api.zoom.us/v2/meetings"],
  },
}));

await mock.module("@/backend/services/meeting/channels/google-meet/GoogleMeetAdapter", () => ({
  GoogleMeetAdapter: {
    ENDPOINTS: [
      "https://oauth2.googleapis.com/token",
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://meet.googleapis.com/v2/spaces",
    ],
  },
}));

await mock.module("@/backend/services/meeting/channels/microsoft-teams/MicrosoftTeamsAdapter", () => ({
  MicrosoftTeamsAdapter: {
    ENDPOINTS: [
      "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
      "https://graph.microsoft.com/v1.0/users/{organizer}/onlineMeetings",
      "https://graph.microsoft.com/.default",
    ],
  },
}));

// --- MeetingChannelFactory (getMeetingChannel / resetMeetingChannel)
let adapterMock: ReturnType<typeof makeAdapterMock>;

function setAdapterMock(adapter: ReturnType<typeof makeAdapterMock>): void {
  adapterMock = adapter;
}

const getMeetingChannelMock = mock(async (): Promise<IMeetingChannel> => adapterMock);
const resetMeetingChannelMock = mock(async (): Promise<void> => undefined);

await mock.module("@/backend/services/meeting/channels/MeetingChannelFactory", () => ({
  getMeetingChannel: getMeetingChannelMock,
  resetMeetingChannel: resetMeetingChannelMock,
}));

// --- PermissionsService
const hasPermissionMock = mock(async (): Promise<boolean> => true);

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
}));

// --- Logger (so adapter constructor doesn't fail)
await mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

// --- Repositories
const listByProviderMock = mock(async (): Promise<MeetingProviderTokenSelectType[]> => []);
const getByUserAndProviderMock = mock(async (): Promise<MeetingProviderTokenSelectType | null> => null);
const deleteByUserAndProviderMock = mock(async (): Promise<void> => undefined);

await mock.module("@/backend/db/repo/meeting/meeting-provider-token.repository", () => ({
  MeetingProviderTokenRepository: {
    listByProvider: listByProviderMock,
    getByUserAndProvider: getByUserAndProviderMock,
    deleteByUserAndProvider: deleteByUserAndProviderMock,
  },
}));

const userFindByIdsMock = mock(async (ids: string[]): Promise<Map<string, UserSelectType | null>> => {
  const map = new Map<string, UserSelectType | null>();
  for (const id of ids) {
    map.set(id, null);
  }
  return map;
});

await mock.module("@/backend/db/repo/users/user.repository", () => ({
  UserRepository: {
    findByIds: userFindByIdsMock,
  },
}));

// --- AuditService
const createManyAuditLogsMock = mock(async (_inputs: readonly CreateAuditLogInput[]): Promise<CreateAuditLogInput[]> => []);

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: createManyAuditLogsMock,
  },
}));

// ---------------------------------------------------------------------------
// SUT — deferred import so mocks are registered first.
// ---------------------------------------------------------------------------

async function importService(): Promise<
  typeof import("@/backend/services/meeting/integrations/meeting-integrations.service")
> {
  return import("@/backend/services/meeting/integrations/meeting-integrations.service");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeToken(opts: {
  userId: string;
  providerSlug?: string;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}): MeetingProviderTokenSelectType {
  const now = new Date();
  return {
    id: `${opts.userId}-token-id`,
    userId: opts.userId,
    providerSlug: opts.providerSlug ?? "zoom",
    accessToken: "access-token",
    refreshToken: null,
    expiresAt: opts.expiresAt ?? null,
    scopes: [],
    createdAt: opts.createdAt ?? now,
    updatedAt: opts.updatedAt ?? now,
  };
}

function makeUser(overrides: Partial<UserSelectType> = {}): UserSelectType {
  return {
    id: USER_ID_A,
    name: "Alice",
    email: "alice@test.com",
    emailVerifiedAt: null,
    password: "hashed-password",
    rememberTokenHash: null,
    avatarFilePath: null,
    avatarUrl: null,
    phone: null,
    status: AccountStatus.ACTIVATED,
    isSuperAdmin: false,
    timezone: IanaTimezone.UTC,
    displayCurrency: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

async function expectThrows(fn: () => Promise<unknown>): Promise<Error> {
  let caught: unknown = null;
  try {
    await fn();
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(Error);
  if (!(caught instanceof Error)) {
    throw new Error("expected fn() to throw an Error instance");
  }
  return caught;
}

// ---------------------------------------------------------------------------
// Reset helpers
// ---------------------------------------------------------------------------

function resetMocks(): void {
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);

  listByProviderMock.mockReset();
  listByProviderMock.mockResolvedValue([]);

  deleteByUserAndProviderMock.mockReset();
  deleteByUserAndProviderMock.mockResolvedValue(undefined);

  getByUserAndProviderMock.mockReset();
  getByUserAndProviderMock.mockResolvedValue(null);

  userFindByIdsMock.mockReset();
  userFindByIdsMock.mockImplementation(async (ids: string[]) => {
    const map = new Map<string, UserSelectType | null>();
    for (const id of ids) {
      map.set(id, null);
    }
    return map;
  });

  createManyAuditLogsMock.mockReset();
  createManyAuditLogsMock.mockResolvedValue([]);

  getMeetingChannelMock.mockReset();
  getMeetingChannelMock.mockImplementation(async () => adapterMock);

  resetMeetingChannelMock.mockReset();
  resetMeetingChannelMock.mockResolvedValue(undefined);

  // Re-establish a default healthy adapter for every test
  setAdapterMock(makeAdapterMock());
}

// ---------------------------------------------------------------------------
// Shared testConnection callers — eliminate duplicated testConnection argument
// construction and common result assertions across the VALIDATE_CONFIG and
// GENERATE_AND_DELETE test groups.
// ---------------------------------------------------------------------------

const VALIDATE_CONFIG_INPUT = {
  providerSlug: "zoom",
  mode: MeetingConnectionTestMode.VALIDATE_CONFIG,
} as const;

const GENERATE_AND_DELETE_INPUT = {
  providerSlug: "zoom",
  mode: MeetingConnectionTestMode.GENERATE_AND_DELETE,
} as const;

async function callTestConnection(
  mode: MeetingConnectionTestMode,
  adapterSetup?: (adapter: ReturnType<typeof makeAdapterMock>) => void
) {
  const { MeetingIntegrationService } = await importService();
  const adapter = makeAdapterMock();
  adapterSetup?.(adapter);
  setAdapterMock(adapter);

  const input = mode === MeetingConnectionTestMode.VALIDATE_CONFIG ? VALIDATE_CONFIG_INPUT : GENERATE_AND_DELETE_INPUT;

  return MeetingIntegrationService.testConnection(ACTOR_ID, input, FAKE_ERRORS);
}

/** Assert a failed testConnection result with optional errorCode / errorMessage checks. */
function expectFailedResult(
  result: Awaited<ReturnType<typeof callTestConnection>>,
  opts: { errorCode?: string; errorMessage?: string }
) {
  expect(result.ok).toBe(false);
  if (opts.errorCode !== undefined) expect(result.errorCode).toBe(opts.errorCode);
  if (opts.errorMessage !== undefined) expect(result.errorMessage).toBe(opts.errorMessage);
}

/** Assert that a GENERATE_AND_DELETE result has deleted=false and a summary containing a substring. */
function expectDeletedFalseWithSummary(
  result: Awaited<ReturnType<typeof callTestConnection>>,
  summarySubstring: string
) {
  expect(result.ok).toBe(true);
  expect(result.deleted).toBe(false);
  expect(result.upstreamResponseSummary).toContain(summarySubstring);
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

describe("MeetingIntegrationService", () => {
  describe("listIntegrationProviders", () => {
    test("returns all three providers with health and endpoint info", async () => {
      const { MeetingIntegrationService } = await importService();
      // All adapters validate OK, no tokens
      listByProviderMock.mockResolvedValue([]);

      const result = await MeetingIntegrationService.listIntegrationProviders(ACTOR_ID, FAKE_ERRORS);

      expect(result).toHaveLength(3);
      const slugs = result.map(p => p.slug);
      expect(slugs).toContain("zoom");
      expect(slugs).toContain("google_meet");
      expect(slugs).toContain("microsoft_teams");
      expect(result[0].credentialsHealthy).toBe(true);
      expect(result[0].kind).toBe("zoom_oauth");
      expect(result[1].kind).toBe("google_meet_oauth");
      expect(result[2].kind).toBe("microsoft_teams_oauth");
      expect(result[0].endpoints).toHaveLength(3);
      expect(result[0].connectedTeacherCount).toBe(0);
      expect(result[0].reauthNeededCount).toBe(0);
    });

    test("sets credentialsHealthy=false when validateConfig returns false", async () => {
      const { MeetingIntegrationService } = await importService();
      const adapter = makeAdapterMock();
      adapter.validateConfig = mock(async () => false);
      setAdapterMock(adapter);

      const result = await MeetingIntegrationService.listIntegrationProviders(ACTOR_ID, FAKE_ERRORS);

      expect(result[0].credentialsHealthy).toBe(false);
    });

    test("counts reauth-needed tokens (expired)", async () => {
      const { MeetingIntegrationService } = await importService();
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      listByProviderMock.mockResolvedValue([
        makeToken({ userId: USER_ID_A, expiresAt: fiveDaysAgo }),
        makeToken({ userId: USER_ID_B, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
      ]);

      const result = await MeetingIntegrationService.listIntegrationProviders(ACTOR_ID, FAKE_ERRORS);

      // Only the first provider is zoom - based on slug resolution.
      expect(result[0].connectedTeacherCount).toBe(2);
      expect(result[0].reauthNeededCount).toBe(1);
    });

    test("throws unauthorized when permission check fails", async () => {
      const { MeetingIntegrationService } = await importService();
      hasPermissionMock.mockResolvedValue(false);

      const err = await expectThrows(() => MeetingIntegrationService.listIntegrationProviders(ACTOR_ID, FAKE_ERRORS));
      expect(err.message).toBe(FAKE_ERRORS.unauthorizedAction);
    });
  });

  describe("listConnectedAccounts", () => {
    test("returns empty array when no tokens exist", async () => {
      const { MeetingIntegrationService } = await importService();
      listByProviderMock.mockResolvedValue([]);

      const result = await MeetingIntegrationService.listConnectedAccounts(ACTOR_ID, "zoom", FAKE_ERRORS);

      expect(result).toEqual([]);
    });

    test("maps token + user data to connected account rows", async () => {
      const { MeetingIntegrationService } = await importService();
      const expiresFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const createdDate = new Date("2026-01-01");
      const updatedDate = new Date("2026-06-01");
      listByProviderMock.mockResolvedValue([
        makeToken({ userId: USER_ID_A, expiresAt: expiresFuture, createdAt: createdDate, updatedAt: updatedDate }),
      ]);
      userFindByIdsMock.mockImplementation(async (ids: string[]) => {
        const map = new Map<string, UserSelectType | null>();
        for (const id of ids) {
          map.set(id, id === USER_ID_A ? makeUser({ id: USER_ID_A, name: "Alice", email: "alice@test.com" }) : null);
        }
        return map;
      });

      const result = await MeetingIntegrationService.listConnectedAccounts(ACTOR_ID, "zoom", FAKE_ERRORS);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(USER_ID_A);
      expect(result[0].name).toBe("Alice");
      expect(result[0].email).toBe("alice@test.com");
      expect(result[0].connectedAt).toEqual(createdDate);
      expect(result[0].expiresAt).toEqual(expiresFuture);
      expect(result[0].lastRefreshedAt).toEqual(updatedDate);
      expect(result[0].status).toBe(MeetingIntegrationConnectedAccountStatus.CONNECTED);
    });

    test("status = expiring_soon when token expires within 7 days", async () => {
      const { MeetingIntegrationService } = await importService();
      const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      listByProviderMock.mockResolvedValue([makeToken({ userId: USER_ID_A, expiresAt: threeDays })]);

      const result = await MeetingIntegrationService.listConnectedAccounts(ACTOR_ID, "zoom", FAKE_ERRORS);

      expect(result[0].status).toBe(MeetingIntegrationConnectedAccountStatus.EXPIRING_SOON);
    });

    test("status = reauth_needed when token is expired", async () => {
      const { MeetingIntegrationService } = await importService();
      const past = new Date(Date.now() - 60_000);
      listByProviderMock.mockResolvedValue([makeToken({ userId: USER_ID_A, expiresAt: past })]);

      const result = await MeetingIntegrationService.listConnectedAccounts(ACTOR_ID, "zoom", FAKE_ERRORS);

      expect(result[0].status).toBe(MeetingIntegrationConnectedAccountStatus.REAUTH_NEEDED);
    });

    test("status = connected when expiresAt is null", async () => {
      const { MeetingIntegrationService } = await importService();
      listByProviderMock.mockResolvedValue([makeToken({ userId: USER_ID_A, expiresAt: null })]);

      const result = await MeetingIntegrationService.listConnectedAccounts(ACTOR_ID, "zoom", FAKE_ERRORS);

      expect(result[0].status).toBe(MeetingIntegrationConnectedAccountStatus.CONNECTED);
    });

    test("handles missing user (name/email default to null)", async () => {
      const { MeetingIntegrationService } = await importService();
      listByProviderMock.mockResolvedValue([makeToken({ userId: "nonexistent" })]);

      const result = await MeetingIntegrationService.listConnectedAccounts(ACTOR_ID, "zoom", FAKE_ERRORS);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBeNull();
      expect(result[0].email).toBeNull();
    });

    test("throws unauthorized when permission check fails", async () => {
      const { MeetingIntegrationService } = await importService();
      hasPermissionMock.mockResolvedValue(false);

      const err = await expectThrows(() =>
        MeetingIntegrationService.listConnectedAccounts(ACTOR_ID, "zoom", FAKE_ERRORS)
      );
      expect(err.message).toBe(FAKE_ERRORS.unauthorizedAction);
    });
  });

  describe("testConnection — VALIDATE_CONFIG mode", () => {
    test("returns ok=true when validateConfig succeeds", async () => {
      const result = await callTestConnection(MeetingConnectionTestMode.VALIDATE_CONFIG, adapter => {
        adapter.validateConfig = mock(async () => true);
      });

      expect(result.ok).toBe(true);
      expect(result.mode).toBe(MeetingConnectionTestMode.VALIDATE_CONFIG);
      expect(result.upstreamResponseSummary).toBe("Credentials valid");
      expect(result.deleted).toBeNull();
      expect(result.testJoinUrl).toBeNull();
      expect(result.errorCode).toBeNull();
      expect(result.errorMessage).toBeNull();
    });

    test("returns ok=false when validateConfig returns false", async () => {
      const result = await callTestConnection(MeetingConnectionTestMode.VALIDATE_CONFIG, adapter => {
        adapter.validateConfig = mock(async () => false);
      });

      expect(result.ok).toBe(false);
      expect(result.upstreamResponseSummary).toBe("Credentials invalid or missing");
    });

    test("returns error info when validateConfig throws MeetingChannelError", async () => {
      const { MeetingChannelError } = await import("@/backend/services/meeting/channels/IMeetingChannel");
      const result = await callTestConnection(MeetingConnectionTestMode.VALIDATE_CONFIG, adapter => {
        adapter.validateConfig = mock(async () => {
          throw new MeetingChannelError("bad config", "CONFIG_ERROR", "upstream msg");
        });
      });

      expectFailedResult(result, { errorCode: "CONFIG_ERROR", errorMessage: "upstream msg" });
    });

    test("returns UNKNOWN error code for non-MeetingChannelError throws", async () => {
      const result = await callTestConnection(MeetingConnectionTestMode.VALIDATE_CONFIG, adapter => {
        adapter.validateConfig = mock(async () => {
          throw new Error("generic error");
        });
      });

      expectFailedResult(result, { errorCode: "UNKNOWN", errorMessage: "generic error" });
    });
  });

  describe("testConnection — GENERATE_AND_DELETE mode", () => {
    test("returns ok=true with joinUrl and deleted=true when generate+delete succeed", async () => {
      const result = await callTestConnection(MeetingConnectionTestMode.GENERATE_AND_DELETE, adapter => {
        adapter.generateMeeting = mock(async () => ({
          joinUrl: "https://zoom.us/j/999",
          meetingId: "meeting-999",
          providerMetadata: { foo: "bar" },
        }));
        adapter.deleteMeeting = mock(async () => undefined);
      });

      expect(result.ok).toBe(true);
      expect(result.mode).toBe(MeetingConnectionTestMode.GENERATE_AND_DELETE);
      expect(result.testJoinUrl).toBe("https://zoom.us/j/999");
      expect(result.deleted).toBe(true);
      expect(result.rawUpstreamPayload).toEqual({ foo: "bar" });
      expect(result.errorCode).toBeNull();
    });

    test("returns deleted=false when deleteMeeting throws", async () => {
      const result = await callTestConnection(MeetingConnectionTestMode.GENERATE_AND_DELETE, adapter => {
        adapter.generateMeeting = mock(async () => ({
          joinUrl: "https://zoom.us/j/888",
          meetingId: "meeting-888",
          providerMetadata: {},
        }));
        adapter.deleteMeeting = mock(async () => {
          throw new Error("delete failed");
        });
      });

      expectDeletedFalseWithSummary(result, "delete failed");
    });

    test("returns deleted=false when adapter has no deleteMeeting", async () => {
      const result = await callTestConnection(MeetingConnectionTestMode.GENERATE_AND_DELETE, adapter => {
        adapter.generateMeeting = mock(async () => ({
          joinUrl: "https://zoom.us/j/777",
          meetingId: "meeting-777",
          providerMetadata: {},
        }));
        adapter.deleteMeeting = undefined;
      });

      expectDeletedFalseWithSummary(result, "delete not supported by provider");
    });

    test("returns ok=false when generateMeeting throws MeetingChannelError", async () => {
      const { MeetingChannelError } = await import("@/backend/services/meeting/channels/IMeetingChannel");
      const result = await callTestConnection(MeetingConnectionTestMode.GENERATE_AND_DELETE, adapter => {
        adapter.generateMeeting = mock(async () => {
          throw new MeetingChannelError("provider down", "PROVIDER_UNAVAILABLE", "API timeout");
        });
      });

      expectFailedResult(result, { errorCode: "PROVIDER_UNAVAILABLE", errorMessage: "API timeout" });
      expect(result.upstreamResponseSummary).toContain("API timeout");
    });

    test("returns ok=false when generateMeeting throws generic Error", async () => {
      const result = await callTestConnection(MeetingConnectionTestMode.GENERATE_AND_DELETE, adapter => {
        adapter.generateMeeting = mock(async () => {
          throw new Error("unexpected failure");
        });
      });

      expectFailedResult(result, { errorCode: "UNKNOWN", errorMessage: "unexpected failure" });
    });

    test("returns deleted=false when meeting has no meetingId", async () => {
      const result = await callTestConnection(MeetingConnectionTestMode.GENERATE_AND_DELETE, adapter => {
        adapter.generateMeeting = mock(async () => ({
          joinUrl: "https://zoom.us/j/no-id",
          providerMetadata: {},
        }));
      });

      expectDeletedFalseWithSummary(result, "delete not supported by provider");
    });
  });

  describe("revokeToken", () => {
    test("deletes the token and returns revoked=true", async () => {
      const { MeetingIntegrationService } = await importService();

      const result = await MeetingIntegrationService.revokeToken(
        ACTOR_ID,
        { userId: USER_ID_A, providerSlug: "zoom" },
        FAKE_ERRORS
      );

      expect(result.userId).toBe(USER_ID_A);
      expect(result.providerSlug).toBe("zoom");
      expect(result.revoked).toBe(true);
      expect(deleteByUserAndProviderMock).toHaveBeenCalledWith(USER_ID_A, "zoom");
    });

    test("calls adapter.disconnect (best-effort disconnect)", async () => {
      const { MeetingIntegrationService } = await importService();

      await MeetingIntegrationService.revokeToken(
        ACTOR_ID,
        { userId: USER_ID_A, providerSlug: "google_meet" },
        FAKE_ERRORS
      );

      expect(getMeetingChannelMock).toHaveBeenCalledWith("google_meet");
      const { disconnect: disconnectMock } = adapterMock;
      expect(disconnectMock).toHaveBeenCalled();
    });

    test("continues to delete even if adapter.disconnect throws", async () => {
      const { MeetingIntegrationService } = await importService();
      adapterMock.disconnect = mock(async (): Promise<void> => {
        throw new Error("disconnect failed");
      });

      const result = await MeetingIntegrationService.revokeToken(
        ACTOR_ID,
        { userId: USER_ID_A, providerSlug: "zoom" },
        FAKE_ERRORS
      );

      expect(result.revoked).toBe(true);
      expect(deleteByUserAndProviderMock).toHaveBeenCalled();
    });

    test("writes an audit log entry", async () => {
      const { MeetingIntegrationService } = await importService();

      await MeetingIntegrationService.revokeToken(ACTOR_ID, { userId: USER_ID_A, providerSlug: "zoom" }, FAKE_ERRORS);

      expect(createManyAuditLogsMock).toHaveBeenCalledTimes(1);
      const auditCallArgs = createManyAuditLogsMock.mock.calls[0];
      const auditEntry = auditCallArgs[0][0];
      expect(auditEntry.action).toBe("REVOKE");
      expect(auditEntry.entityType).toBe("MEETING_PROVIDER_TOKEN");
      expect(auditEntry.actorUserId).toBe(ACTOR_ID);
      expect(auditEntry.metadata).toEqual({
        event: "meeting_provider_token.revoked",
        userId: USER_ID_A,
        providerSlug: "zoom",
      });
    });

    test("still succeeds when AuditService.createManyAuditLogs throws", async () => {
      const { MeetingIntegrationService } = await importService();
      createManyAuditLogsMock.mockRejectedValue(new Error("audit failure"));

      const result = await MeetingIntegrationService.revokeToken(
        ACTOR_ID,
        { userId: USER_ID_A, providerSlug: "zoom" },
        FAKE_ERRORS
      );

      expect(result.revoked).toBe(true);
    });

    test("throws unauthorized when permission check fails", async () => {
      const { MeetingIntegrationService } = await importService();
      hasPermissionMock.mockResolvedValue(false);

      const err = await expectThrows(() =>
        MeetingIntegrationService.revokeToken(ACTOR_ID, { userId: USER_ID_A, providerSlug: "zoom" }, FAKE_ERRORS)
      );
      expect(err.message).toBe(FAKE_ERRORS.unauthorizedAction);
    });
  });
});
