import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { MeetingChannelError } from "@/backend/services/meeting/channels/IMeetingChannel";
import * as MeetingChannelFactory from "@/backend/services/meeting/channels/MeetingChannelFactory";
import type {
  ClassMeetingConfigSelectType,
  ClassMeetingConfigSubmitInput,
} from "@/backend/types/meeting/class-meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-4111-8111-111111111111";
const PROVIDER_ID = "33333333-3333-4333-8333-333333333333";
const CONFIG_ID = "44444444-4444-4444-8444-444444444444";
const CLASS_INSTANCE_ID = "55555555-5555-4555-8555-555555555555";

const FAKE_ERRORS = {
  unauthorizedAction: "You are not authorized.",
  meetingProviderInactive: "Provider is inactive.",
  meetingProvider: {
    meetingConfigCreateFailed: "Failed to create class meeting config.",
    meetingConfigUpdateFailed: "Failed to update class meeting config.",
  },
  meetingConfigNotFound: "Meeting config not found.",
  meetingProviderNotFound: "Meeting provider not found.",
} as unknown as ErrorsLabels;

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

function buildClassConfig(overrides: Partial<ClassMeetingConfigSelectType> = {}): ClassMeetingConfigSelectType {
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
  } as unknown as ClassMeetingConfigSelectType;
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported
// ---------------------------------------------------------------------------

// --- PermissionsService
const hasPermissionMock = mock(async (): Promise<boolean> => true);

mock.module("@/backend/services/auth/permissions.service", () => ({
  PermissionsService: {
    hasPermission: hasPermissionMock,
  },
}));

