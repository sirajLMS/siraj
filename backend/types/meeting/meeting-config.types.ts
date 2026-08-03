import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import type { LocalizedString } from "@/shared/types";

// ============================================================================
// User meeting config details (JSONB on `user_meeting_configs`)
// Validated against provider `field_schema` + `url_allowlist` at service boundary.
// ============================================================================

export type MeetingConfigDetails = {
  readonly meetingUrl?: string | null;
  readonly username?: string;
  readonly tenantId?: string;
};

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

export type UserMeetingConfigSelectType = {
  readonly id: string;
  readonly userId: string;
  readonly providerId: string;
  readonly label: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret: string | null;
  readonly providerMetadata: Record<string, unknown> | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type UserMeetingConfigInsertType = {
  readonly id?: string;
  readonly userId: string;
  readonly providerId: string;
  readonly label?: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret?: string | null;
  readonly providerMetadata?: Record<string, unknown> | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type UserMeetingConfigReturnType = UserMeetingConfigSelectType & {
  readonly hasSecret?: boolean;
  readonly provider?: MeetingProviderSelectType;
};

export type UserMeetingConfigSubmitInput = Omit<
  UserMeetingConfigInsertType,
  "id" | "createdAt" | "updatedAt" | "encryptedSecret" | "providerMetadata"
> & {
  readonly password?: string | null;
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
