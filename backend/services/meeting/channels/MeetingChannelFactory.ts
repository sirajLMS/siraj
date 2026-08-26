import { logger } from "@/backend/lib/logger";
import { UnsupportedProviderKindError } from "@/backend/services/meeting/channels/IMeetingChannel";
import { invalidateEnvConfigCache, resolveEnvConfigMany } from "@/backend/services/system";
import type { GenerateMeetingInput, GenerateMeetingResult, IMeetingChannel, MeetingProvider } from "@/backend/types";

// ============================================================================
// Env keys per provider slug
// ============================================================================

const PROVIDER_ENV_KEYS: Record<MeetingProvider, readonly string[]> = {
  zoom: ["ZOOM_ACCOUNT_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"] as const,
  google_meet: ["GOOGLE_MEET_SERVICE_ACCOUNT_JSON", "GOOGLE_MEET_IMPERSONATE_SUBJECT"] as const,
  microsoft_teams: [
    "MS_TEAMS_TENANT_ID",
    "MS_TEAMS_CLIENT_ID",
    "MS_TEAMS_CLIENT_SECRET",
    "MS_TEAMS_ORGANIZER_USER_ID",
  ] as const,
};

// ============================================================================
// Factory state — race-safe per-slug singleton
// ============================================================================

const instances = new Map<MeetingProvider, IMeetingChannel>();
const initializationPromises = new Map<MeetingProvider, Promise<IMeetingChannel>>();

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Maps a catalog `providerKind` to the adapter slug.
 * Returns `null` for `"manual"` (no adapter).
 */
export function providerKindToSlug(providerKind: string): MeetingProvider | null {
  switch (providerKind) {
    case "zoom_oauth":
      return "zoom";
    case "google_meet_oauth":
      return "google_meet";
    case "microsoft_teams_oauth":
      return "microsoft_teams";
    default:
      return null;
  }
}

async function createAdapter(slug: MeetingProvider): Promise<IMeetingChannel> {
  logger.info(`Initializing Meeting channel for provider: ${slug}`);

  const envKeys = PROVIDER_ENV_KEYS[slug];
  const resolved = await resolveEnvConfigMany([...envKeys]);

  if (slug === "zoom") {
    const { ZoomMeetingAdapter } = await import("@/backend/services/meeting/channels/zoom/ZoomMeetingAdapter");
    return new ZoomMeetingAdapter({
      accountId: resolved.ZOOM_ACCOUNT_ID,
      clientId: resolved.ZOOM_CLIENT_ID,
      clientSecret: resolved.ZOOM_CLIENT_SECRET,
    });
  }

  if (slug === "google_meet") {
    const { GoogleMeetAdapter } = await import("@/backend/services/meeting/channels/google-meet/GoogleMeetAdapter");
    return new GoogleMeetAdapter({
      serviceAccountJson: resolved.GOOGLE_MEET_SERVICE_ACCOUNT_JSON,
      impersonateSubject: resolved.GOOGLE_MEET_IMPERSONATE_SUBJECT,
    });
  }

  const { MicrosoftTeamsAdapter } = await import(
    "@/backend/services/meeting/channels/microsoft-teams/MicrosoftTeamsAdapter"
  );
  return new MicrosoftTeamsAdapter({
    tenantId: resolved.MS_TEAMS_TENANT_ID,
    clientId: resolved.MS_TEAMS_CLIENT_ID,
    clientSecret: resolved.MS_TEAMS_CLIENT_SECRET,
    organizerUserId: resolved.MS_TEAMS_ORGANIZER_USER_ID,
  });
}

// ============================================================================
// Public API
// ============================================================================

export const getMeetingChannel = async (slug: MeetingProvider): Promise<IMeetingChannel> => {
  const existing = instances.get(slug);
  if (existing) return existing;

  const promise = initializationPromises.get(slug);
  if (promise) return promise;

  const initPromise = (async () => {
    try {
      const adapter = await createAdapter(slug);
      instances.set(slug, adapter);
      initializationPromises.delete(slug);
      return adapter;
    } catch (error) {
      initializationPromises.delete(slug);
      logger.error(`Failed to initialize meeting channel for "${slug}"`, error);
      throw error;
    }
  })();

  initializationPromises.set(slug, initPromise);
  return initPromise;
};

export const resetMeetingChannel = async (slug: MeetingProvider): Promise<void> => {
  const instance = instances.get(slug);
  if (instance) {
    await instance.disconnect();
    instances.delete(slug);
  }
  initializationPromises.delete(slug);
  for (const key of PROVIDER_ENV_KEYS[slug]) {
    invalidateEnvConfigCache(key);
  }
};

export const resetAllMeetingChannels = async (): Promise<void> => {
  const slugs = [...instances.keys()];
  await Promise.all(slugs.map(slug => resetMeetingChannel(slug)));
};

/**
 * Convenience delegating object — mirrors `emailChannel` in
 * `EmailChannelFactory`. Resolves the adapter from a `providerKind` string.
 */
export const meetingChannel = {
  generateMeeting: async (providerKind: string, input: GenerateMeetingInput): Promise<GenerateMeetingResult> => {
    const slug = providerKindToSlug(providerKind);
    if (!slug) {
      throw new UnsupportedProviderKindError(providerKind);
    }
    const adapter = await getMeetingChannel(slug);
    return adapter.generateMeeting(input);
  },

  validateConfig: async (providerKind: string): Promise<boolean> => {
    const slug = providerKindToSlug(providerKind);
    if (!slug) {
      throw new UnsupportedProviderKindError(providerKind);
    }
    const adapter = await getMeetingChannel(slug);
    return adapter.validateConfig();
  },

  disconnect: async (providerKind: string): Promise<void> => {
    const slug = providerKindToSlug(providerKind);
    if (!slug) {
      throw new UnsupportedProviderKindError(providerKind);
    }
    await resetMeetingChannel(slug);
  },
};
