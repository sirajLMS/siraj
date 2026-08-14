import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { MeetingChannelError } from "@/backend/services/meeting/channels/IMeetingChannel";
import * as MeetingChannelFactory from "@/backend/services/meeting/channels/MeetingChannelFactory";
import type {
  ClassMeetingConfigInsertType,
  MeetingProviderSelectType,
  UserMeetingConfigSelectType,
  UserMeetingConfigSubmitInput,
} from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const TARGET_USER_ID = "22222222-2222-4222-8222-222222222222";
const PROVIDER_ID = "33333333-3333-4333-8333-333333333333";
const CONFIG_ID = "44444444-4444-4444-8444-444444444444";

const FAKE_ERRORS: ErrorsLabels = getServerTranslations("en").errorsTranslations;

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function buildProvider(overrides: Partial<MeetingProviderSelectType> = {}): MeetingProviderSelectType {
  return {
    id: PROVIDER_ID,
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

function buildUserConfig(overrides: Partial<UserMeetingConfigSelectType> = {}): UserMeetingConfigSelectType {
  return {
    id: CONFIG_ID,
    userId: TARGET_USER_ID,
    providerId: PROVIDER_ID,
    label: "My Config",
    isDefault: false,
    details: { meetingUrl: "https://zoom.us/j/123" },
    encryptedSecret: null,
    providerMetadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported
// ---------------------------------------------------------------------------

// --- PermissionsService
const hasPermissionMock = mock(async (): Promise<boolean> => true);

await mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
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

// --- MeetingProviderCatalogService
const getProvidersByIdsMock = mock(async (): Promise<Map<string, MeetingProviderSelectType>> => {
  const map = new Map<string, MeetingProviderSelectType>();
  map.set(PROVIDER_ID, buildProvider());
  return map;
});

await mock.module("@/backend/services/meeting/meeting-provider-catalog.service", () => ({
  MeetingProviderCatalogService: {
    getProvidersByIds: getProvidersByIdsMock,
  },
}));

// --- UserMeetingConfigRepository
const userConfigCreateMock = mock(async (): Promise<UserMeetingConfigSelectType> => buildUserConfig());
const userConfigUpdateMock = mock(async (): Promise<UserMeetingConfigSelectType> => buildUserConfig());
const userConfigListMock = mock(async (): Promise<UserMeetingConfigSelectType[]> => [buildUserConfig()]);
const userConfigGetByIdMock = mock(async (): Promise<UserMeetingConfigSelectType> => buildUserConfig());
const userConfigGetByIdOrThrowMock = mock(async (): Promise<UserMeetingConfigSelectType> => buildUserConfig());
const userConfigDeleteMock = mock(async (): Promise<{ id: string }> => ({ id: CONFIG_ID }));
const userConfigSetDefaultMock = mock(async (): Promise<UserMeetingConfigSelectType> => buildUserConfig());
const userConfigUpsertManyMock = mock(async (): Promise<UserMeetingConfigSelectType[]> => [buildUserConfig()]);

await mock.module("@/backend/db/repo/meeting/user-meeting-config.repository", () => ({
  UserMeetingConfigRepository: {
    create: userConfigCreateMock,
    update: userConfigUpdateMock,
    listByUserId: userConfigListMock,
    getById: userConfigGetByIdMock,
    getByIdOrThrow: userConfigGetByIdOrThrowMock,
    deleteConfig: userConfigDeleteMock,
    setDefault: userConfigSetDefaultMock,
    upsertMany: userConfigUpsertManyMock,
  },
}));

// --- ClassMeetingConfigRepository (imported by service, used by upsertManyClassMeetingConfigs)
const classConfigUpsertManyMock = mock(async (): Promise<unknown[]> => []);

await mock.module("@/backend/db/repo/meeting/class-meeting-config.repository", () => ({
  ClassMeetingConfigRepository: {
    upsertMany: classConfigUpsertManyMock,
  },
}));

// --- MeetingProviderRepository
const providerGetByIdOrThrowMock = mock(async (): Promise<MeetingProviderSelectType> => buildProvider());
const providerGetByIdsMock = mock(async (): Promise<MeetingProviderSelectType[]> => [buildProvider()]);

await mock.module("@/backend/db/repo/meeting/meeting-provider.repository", () => ({
  MeetingProviderRepository: {
    getByIdOrThrow: providerGetByIdOrThrowMock,
    getByIds: providerGetByIdsMock,
  },
}));

// --- meeting-config-mask (pure functions, no mock needed but import-safe)
await mock.module("@/backend/services/meeting/meeting-config-mask", () => ({
  buildMaskedMeetingConfig: (config: UserMeetingConfigSelectType) => ({
    id: config.id,
    userId: config.userId,
    providerId: config.providerId,
    label: config.label,
    isDefault: config.isDefault,
    details: config.details,
    provider: { slug: "zoom", name: { en: "Zoom" }, logoUrl: null },
  }),
  buildMaskedMeetingConfigs: (configs: UserMeetingConfigSelectType[]) =>
    configs.map(c => ({
      id: c.id,
      userId: c.userId,
      providerId: c.providerId,
      label: c.label,
      isDefault: c.isDefault,
      details: c.details,
      provider: { slug: "zoom", name: { en: "Zoom" }, logoUrl: null },
    })),
}));

// --- meeting-config.validation
// Return the details as-is so maybeGenerateUrl can decide based on meetingUrl presence
await mock.module("@/backend/lib/meeting-config.validation", () => ({
  parseMeetingConfigDetails: (_provider: unknown, details: unknown) => details,
}));

// ---------------------------------------------------------------------------
// SUT — deferred import so mocks are registered first
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/meeting/meeting-config.service")> {
  return import("@/backend/services/meeting/meeting-config.service");
}

// ---------------------------------------------------------------------------
// Reset helpers
// ---------------------------------------------------------------------------

function resetMocks(): void {
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);

  getProvidersByIdsMock.mockResolvedValue(new Map<string, MeetingProviderSelectType>([[PROVIDER_ID, buildProvider()]]));

  userConfigCreateMock.mockReset();
  userConfigCreateMock.mockResolvedValue(buildUserConfig());

  userConfigUpdateMock.mockReset();
  userConfigUpdateMock.mockResolvedValue(buildUserConfig());

  userConfigListMock.mockReset();
  userConfigListMock.mockResolvedValue([buildUserConfig()]);

  userConfigGetByIdMock.mockReset();
  userConfigGetByIdMock.mockResolvedValue(buildUserConfig());

  userConfigGetByIdOrThrowMock.mockReset();
  userConfigGetByIdOrThrowMock.mockResolvedValue(buildUserConfig());

  userConfigDeleteMock.mockReset();
  userConfigDeleteMock.mockResolvedValue({ id: CONFIG_ID });

  userConfigSetDefaultMock.mockReset();
  userConfigSetDefaultMock.mockResolvedValue(buildUserConfig());

  providerGetByIdOrThrowMock.mockReset();
  providerGetByIdOrThrowMock.mockResolvedValue(buildProvider());

  userConfigUpsertManyMock.mockReset();
  userConfigUpsertManyMock.mockResolvedValue([buildUserConfig()]);

  classConfigUpsertManyMock.mockReset();
  classConfigUpsertManyMock.mockResolvedValue([]);
}

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  mock.restore();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MeetingConfigService", () => {
  describe("listUserMeetingConfigs", () => {
    test("returns a list of configs for the user", async () => {
      const { MeetingConfigService } = await importService();
      const result = await MeetingConfigService.listUserMeetingConfigs(ACTOR_ID, TARGET_USER_ID, FAKE_ERRORS);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(CONFIG_ID);
    });

    test("throws when actor lacks permission", async () => {
      hasPermissionMock.mockResolvedValue(false);
      const { MeetingConfigService } = await importService();

      return expect(MeetingConfigService.listUserMeetingConfigs(ACTOR_ID, TARGET_USER_ID, FAKE_ERRORS)).rejects.toThrow(
        "You are not authorized to perform this action."
      );
    });
  });

  describe("getUserMeetingConfig", () => {
    test("returns a single config by id", async () => {
      const { MeetingConfigService } = await importService();
      const result = await MeetingConfigService.getUserMeetingConfig(ACTOR_ID, "some-config-id", FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(result.id).toBe(CONFIG_ID);
    });
  });

  describe("createUserMeetingConfig", () => {
    test("creates a config with manual provider (no URL generation)", async () => {
      const { MeetingConfigService } = await importService();
      const input = {
        userId: TARGET_USER_ID,
        providerId: PROVIDER_ID,
        label: "Test Config",
        isDefault: false,
        details: { meetingUrl: "https://zoom.us/j/123" },
      };

      const result = await MeetingConfigService.createUserMeetingConfig(ACTOR_ID, input, FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(result.id).toBe(CONFIG_ID);
      expect(userConfigCreateMock).toHaveBeenCalledTimes(1);
    });

    test("creates a config with auto provider and generates URL", async () => {
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      const generateMeeting = spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockResolvedValue({
        joinUrl: "https://zoom.us/j/generated",
        providerMetadata: { id: "gen-123" },
      });

      const { MeetingConfigService } = await importService();
      const input = {
        userId: TARGET_USER_ID,
        providerId: PROVIDER_ID,
        label: "Auto Config",
        isDefault: false,
        details: { meetingUrl: null },
      };

      const result = await MeetingConfigService.createUserMeetingConfig(ACTOR_ID, input, FAKE_ERRORS);

      expect(generateMeeting).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(userConfigCreateMock).toHaveBeenCalledTimes(1);
    });

    test("re-throws MeetingChannelError as-is from adapter", async () => {
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      const adapterError = new MeetingChannelError("Rate limited", "RATE_LIMITED");
      spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockRejectedValue(adapterError);

      const { MeetingConfigService } = await importService();
      const input = {
        userId: TARGET_USER_ID,
        providerId: PROVIDER_ID,
        label: "Auto Config",
        isDefault: false,
        details: { meetingUrl: null },
      };

      return expect(MeetingConfigService.createUserMeetingConfig(ACTOR_ID, input, FAKE_ERRORS)).rejects.toThrow(
        "Rate limited"
      );
    });

    test("wraps unexpected adapter errors in user-friendly Error", async () => {
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockRejectedValue(
        new Error("Unexpected internal failure")
      );

      const { MeetingConfigService } = await importService();
      const input = {
        userId: TARGET_USER_ID,
        providerId: PROVIDER_ID,
        label: "Auto Config",
        isDefault: false,
        details: { meetingUrl: null },
      };

      return expect(MeetingConfigService.createUserMeetingConfig(ACTOR_ID, input, FAKE_ERRORS)).rejects.toThrow(
        "Failed to create meeting config."
      );
    });
  });

  describe("updateUserMeetingConfig", () => {
    test("updates a config successfully", async () => {
      const { MeetingConfigService } = await importService();
      const input = {
        label: "Updated Label",
        isDefault: true,
      };

      const result = await MeetingConfigService.updateUserMeetingConfig(ACTOR_ID, CONFIG_ID, input, FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(userConfigUpdateMock).toHaveBeenCalledTimes(1);
    });

    test("wraps unexpected adapter errors with update-friendly message", async () => {
      userConfigGetByIdOrThrowMock.mockResolvedValue(buildUserConfig({ details: { meetingUrl: null } }));
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockRejectedValue(new Error("Unexpected failure"));

      const { MeetingConfigService } = await importService();
      const input = {
        label: "Updated Label",
        isDefault: true,
        details: { meetingUrl: null },
      };

      return expect(
        MeetingConfigService.updateUserMeetingConfig(ACTOR_ID, CONFIG_ID, input, FAKE_ERRORS)
      ).rejects.toThrow("Failed to update meeting config.");
    });
  });

  describe("deleteUserMeetingConfig", () => {
    test("deletes a config successfully", async () => {
      const { MeetingConfigService } = await importService();
      const result = await MeetingConfigService.deleteUserMeetingConfig(ACTOR_ID, CONFIG_ID, FAKE_ERRORS);

      expect(result.id).toBe(CONFIG_ID);
      expect(userConfigDeleteMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("setDefaultMeetingConfig", () => {
    test("sets a config as default", async () => {
      const { MeetingConfigService } = await importService();
      const result = await MeetingConfigService.setDefaultMeetingConfig(ACTOR_ID, CONFIG_ID, FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(userConfigSetDefaultMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("upsertManyUserMeetingConfigs", () => {
    test("upserts multiple user meeting configs", async () => {
      const { MeetingConfigService } = await importService();
      const inputs: readonly UserMeetingConfigSubmitInput[] = [
        {
          userId: TARGET_USER_ID,
          providerId: PROVIDER_ID,
          label: "Config A",
          isDefault: false,
          details: { meetingUrl: "https://zoom.us/j/123" },
        },
      ];

      const result = await MeetingConfigService.upsertManyUserMeetingConfigs(inputs, FAKE_ERRORS);

      expect(Array.isArray(result)).toBe(true);
      expect(userConfigUpsertManyMock).toHaveBeenCalledTimes(1);
    });

    test("returns empty array when inputs is empty", async () => {
      const { MeetingConfigService } = await importService();
      const result = await MeetingConfigService.upsertManyUserMeetingConfigs([], FAKE_ERRORS);

      expect(result).toEqual([]);
      expect(userConfigUpsertManyMock).not.toHaveBeenCalled();
    });
  });

  describe("upsertManyClassMeetingConfigs", () => {
    test("upserts multiple class meeting configs", async () => {
      const { MeetingConfigService } = await importService();
      const inputs: readonly ClassMeetingConfigInsertType[] = [
        {
          classInstanceId: "class-instance-id",
          providerId: PROVIDER_ID,
          label: "Class Config A",
          isDefault: false,
          details: { meetingUrl: "https://zoom.us/j/123" },
        },
      ];

      await MeetingConfigService.upsertManyClassMeetingConfigs(inputs, FAKE_ERRORS);

      expect(classConfigUpsertManyMock).toHaveBeenCalledTimes(1);
    });

    test("returns empty array when inputs is empty", async () => {
      const { MeetingConfigService } = await importService();
      const result = await MeetingConfigService.upsertManyClassMeetingConfigs([], FAKE_ERRORS);

      expect(result).toEqual([]);
      expect(classConfigUpsertManyMock).not.toHaveBeenCalled();
    });
  });
});
