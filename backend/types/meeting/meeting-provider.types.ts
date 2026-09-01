import type { meetingProviders } from "@/backend/db/schema/meeting/meeting-providers";

// ============================================================================
// `meeting_providers` — admin-managed catalog
// ============================================================================

/**
 * Provider slug union — the three adapters that support auto-generation.
 * Canonical home; `backend/services/meeting/channels/IMeetingChannel.ts` re-exports.
 */
export type MeetingProvider = "zoom" | "google_meet" | "microsoft_teams";

/**
 * Discriminator that controls whether a provider uses the manual-URL entry
 * flow or automatic URL generation via an `IMeetingChannel` adapter.
 *
 * - `"manual"` — the teacher pastes a meeting URL (existing behaviour).
 * - `"zoom_oauth"` — Zoom Server-to-Server OAuth adapter.
 * - `"google_meet_oauth"` — Google Meet service-account JWT + DWD adapter.
 * - `"microsoft_teams_oauth"` — Microsoft Graph client-credentials adapter.
 */
export type MeetingProviderKind = "manual" | "zoom_oauth" | "google_meet_oauth" | "microsoft_teams_oauth";

export type MeetingProviderFieldSchema = {
  readonly requiresMeetingUrl: boolean;
  readonly supportsAutoGeneration?: boolean;
  readonly supportsUsername?: boolean | null;
  readonly supportsPassword?: boolean | null;
  readonly supportsTenantId?: boolean | null;
};

export type MeetingProviderFieldSchemaInput = {
  readonly requiresMeetingUrl: boolean;
  readonly supportsAutoGeneration?: boolean;
  readonly supportsUsername?: boolean | null;
  readonly supportsPassword?: boolean | null;
  readonly supportsTenantId?: boolean | null;
};

export type MeetingProviderSelectType = typeof meetingProviders.$inferSelect;

type MeetingProviderInsertType = typeof meetingProviders.$inferInsert;

export type MeetingProviderSubmitInput = Omit<MeetingProviderInsertType, "id" | "createdAt" | "updatedAt">;

export type UpdateMeetingProviderInput = Partial<MeetingProviderSubmitInput>;
