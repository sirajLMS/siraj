import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type {
  MeetingConfigDetails,
  MeetingConfigSnapshot,
  UserMeetingConfigSelectType,
} from "@/backend/types/meeting/meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const CONFIG_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const CLASS_INSTANCE_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const UPSTREAM_MEETING_ID = "zoom-meeting-123";

const FAKE_ERRORS = {
  meetingConfigNotFound: (id: string) => `Meeting config not found: ${id}`,
  meetingProviderNotFound: (id: string) => `Meeting provider not found: ${id}`,
} as unknown as ErrorsLabels;

// ---------------------------------------------------------------------------
// Mock data builders
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mock data builders
// ---------------------------------------------------------------------------

function buildProvider(overrides: Partial<MeetingProviderSelectType> = {}): MeetingProviderSelectType {
  return {
    id: PROVIDER_ID,
    slug: "zoom",
    name: { en: "Zoom", ar: "زووم" },
    description: null,
    instructions: null,
    urlAllowlist: ["zoom.us"],
    urlExample: "https://zoom.us/j/123",
    logoUrl: null,
    fieldSchema: { requiresMeetingUrl: true },
    providerKind: "zoom_oauth",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildUserConfig(overrides: Partial<UserMeetingConfigSelectType> = {}): UserMeetingConfigSelectType {
  return {
    id: CONFIG_ID,
    userId: "user-1",
    providerId: PROVIDER_ID,
    label: "My Zoom",
    isDefault: true,
    details: { meetingUrl: "https://zoom.us/j/123" },
    encryptedSecret: null,
    providerMetadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

interface FakeClassInstance {
  readonly id: string;
  readonly meetingProviderId: string | null;
  readonly userMeetingConfigId: string | null;
  readonly meetingJoinUrl: string | null;
  readonly meetingConfigSnapshot: MeetingConfigSnapshot | null;
  readonly scheduledStartAt: Date | null;
  readonly durationMinutes: number | null;
}

function buildClassInstance(overrides: Partial<FakeClassInstance> = {}): FakeClassInstance {
  return {
    id: CLASS_INSTANCE_ID,
    meetingProviderId: PROVIDER_ID,
    userMeetingConfigId: null,
    meetingJoinUrl: null,
    meetingConfigSnapshot: null,
    scheduledStartAt: new Date("2025-01-15T10:00:00Z"),
    durationMinutes: 60,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported
// ---------------------------------------------------------------------------

// --- Logger
void mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

// --- meeting-config.validation — passthrough
void mock.module("@/backend/lib/meeting-config.validation", () => ({
  parseMeetingConfigDetails: (_provider: unknown, details: unknown) => details as MeetingConfigDetails,
}));

// --- meeting-config-mask
void mock.module("@/backend/services/meeting/meeting-config-mask", () => ({
  buildMeetingProviderCatalogSnapshot: (provider: MeetingProviderSelectType) => ({
    catalogId: provider.id,
    catalogSlug: provider.slug,
    catalogName: provider.name,
    logoUrl: provider.logoUrl,
    supportsAutoGeneration: provider.providerKind !== "manual",
  }),
}));

// --- UserMeetingConfigRepository
const userConfigGetByIdOrThrowMock = mock(async (): Promise<UserMeetingConfigSelectType> => buildUserConfig());
const userConfigGetByIdMock = mock(async (): Promise<UserMeetingConfigSelectType | null> => buildUserConfig());

void mock.module("@/backend/db/repo/meeting/user-meeting-config.repository", () => ({
  UserMeetingConfigRepository: {
    getByIdOrThrow: userConfigGetByIdOrThrowMock,
    getById: userConfigGetByIdMock,
  },
}));

// --- ClassMeetingConfigRepository
import type { ClassMeetingConfigSelectType } from "@/backend/types/meeting/class-meeting-config.types";

function buildClassConfig(overrides: Partial<ClassMeetingConfigSelectType> = {}) {
  return {
    id: CONFIG_ID,
    classInstanceId: CLASS_INSTANCE_ID,
    recurringScheduleId: null,
    providerId: PROVIDER_ID,
    label: "Class Config",
    isDefault: false,
    details: { meetingUrl: "https://zoom.us/j/123" },
    encryptedSecret: null,
    providerMetadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const classConfigGetByIdOrThrowMock = mock(async (): Promise<ClassMeetingConfigSelectType> => buildClassConfig());

void mock.module("@/backend/db/repo/meeting/class-meeting-config.repository", () => ({
  ClassMeetingConfigRepository: {
    getByIdOrThrow: classConfigGetByIdOrThrowMock,
  },
}));

// --- MeetingProviderRepository
const providerGetByIdOrThrowMock = mock(async (): Promise<MeetingProviderSelectType> => buildProvider());
const providerGetByIdMock = mock(async (): Promise<MeetingProviderSelectType | null> => buildProvider());

void mock.module("@/backend/db/repo/meeting/meeting-provider.repository", () => ({
  MeetingProviderRepository: {
    getByIdOrThrow: providerGetByIdOrThrowMock,
    getById: providerGetByIdMock,
  },
}));

// --- MeetingChannelFactory — getMeetingChannel + providerKindToSlug
const generateMeetingMock = mock(
  async (): Promise<{
    joinUrl: string;
    meetingId?: string;
    providerMetadata: Record<string, unknown>;
  }> => ({
    joinUrl: "https://zoom.us/j/generated",
    meetingId: UPSTREAM_MEETING_ID,
    providerMetadata: { kind: "zoom_oauth", meetingId: UPSTREAM_MEETING_ID },
  })
);

const deleteMeetingMock = mock(async (): Promise<void> => {});

function buildFakeAdapter() {
  return {
    generateMeeting: generateMeetingMock,
    deleteMeeting: deleteMeetingMock,
    validateConfig: async () => true,
    disconnect: async () => {},
  };
}

const getMeetingChannelMock = mock(async () => buildFakeAdapter());
const providerKindToSlugMock = mock((kind: string): "zoom" | "google_meet" | "microsoft_teams" | null => {
  if (kind === "zoom_oauth") return "zoom";
  if (kind === "google_meet_oauth") return "google_meet";
  if (kind === "microsoft_teams_oauth") return "microsoft_teams";
  return null;
});

void mock.module("@/backend/services/meeting/channels/MeetingChannelFactory", () => ({
  getMeetingChannel: getMeetingChannelMock,
  providerKindToSlug: providerKindToSlugMock,
  meetingChannel: {},
  resetMeetingChannel: async () => {},
  resetAllMeetingChannels: async () => {},
}));

// --- Drizzle db & schema — mock query builder chain + raw db.update()
// The snapshot service uses:
//   const client = queryDb(tx); client.select().from(classInstances).where(...).limit(1)
//   db.update(classInstances).set(...).where(...)
// We build a fluent mock that returns the configured instance array.

let queryResult: FakeClassInstance[] = [];

const dbUpdateSetWhereMock = mock(async () => ({}));
const dbUpdateSetMock = mock(() => ({ where: dbUpdateSetWhereMock }));
const dbUpdateMock = mock(() => ({ set: dbUpdateSetMock }));

void mock.module("@/backend/db/drizzleDb", () => ({
  db: {
    update: dbUpdateMock,
  },
}));

void mock.module("@/backend/db/schema", () => ({
  classInstances: { id: "id" },
  teachers: { id: "id", userId: "userId" },
}));

function buildQueryClient() {
  const limitMock = mock(async () => queryResult);
  const whereMock = mock(() => ({ limit: limitMock }));
  const fromMock = mock(() => ({ where: whereMock }));
  const selectMock = mock(() => ({ from: fromMock }));
  return { select: selectMock, from: fromMock, where: whereMock, limit: limitMock };
}

const queryClient = buildQueryClient();

void mock.module("@/backend/db", () => ({
  queryDb: () => queryClient,
}));

// ---------------------------------------------------------------------------
// SUT — deferred import so mocks are registered first
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/meeting/meeting-config-snapshot")> {
  return import("@/backend/services/meeting/meeting-config-snapshot");
}

// ---------------------------------------------------------------------------
// Reset helpers
// ---------------------------------------------------------------------------

function resetMocks(): void {
  userConfigGetByIdOrThrowMock.mockReset();
  userConfigGetByIdOrThrowMock.mockResolvedValue(buildUserConfig());

  userConfigGetByIdMock.mockReset();
  userConfigGetByIdMock.mockResolvedValue(buildUserConfig());

  classConfigGetByIdOrThrowMock.mockReset();
  classConfigGetByIdOrThrowMock.mockResolvedValue(buildClassConfig());

  providerGetByIdOrThrowMock.mockReset();
  providerGetByIdOrThrowMock.mockResolvedValue(buildProvider());

  providerGetByIdMock.mockReset();
  providerGetByIdMock.mockResolvedValue(buildProvider());

  generateMeetingMock.mockReset();
  generateMeetingMock.mockResolvedValue({
    joinUrl: "https://zoom.us/j/generated",
    meetingId: UPSTREAM_MEETING_ID,
    providerMetadata: { kind: "zoom_oauth", meetingId: UPSTREAM_MEETING_ID },
  });

  deleteMeetingMock.mockReset();
  deleteMeetingMock.mockResolvedValue(undefined);

  getMeetingChannelMock.mockReset();
  getMeetingChannelMock.mockResolvedValue(buildFakeAdapter());

  providerKindToSlugMock.mockReset();
  providerKindToSlugMock.mockImplementation((kind: string): "zoom" | "google_meet" | "microsoft_teams" | null => {
    if (kind === "zoom_oauth") return "zoom";
    if (kind === "google_meet_oauth") return "google_meet";
    if (kind === "microsoft_teams_oauth") return "microsoft_teams";
    return null;
  });

  dbUpdateSetWhereMock.mockReset();
  dbUpdateSetWhereMock.mockResolvedValue({});

  // Reset query builder mocks
  queryClient.select.mockClear();
  queryClient.from.mockClear();
  queryClient.where.mockClear();
  queryClient.limit.mockClear();

  // Re-link the chain (mockClear preserves implementation, but let's be safe)
  queryClient.limit.mockImplementation(async () => queryResult);
  queryClient.where.mockImplementation(() => ({ limit: queryClient.limit }));
  queryClient.from.mockImplementation(() => ({ where: queryClient.where }));
  queryClient.select.mockImplementation(() => ({ from: queryClient.from }));
}

beforeEach(() => {
  queryResult = [];
  resetMocks();
});

afterEach(() => {
  mock.restore();
});

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

/** Shared snapshot object used across cancelMeetingForClassInstance tests. */
function buildSnapshotForCancel(overrides: Record<string, unknown> = {}) {
  return {
    userMeetingConfigId: null,
    providerId: PROVIDER_ID,
    label: null,
    details: {},
    provider: {
      catalogId: PROVIDER_ID,
      catalogSlug: "zoom",
      catalogName: { en: "Zoom" },
      logoUrl: null,
      supportsAutoGeneration: true,
    },
    snapshottedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Shared assertion for failed generateAndAttach results. */
async function expectGenerateFailure(): Promise<void> {
  const { MeetingConfigSnapshotService } = await importService();
  const result = await MeetingConfigSnapshotService.generateAndAttachForClassInstance(CLASS_INSTANCE_ID);
  expect(result.success).toBe(false);
  expect(result.joinUrl).toBeNull();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MeetingConfigSnapshotService", () => {
  describe("buildSessionSnapshot", () => {
    test("builds a user session snapshot from config + provider", async () => {
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      userConfigGetByIdOrThrowMock.mockResolvedValue(
        buildUserConfig({ details: { meetingUrl: "https://zoom.us/j/123" } })
      );

      const { MeetingConfigSnapshotService } = await importService();
      const result = await MeetingConfigSnapshotService.buildSessionSnapshot(CONFIG_ID, FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(result.userMeetingConfigId).toBe(CONFIG_ID);
      expect(result.providerId).toBe(PROVIDER_ID);
      expect(result.details).toEqual({ meetingUrl: "https://zoom.us/j/123" });
      expect(result.provider).toBeDefined();
      expect(result.provider.catalogId).toBe(PROVIDER_ID);
      expect(result.snapshottedAt).toBeDefined();
    });
  });

  describe("buildClassSessionSnapshot", () => {
    test("builds a class session snapshot from config + provider", async () => {
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));

      const { MeetingConfigSnapshotService } = await importService();
      const result = await MeetingConfigSnapshotService.buildClassSessionSnapshot(CONFIG_ID, FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(result.providerId).toBe(PROVIDER_ID);
      expect(result.provider).toBeDefined();
      expect(result.snapshottedAt).toBeDefined();
    });
  });

  describe("generateAndAttachForClassInstance", () => {
    test("returns {success: false} when class instance not found", async () => {
      queryResult = [];

      const { MeetingConfigSnapshotService } = await importService();
      const result = await MeetingConfigSnapshotService.generateAndAttachForClassInstance(CLASS_INSTANCE_ID);

      expect(result.success).toBe(false);
      expect(result.joinUrl).toBeNull();
    });

    test("returns {success: false} when no provider can be resolved", async () => {
      queryResult = [buildClassInstance({ meetingProviderId: null, userMeetingConfigId: null })];
      providerGetByIdMock.mockResolvedValue(null);
      userConfigGetByIdMock.mockResolvedValue(null);

      const { MeetingConfigSnapshotService } = await importService();
      const result = await MeetingConfigSnapshotService.generateAndAttachForClassInstance(CLASS_INSTANCE_ID);

      expect(result.success).toBe(false);
      expect(result.joinUrl).toBeNull();
    });

    test("returns {success: false} for manual provider (no auto-generation)", async () => {
      queryResult = [buildClassInstance()];
      providerGetByIdMock.mockResolvedValue(buildProvider({ providerKind: "manual" }));

      await expectGenerateFailure();
      expect(generateMeetingMock).not.toHaveBeenCalled();
    });

    test("returns {success: false} when provider kind is unsupported", async () => {
      queryResult = [buildClassInstance()];
      providerGetByIdMock.mockResolvedValue(buildProvider({ providerKind: "manual" }));
      providerKindToSlugMock.mockReturnValue(null);

      await expectGenerateFailure();
    });

    test("generates and attaches meeting URL on first attempt", async () => {
      queryResult = [buildClassInstance()];
      providerGetByIdMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));

      const { MeetingConfigSnapshotService } = await importService();
      const result = await MeetingConfigSnapshotService.generateAndAttachForClassInstance(CLASS_INSTANCE_ID);

      expect(result.success).toBe(true);
      expect(result.joinUrl).toBe("https://zoom.us/j/generated");
      expect(generateMeetingMock).toHaveBeenCalledTimes(1);
      expect(dbUpdateSetWhereMock).toHaveBeenCalledTimes(1);
    });

    test("retries on adapter failure and succeeds on later attempt", async () => {
      queryResult = [buildClassInstance()];
      providerGetByIdMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));

      let attempt = 0;
      generateMeetingMock.mockImplementation(async () => {
        attempt++;
        if (attempt < 3) {
          throw new Error("Transient failure");
        }
        return {
          joinUrl: "https://zoom.us/j/recovered",
          meetingId: "rec-1",
          providerMetadata: {},
        };
      });

      const { MeetingConfigSnapshotService } = await importService();
      const result = await MeetingConfigSnapshotService.generateAndAttachForClassInstance(CLASS_INSTANCE_ID);

      expect(result.success).toBe(true);
      expect(result.joinUrl).toBe("https://zoom.us/j/recovered");
      expect(generateMeetingMock).toHaveBeenCalledTimes(3);
    });

    test("returns {success: false, joinUrl: null} after all retries exhausted", async () => {
      queryResult = [buildClassInstance()];
      providerGetByIdMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      generateMeetingMock.mockRejectedValue(new Error("Permanent failure"));

      await expectGenerateFailure();
      expect(generateMeetingMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("cancelMeetingForClassInstance", () => {
    test("returns early when class instance has no meetingJoinUrl", async () => {
      queryResult = [buildClassInstance({ meetingJoinUrl: null })];

      const { MeetingConfigSnapshotService } = await importService();
      await MeetingConfigSnapshotService.cancelMeetingForClassInstance(CLASS_INSTANCE_ID);

      expect(deleteMeetingMock).not.toHaveBeenCalled();
    });

    test("returns early when class instance not found", async () => {
      queryResult = [];

      const { MeetingConfigSnapshotService } = await importService();
      await MeetingConfigSnapshotService.cancelMeetingForClassInstance(CLASS_INSTANCE_ID);

      expect(deleteMeetingMock).not.toHaveBeenCalled();
    });

    test("skips deleteMeeting when snapshot has no upstreamMeetingId", async () => {
      queryResult = [
        buildClassInstance({
          meetingJoinUrl: "https://zoom.us/j/123",
          meetingConfigSnapshot: buildSnapshotForCancel(),
        }),
      ];

      const { MeetingConfigSnapshotService } = await importService();
      await MeetingConfigSnapshotService.cancelMeetingForClassInstance(CLASS_INSTANCE_ID);

      expect(deleteMeetingMock).not.toHaveBeenCalled();
    });

    test("calls deleteMeeting when upstreamMeetingId exists", async () => {
      queryResult = [
        buildClassInstance({
          meetingJoinUrl: "https://zoom.us/j/123",
          meetingConfigSnapshot: buildSnapshotForCancel({ upstreamMeetingId: UPSTREAM_MEETING_ID }),
        }),
      ];
      providerGetByIdMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));

      const { MeetingConfigSnapshotService } = await importService();
      await MeetingConfigSnapshotService.cancelMeetingForClassInstance(CLASS_INSTANCE_ID);

      expect(deleteMeetingMock).toHaveBeenCalledTimes(1);
      expect(deleteMeetingMock).toHaveBeenCalledWith(UPSTREAM_MEETING_ID);
    });

    test("swallows adapter errors (best-effort)", async () => {
      queryResult = [
        buildClassInstance({
          meetingJoinUrl: "https://zoom.us/j/123",
          meetingConfigSnapshot: buildSnapshotForCancel({ upstreamMeetingId: UPSTREAM_MEETING_ID }),
        }),
      ];
      providerGetByIdMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      deleteMeetingMock.mockRejectedValue(new Error("Provider down"));

      const { MeetingConfigSnapshotService } = await importService();

      // Should not throw — cancel is best-effort
      return expect(
        MeetingConfigSnapshotService.cancelMeetingForClassInstance(CLASS_INSTANCE_ID)
      ).resolves.toBeUndefined();
    });
  });
});
