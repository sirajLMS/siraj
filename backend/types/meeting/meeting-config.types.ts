import type {
  MeetingConfigBaseInsertType,
  MeetingConfigBaseReturnType,
  MeetingConfigBaseSelectType,
  MeetingConfigBaseSubmitInput,
  MeetingConfigDetails,
} from "@/backend/types";
import type { LocalizedString } from "@/shared/types";

// ============================================================================
// Session snapshot (frozen on class_instances at booking)
// ============================================================================

export type MeetingProviderCatalogSnapshot = {
  readonly catalogId: string;
  readonly catalogSlug: string;
  readonly catalogName: LocalizedString;
  readonly logoUrl: string | null;
  readonly supportsAutoGeneration: boolean;
};

export type MeetingConfigSnapshot = {
  readonly userMeetingConfigId: string | null;
  readonly providerId: string;
  readonly label: string | null;
  readonly details: MeetingConfigDetails;
  readonly provider: MeetingProviderCatalogSnapshot;
  readonly snapshottedAt: string;
  /** Upstream provider meeting ID (set when auto-generation creates a meeting).
   * Used by `cancelMeetingForClassInstance` to call `adapter.deleteMeeting`. */
  readonly upstreamMeetingId?: string | null;
  /** Provider-specific metadata captured at generation time (e.g. Zoom meeting
   * password, Google Meet space name). Frozen alongside the URL in the snapshot. */
  readonly providerMetadata?: Record<string, unknown> | null;
};

// ============================================================================
// `user_meeting_configs` — live/mutable saved configs per user
// ============================================================================

export type UserMeetingConfigSelectType = MeetingConfigBaseSelectType & {
  readonly userId: string;
};

export type UserMeetingConfigInsertType = MeetingConfigBaseInsertType & {
  readonly userId: string;
};

export type UserMeetingConfigReturnType = MeetingConfigBaseReturnType & {
  readonly userId: string;
};

export type UserMeetingConfigSubmitInput = MeetingConfigBaseSubmitInput & {
  readonly userId: string;
};

export type UpdateUserMeetingConfigInput = Partial<Omit<UserMeetingConfigSubmitInput, "userId">> & {
  /**
   * When `true` and the provider supports auto-generation, forces URL
   * regeneration even if no other field changed.  Has no effect on
   * manual providers or when a user-supplied URL is present in `details`.
   */
  readonly forceRegenerate?: boolean;
};

// ============================================================================
// Generate Meeting URL — preview path (non-persisting)
// ============================================================================

export type GenerateMeetingUrlResult = {
  readonly joinUrl: string;
  readonly meetingId?: string | null;
  readonly expiresAt?: string | null;
};