// --- Logger
mock.module("@/backend/lib/logger", () => ({
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

mock.module("@/backend/services/meeting/meeting-provider-catalog.service", () => ({
  MeetingProviderCatalogService: {
    getProvidersByIds: getProvidersByIdsMock,
  },
}));

// --- MeetingProviderRepository
const providerGetByIdOrThrowMock = mock(async (): Promise<MeetingProviderSelectType> => buildProvider());

mock.module("@/backend/db/repo/meeting/meeting-provider.repository", () => ({
  MeetingProviderRepository: {
    getByIdOrThrow: providerGetByIdOrThrowMock,
  },
}));

// --- ClassMeetingConfigRepository
const classConfigListByScopeMock = mock(async (): Promise<ClassMeetingConfigSelectType[]> => [buildClassConfig()]);
const classConfigGetByIdOrThrowMock = mock(async (): Promise<ClassMeetingConfigSelectType> => buildClassConfig());
const classConfigCreateMock = mock(async (): Promise<ClassMeetingConfigSelectType> => buildClassConfig());
const classConfigUpdateMock = mock(async (): Promise<ClassMeetingConfigSelectType> => buildClassConfig());
const classConfigDeleteMock = mock(async (): Promise<{ id: string }> => ({ id: CONFIG_ID }));
const classConfigSetDefaultMock = mock(async (): Promise<ClassMeetingConfigSelectType> => buildClassConfig());

mock.module("@/backend/db/repo/meeting/class-meeting-config.repository", () => ({
  ClassMeetingConfigRepository: {
    listByScope: classConfigListByScopeMock,
    getByIdOrThrow: classConfigGetByIdOrThrowMock,
    create: classConfigCreateMock,
    update: classConfigUpdateMock,
    deleteConfig: classConfigDeleteMock,
    setDefault: classConfigSetDefaultMock,
  },
}));

// --- UserMeetingConfigRepository (imported by service for EffectiveMeetingService)
mock.module("@/backend/db/repo/meeting/user-meeting-config.repository", () => ({
  UserMeetingConfigRepository: {},
}));

// --- MeetingConfigSnapshotService stubs are NOT mocked here.
// The class-meeting-config.service imports it at module level, but only the
// EffectiveMeetingService namespace uses it (not tested here). The real
// module will be imported with its own dependency mocks from the above
// registrations (repositories, logger, etc.) — it should resolve fine.

// --- meeting-config-mask (pure functions, mock for safety)
mock.module("@/backend/services/meeting/class-meeting-config-mask", () => ({
  buildMaskedClassMeetingConfig: (config: ClassMeetingConfigSelectType) => ({
    id: config.id,
    classInstanceId: config.classInstanceId,
    recurringScheduleId: config.recurringScheduleId,
    providerId: config.providerId,
    label: config.label,
    isDefault: config.isDefault,
    details: config.details,
    provider: { slug: "zoom", name: { en: "Zoom" }, logoUrl: null },
  }),
  buildMaskedClassMeetingConfigs: (configs: ClassMeetingConfigSelectType[]) =>
    configs.map(c => ({
      id: c.id,
      classInstanceId: c.classInstanceId,
      recurringScheduleId: c.recurringScheduleId,
      providerId: c.providerId,
      label: c.label,
      isDefault: c.isDefault,
      details: c.details,
      provider: { slug: "zoom", name: { en: "Zoom" }, logoUrl: null },
    })),
}));

// --- meeting-config.validation — return details as-is so maybeGenerateUrl decides
mock.module("@/backend/lib/meeting-config.validation", () => ({
  parseMeetingConfigDetails: (_provider: unknown, details: unknown) => details,
}));

// --- Drizzle db & schema (imported at module level by class-meeting-config.service.ts)
// Also needed by meeting-config-snapshot.ts which is imported transitively.
mock.module("@/backend/db/drizzleDb", () => ({
  db: {},
}));

mock.module("@/backend/db/schema", () => ({
  classInstances: {},
  teachers: {},
}));

// --- queryDb + MeetingChannelFactory (needed by meeting-config-snapshot.ts)
const emptyLimit = async () => [];
const whereBuilder = () => ({ limit: emptyLimit });
const fromBuilder = () => ({ where: whereBuilder });
const selectBuilder = () => ({ from: fromBuilder });

mock.module("@/backend/db", () => ({
  queryDb: () => ({ select: selectBuilder }),
}));

mock.module("@/backend/services/meeting/channels/MeetingChannelFactory", () => ({
  getMeetingChannel: async () => ({}),
  providerKindToSlug: () => null,
  // meetingChannel must have the `generateMeeting` function so spyOn works
  meetingChannel: {
    generateMeeting: async () => ({
      joinUrl: "https://zoom.us/j/mock",
      providerMetadata: {},
    }),
  },
  resetMeetingChannel: async () => {},
  resetAllMeetingChannels: async () => {},
}));

// ---------------------------------------------------------------------------
// SUT — deferred import so mocks are registered first
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/meeting/class-meeting-config.service")> {
  return import("@/backend/services/meeting/class-meeting-config.service");
}

// ---------------------------------------------------------------------------
// Reset helpers
// ---------------------------------------------------------------------------

function resetMocks(): void {
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);

  getProvidersByIdsMock.mockResolvedValue(new Map<string, MeetingProviderSelectType>([[PROVIDER_ID, buildProvider()]]));

  providerGetByIdOrThrowMock.mockReset();
  providerGetByIdOrThrowMock.mockResolvedValue(buildProvider());

  classConfigListByScopeMock.mockReset();
  classConfigListByScopeMock.mockResolvedValue([buildClassConfig()]);

  classConfigGetByIdOrThrowMock.mockReset();
  classConfigGetByIdOrThrowMock.mockResolvedValue(buildClassConfig());

  classConfigCreateMock.mockReset();
  classConfigCreateMock.mockResolvedValue(buildClassConfig());

  classConfigUpdateMock.mockReset();
  classConfigUpdateMock.mockResolvedValue(buildClassConfig());

  classConfigDeleteMock.mockReset();
  classConfigDeleteMock.mockResolvedValue({ id: CONFIG_ID });

  classConfigSetDefaultMock.mockReset();
  classConfigSetDefaultMock.mockResolvedValue(buildClassConfig());
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

describe("ClassMeetingConfigService", () => {
  describe("listClassMeetingConfigs", () => {
    test("returns a list of class meeting configs for a class instance", async () => {
      const { ClassMeetingConfigService } = await importService();
      const result = await ClassMeetingConfigService.listClassMeetingConfigs(ACTOR_ID, CLASS_INSTANCE_ID, FAKE_ERRORS);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(CONFIG_ID);
    });

    test("throws when actor lacks permission", async () => {
      hasPermissionMock.mockResolvedValue(false);
      const { ClassMeetingConfigService } = await importService();

      await expect(
        ClassMeetingConfigService.listClassMeetingConfigs(ACTOR_ID, CLASS_INSTANCE_ID, FAKE_ERRORS)
      ).rejects.toThrow("You are not authorized.");
    });
  });

  describe("listRecurringMeetingConfigs", () => {
    test("returns a list of configs for a recurring schedule", async () => {
      const { ClassMeetingConfigService } = await importService();
      const result = await ClassMeetingConfigService.listRecurringMeetingConfigs(ACTOR_ID, "recurring-id", FAKE_ERRORS);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });
  });

  describe("getClassMeetingConfig", () => {
    test("returns a single config by id", async () => {
      const { ClassMeetingConfigService } = await importService();
      const result = await ClassMeetingConfigService.getClassMeetingConfig(ACTOR_ID, CONFIG_ID, FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(result.id).toBe(CONFIG_ID);
    });
  });

  describe("createClassMeetingConfig", () => {
    test("creates a config with manual provider (no URL generation)", async () => {
      const { ClassMeetingConfigService } = await importService();
      const input: ClassMeetingConfigSubmitInput = {
        classInstanceId: CLASS_INSTANCE_ID,
        providerId: PROVIDER_ID,
        label: "Test Class Config",
        isDefault: false,
        details: { meetingUrl: "https://zoom.us/j/123" },
      };

      const result = await ClassMeetingConfigService.createClassMeetingConfig(ACTOR_ID, input, FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(result.id).toBe(CONFIG_ID);
      expect(classConfigCreateMock).toHaveBeenCalledTimes(1);
    });

    test("creates a config with auto provider and generates URL", async () => {
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      const generateMeeting = spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockResolvedValue({
        joinUrl: "https://zoom.us/j/generated",
        providerMetadata: { id: "gen-123" },
      });

      const { ClassMeetingConfigService } = await importService();
      const input: ClassMeetingConfigSubmitInput = {
        classInstanceId: CLASS_INSTANCE_ID,
        providerId: PROVIDER_ID,
        label: "Auto Class Config",
        isDefault: false,
        details: { meetingUrl: null },
      };

      const result = await ClassMeetingConfigService.createClassMeetingConfig(ACTOR_ID, input, FAKE_ERRORS);

      expect(generateMeeting).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(classConfigCreateMock).toHaveBeenCalledTimes(1);
    });

    test("auto provider with user-supplied URL skips generation (manual override)", async () => {
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      const generateMeeting = spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting");

      const { ClassMeetingConfigService } = await importService();
      const input: ClassMeetingConfigSubmitInput = {
        classInstanceId: CLASS_INSTANCE_ID,
        providerId: PROVIDER_ID,
        label: "Override Class Config",
        isDefault: false,
        details: { meetingUrl: "https://zoom.us/j/override-987" },
      };

      const result = await ClassMeetingConfigService.createClassMeetingConfig(ACTOR_ID, input, FAKE_ERRORS);

      expect(generateMeeting).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(classConfigCreateMock).toHaveBeenCalledTimes(1);
    });

    test("re-throws MeetingChannelError as-is from adapter", async () => {
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      const adapterError = new MeetingChannelError("Rate limited", "RATE_LIMITED");
      spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockRejectedValue(adapterError);

      const { ClassMeetingConfigService } = await importService();
      const input: ClassMeetingConfigSubmitInput = {
        classInstanceId: CLASS_INSTANCE_ID,
        providerId: PROVIDER_ID,
        label: "Auto Class Config",
        isDefault: false,
        details: { meetingUrl: null },
      };

      await expect(ClassMeetingConfigService.createClassMeetingConfig(ACTOR_ID, input, FAKE_ERRORS)).rejects.toThrow(
        "Rate limited"
      );
    });

    test("wraps unexpected adapter errors in user-friendly Error", async () => {
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockRejectedValue(
        new Error("Unexpected internal failure")
      );

      const { ClassMeetingConfigService } = await importService();
      const input: ClassMeetingConfigSubmitInput = {
        classInstanceId: CLASS_INSTANCE_ID,
        providerId: PROVIDER_ID,
        label: "Auto Class Config",
        isDefault: false,
        details: { meetingUrl: null },
      };

      await expect(ClassMeetingConfigService.createClassMeetingConfig(ACTOR_ID, input, FAKE_ERRORS)).rejects.toThrow(
        "Failed to create class meeting config."
      );
    });
  });

  describe("updateClassMeetingConfig", () => {
    test("updates a config successfully", async () => {
      const { ClassMeetingConfigService } = await importService();
      const input = {
        label: "Updated Label",
        isDefault: true,
      };

      const result = await ClassMeetingConfigService.updateClassMeetingConfig(ACTOR_ID, CONFIG_ID, input, FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(classConfigUpdateMock).toHaveBeenCalledTimes(1);
    });

    test("auto provider update with user-supplied URL skips generation (manual override)", async () => {
      classConfigGetByIdOrThrowMock.mockResolvedValue(
        buildClassConfig({ details: { meetingUrl: "https://zoom.us/j/existing" } })
      );
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      const generateMeeting = spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting");

      const { ClassMeetingConfigService } = await importService();
      const input = {
        label: "Updated Label",
        isDefault: true,
        details: { meetingUrl: "https://zoom.us/j/override-update" },
      };

      const result = await ClassMeetingConfigService.updateClassMeetingConfig(ACTOR_ID, CONFIG_ID, input, FAKE_ERRORS);

      expect(generateMeeting).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(classConfigUpdateMock).toHaveBeenCalledTimes(1);
    });

    test("wraps unexpected adapter errors with update-friendly message", async () => {
      classConfigGetByIdOrThrowMock.mockResolvedValue(buildClassConfig({ details: { meetingUrl: null } }));
      providerGetByIdOrThrowMock.mockResolvedValue(buildProvider({ providerKind: "zoom_oauth" }));
      spyOn(MeetingChannelFactory.meetingChannel, "generateMeeting").mockRejectedValue(new Error("Unexpected failure"));

      const { ClassMeetingConfigService } = await importService();
      const input = {
        label: "Updated Label",
        isDefault: true,
        details: { meetingUrl: null },
      };

      await expect(
        ClassMeetingConfigService.updateClassMeetingConfig(ACTOR_ID, CONFIG_ID, input, FAKE_ERRORS)
      ).rejects.toThrow("Failed to update class meeting config.");
    });
  });

  describe("deleteClassMeetingConfig", () => {
    test("deletes a config successfully", async () => {
      const { ClassMeetingConfigService } = await importService();
      const result = await ClassMeetingConfigService.deleteClassMeetingConfig(ACTOR_ID, CONFIG_ID, FAKE_ERRORS);

      expect(result.id).toBe(CONFIG_ID);
      expect(classConfigDeleteMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("setDefaultClassMeetingConfig", () => {
    test("sets a config as default", async () => {
      const { ClassMeetingConfigService } = await importService();
      const result = await ClassMeetingConfigService.setDefaultClassMeetingConfig(ACTOR_ID, CONFIG_ID, FAKE_ERRORS);

      expect(result).toBeDefined();
      expect(classConfigSetDefaultMock).toHaveBeenCalledTimes(1);
    });
  });
});
