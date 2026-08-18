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

// ============================================================================
// Provider metadata — upstream-returned data per provider kind
// ============================================================================

/** Metadata returned by Zoom after meeting creation. */
export type ZoomProviderMetadata = {
  readonly kind: "zoom_oauth";
  readonly meetingId: string;
  readonly hostUrl?: string;
  readonly password?: string;
  readonly [key: string]: unknown;
};

/** Metadata returned by Google Meet after space creation. */
export type GoogleMeetProviderMetadata = {
  readonly kind: "google_meet_oauth";
  readonly spaceName: string;
  readonly [key: string]: unknown;
};

/** Metadata returned by Microsoft Teams after online meeting creation. */
export type MicrosoftTeamsProviderMetadata = {
  readonly kind: "microsoft_teams_oauth";
  readonly meetingId: string;
  readonly [key: string]: unknown;
};

/** Manual providers carry no upstream metadata. */
export type ManualProviderMetadata = {
  readonly kind: "manual";
  readonly [key: string]: unknown;
};

/**
 * Discriminated union of provider metadata shapes keyed by `MeetingProviderKind`.
 * Used to type the `providerMetadata` JSONB column on meeting config rows.
 *
 * When passed a specific `Kind` (e.g. `MeetingProviderMetadata<"zoom_oauth">`),
 * the union narrows to only the member whose `kind` discriminant matches.
 * Without a parameter the default `string` yields the full union, preserving
 * backward compatibility for existing unconstrained usage.
 */
export type MeetingProviderMetadata<Kind extends string = string> = Extract<
  ZoomProviderMetadata | GoogleMeetProviderMetadata | MicrosoftTeamsProviderMetadata | ManualProviderMetadata,
  { kind: Kind }
>;

export type MeetingProviderSelectType = typeof meetingProviders.$inferSelect;

export type MeetingProviderInsertType = typeof meetingProviders.$inferInsert;

export type MeetingProviderSubmitInput = Omit<MeetingProviderInsertType, "id" | "createdAt" | "updatedAt">;

export type UpdateMeetingProviderInput = Partial<MeetingProviderSubmitInput>;
