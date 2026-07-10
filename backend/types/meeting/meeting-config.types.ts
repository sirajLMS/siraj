import type { MeetingProviderReturnType } from "@/backend/types/meeting/meeting-provider.types";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

// ============================================================================
// User meeting config details (JSONB on `user_meeting_configs`)
// Validated against provider `field_schema` + `url_allowlist` at service boundary.
// ============================================================================

export type MeetingConfigDetails = {
  readonly meetingUrl: string;
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
};

export type MeetingConfigSnapshot = {
  readonly userMeetingConfigId: string | null;
  readonly providerId: string;
  readonly label: string | null;
  readonly details: MeetingConfigDetails;
  readonly provider: MeetingProviderCatalogSnapshot;
  readonly snapshottedAt: string;
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
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type UserMeetingConfigReturnType = UserMeetingConfigSelectType & {
  readonly hasSecret?: boolean;
  readonly provider?: MeetingProviderReturnType;
};

export type UserMeetingConfigSubmitInput = Omit<
  UserMeetingConfigInsertType,
  "id" | "createdAt" | "updatedAt" | "encryptedSecret"
> & {
  readonly password?: string | null;
};

export type UpdateUserMeetingConfigInput = Partial<Omit<UserMeetingConfigSubmitInput, "userId">>;
