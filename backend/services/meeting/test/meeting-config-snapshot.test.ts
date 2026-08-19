import { beforeEach, describe, expect, it, mock } from "bun:test";

const loggerWarn = mock((_msg: string, _ctx?: unknown) => {});

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: mock((_msg: string, _ctx?: unknown) => {}),
    warn: loggerWarn,
    error: mock((_msg: string, _ctx?: unknown) => {}),
    debug: mock((_msg: string, _ctx?: unknown) => {}),
  },
}));

const mockInstance = {
  id: "inst-1",
  meetingProviderId: null,
  userMeetingConfigId: null,
};

const mockClient = {
  select: mock(() => ({
    from: mock(() => ({
      where: mock(() => ({
        limit: mock(() => Promise.resolve([mockInstance])),
      })),
    })),
  })),
};

await mock.module("@/backend/db", () => ({
  queryDb: mock(() => mockClient),
}));

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { update: mock(() => ({ set: mock(() => ({ where: mock(() => Promise.resolve()) })) })) },
}));

await mock.module("@/backend/db/repo/meeting/user-meeting-config.repository", () => ({
  UserMeetingConfigRepository: { getById: mock(() => Promise.resolve(null)) },
}));

await mock.module("@/backend/db/repo/meeting/meeting-provider.repository", () => ({
  MeetingProviderRepository: { getById: mock(() => Promise.resolve(null)) },
}));

await mock.module("@/backend/db/repo/meeting/class-meeting-config.repository", () => ({
  ClassMeetingConfigRepository: { getEffectiveForClassInstance: mock(() => Promise.resolve(null)) },
}));

await mock.module("@/backend/lib/meeting-config.validation", () => ({
  parseMeetingConfigDetails: mock(() => ({})),
}));

await mock.module("@/backend/services/meeting/channels/IMeetingChannel", () => ({
  MeetingChannelError: class MeetingChannelError extends Error {},
}));

await mock.module("@/backend/services/meeting/channels/MeetingChannelFactory", () => ({
  getMeetingChannel: mock(() => null),
  providerKindToSlug: mock(() => ""),
}));

await mock.module("@/backend/services/meeting/meeting-config-mask", () => ({
  buildMeetingProviderCatalogSnapshot: mock(() => null),
}));

const { MeetingConfigSnapshotService } = await import("@/backend/services/meeting/meeting-config-snapshot");

describe("MeetingConfigSnapshotService generateAndAttachForClassInstance", () => {
  beforeEach(() => {
    loggerWarn.mockClear();
  });

  it("logs logger.warn with providerLookupReason when no provider resolved", async () => {
    const result = await MeetingConfigSnapshotService.generateAndAttachForClassInstance("inst-1");
    expect(result.success).toBe(false);
    expect(result.joinUrl).toBeNull();
    expect(loggerWarn).toHaveBeenCalled();
    const warnCall = loggerWarn.mock.calls.find(
      (call: unknown[]) => typeof call[0] === "string" && call[0].includes("no provider resolved")
    );
    expect(warnCall).toBeDefined();
    const ctx = warnCall?.[1];
    if (typeof ctx === "object" && ctx !== null) {
      expect(ctx).toHaveProperty("providerLookupReason");
      expect(ctx).toHaveProperty("classInstanceId");
    } else {
      throw new Error("Expected warn call to have a context object with providerLookupReason");
    }
  });
});
