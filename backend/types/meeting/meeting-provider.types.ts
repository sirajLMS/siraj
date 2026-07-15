import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

// ============================================================================
// `meeting_providers` — admin-managed catalog (no provider enums)
// ============================================================================

export type MeetingProviderFieldSchema = {
  readonly requiresMeetingUrl: boolean;
  readonly supportsUsername?: boolean;
  readonly supportsPassword?: boolean;
  readonly supportsTenantId?: boolean;
};

export type MeetingProviderSelectType = {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly description: LocalizedString | null;
  readonly instructions: LocalizedString | null;
  readonly urlAllowlist: readonly string[];
  readonly urlExample: string | null;
  readonly logoUrl: string | null;
  readonly fieldSchema: MeetingProviderFieldSchema;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type MeetingProviderInsertType = {
  readonly id?: string;
  readonly slug: string;
  readonly name: LocalizedString;
  readonly description?: LocalizedString | null;
  readonly instructions?: LocalizedString | null;
  readonly urlAllowlist: readonly string[];
  readonly urlExample?: string | null;
  readonly logoUrl?: string | null;
  readonly fieldSchema: MeetingProviderFieldSchema;
  readonly isActive?: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type MeetingProviderSubmitInput = Omit<MeetingProviderInsertType, "id" | "createdAt" | "updatedAt">;

export type UpdateMeetingProviderInput = Partial<MeetingProviderSubmitInput>;
