import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { meetingProviders } from "@/backend/db/schema/meeting/meeting-providers";

// ============================================================================
// `meeting_providers` — admin-managed catalog (no provider enums)
// ============================================================================

export type MeetingProviderFieldSchema = {
  readonly requiresMeetingUrl: boolean;
  readonly supportsUsername?: boolean | null;
  readonly supportsPassword?: boolean | null;
  readonly supportsTenantId?: boolean | null;
};

export type MeetingProviderFieldSchemaInput = {
  readonly requiresMeetingUrl: boolean;
  readonly supportsUsername?: boolean | null;
  readonly supportsPassword?: boolean | null;
  readonly supportsTenantId?: boolean | null;
};

export type MeetingProviderSelectType = InferSelectModel<typeof meetingProviders>;

export type MeetingProviderInsertType = InferInsertModel<typeof meetingProviders>;

export type MeetingProviderSubmitInput = Omit<MeetingProviderInsertType, "id" | "createdAt" | "updatedAt">;

export type UpdateMeetingProviderInput = Partial<MeetingProviderSubmitInput>;
