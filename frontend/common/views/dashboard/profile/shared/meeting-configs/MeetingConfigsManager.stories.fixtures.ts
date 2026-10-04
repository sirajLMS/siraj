import type { MeetingConfigListItem } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { LinkedClassInstance } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/LinkedClassInstancesList";

export const noop = () => {};

interface MakeConfigOverrides {
  id: string;
  providerName: string;
  providerSlug: string;
  providerKind: string;
  providerId: string;
  meetingUrl?: string | null;
  label?: string | null;
  isDefault?: boolean;
  hasSecret?: boolean;
}

function makeConfig(overrides: MakeConfigOverrides): MeetingConfigListItem {
  const config: UserMeetingConfigFieldsFragment = {
    id: overrides.id,
    userId: "user-1",
    providerId: overrides.providerId,
    label: overrides.label ?? null,
    isDefault: overrides.isDefault ?? false,
    hasSecret: overrides.hasSecret ?? false,
    oauthTokenExpiresAt: null,
    providerMetadata: null,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-20T12:00:00Z",
    details: {
      id: "meeting-config-details",
      meetingUrl: overrides.meetingUrl ?? null,
      username: null,
      tenantId: null,
    },
    provider: {
      id: overrides.providerId,
      slug: overrides.providerSlug,
      name: { en: overrides.providerName, ar: overrides.providerName },
      description: null,
      instructions: null,
      urlAllowlist: [],
      urlExample: "https://example.com",
      logoUrl: null,
      providerKind: overrides.providerKind,
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      fieldSchema: null,
    },
  };
  return config;
}

const instances: readonly LinkedClassInstance[] = [
  {
    id: "ci-1",
    title: "Arabic Grammar — Lesson 5",
    startTime: "2026-08-03T10:00:00Z",
    meetingJoinUrl: "https://zoom.us/j/123456789",
  },
  {
    id: "ci-2",
    title: "Quran Recitation — Lesson 12",
    startTime: "2026-08-05T14:00:00Z",
    meetingJoinUrl: null,
  },
];

const zoomProvider = {
  providerName: "Zoom",
  providerSlug: "zoom",
  providerKind: "oauth",
  providerId: "prov-zoom-1",
};

const teamsProvider = {
  providerName: "Microsoft Teams",
  providerSlug: "microsoft_teams",
  providerKind: "oauth",
  providerId: "prov-teams-1",
};

type RowStoryOverrides = MakeConfigOverrides & {
  meetingId: string | null;
  showInstances: boolean;
  instances?: readonly LinkedClassInstance[];
};

type ZoomRowStoryOverrides = Pick<
  RowStoryOverrides,
  "meetingUrl" | "meetingId" | "label" | "instances" | "showInstances"
>;

function makeZoomRowStory(id: string, overrides: ZoomRowStoryOverrides) {
  return makeRowStory({ ...zoomProvider, id, isDefault: true, ...overrides });
}

function makeRowStory({
  meetingId,
  instances: rowInstances = [],
  showInstances,
  ...configOverrides
}: RowStoryOverrides) {
  const config = makeConfig(configOverrides);
  return {
    config,
    rowExtra: {
      meetingId,
      meetingUrl: configOverrides.meetingUrl ?? null,
      providerName: configOverrides.providerName,
      providerKind: configOverrides.providerKind,
      instances: rowInstances,
      showInstances,
    },
  };
}

export const autoZoomRowStory = makeZoomRowStory("mc-auto-1", {
  meetingUrl: "https://zoom.us/j/123456789",
  meetingId: "123456789",
  label: "Personal Room",
  showInstances: false,
});

export const manualRowStory = makeRowStory({
  id: "mc-manual-1",
  providerName: "Manual Meeting Link",
  providerSlug: "manual",
  providerKind: "manual",
  providerId: "prov-manual-1",
  meetingUrl: "https://meet.google.com/abc-defg-hij",
  meetingId: null,
  showInstances: false,
});

export const linkedPopulatedRowStory = makeZoomRowStory("mc-linked-1", {
  meetingUrl: "https://zoom.us/j/987654321",
  meetingId: "987654321",
  instances,
  showInstances: true,
});

export const linkedEmptyRowStory = makeRowStory({
  id: "mc-empty-1",
  providerName: "Google Meet",
  providerSlug: "google_meet",
  providerKind: "oauth",
  providerId: "prov-gmeet-1",
  meetingUrl: null,
  meetingId: null,
  showInstances: true,
});

export const desktopLinkedRowStory = makeRowStory({
  id: "mc-desktop-1",
  ...teamsProvider,
  meetingUrl: "https://teams.microsoft.com/l/meetup-join/abc",
  meetingId: "abc",
  isDefault: true,
  instances,
  showInstances: true,
});
