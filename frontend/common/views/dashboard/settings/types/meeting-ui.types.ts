import type {
  ClassMeetingConfigsWithStatusQuery_classMeetingConfigs,
  GenerateMeetingUrlMutation_generateMeetingUrl,
  TestMeetingConnectionResultFieldsFragment,
  UserMeetingConfigFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";

// ============================================================================
// Gap-only extensions over codegen types
// ============================================================================
// Types below use Pick/Omit/intersection over the canonical codegen types
// (`@/frontend/common/graphql/generated/gql/graphql` and `/operations`).
// Only genuinely-UI-only unions with no codegen equivalent are declared here.
// See plan-review finding C3 (FIXED): no local re-declaration of codegen types.
// ============================================================================

// ---------------------------------------------------------------------------
// UI-only status unions (no codegen equivalent)
// ---------------------------------------------------------------------------

/**
 * Tracks the lifecycle of a "test connection" button click in the UI.
 * The backend `TestMeetingConnectionResult` does not expose a "pending" state —
 * this union models the frontend's pre/post-click toggle state.
 */
export type TestConnectionState = "idle" | "testing" | "success" | "failure";

/**
 * Meeting URL generation status as understood by the UI.
 * `pending` and `expired` are pure UI states with no GraphQL enum counterpart.
 * `generated` and `failed` map to backend `meetingUrlStatus` string values
 * surfaced via the nullable `ClassMeetingConfig.meetingUrlStatus` field.
 */
export type GenerationStatus = "pending" | "generated" | "failed" | "expired";

/**
 * OAuth connection status as understood by the UI.
 * Used by the profile meeting-configs view's connect/disconnect/reconnect flow.
 * Derived from `oauthTokenExpiresAt` presence + `expiresAt` thresholds.
 */
export type OAuthConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected";

/**
 * Distinguishes whether the credential form dialog is creating new
 * provider credentials or editing existing ones.
 */
export type CredentialFormMode = "create" | "edit";

// ---------------------------------------------------------------------------
// Gap-only structures (derive field shapes from codegen types)
// ---------------------------------------------------------------------------

/**
 * Subset of {@link ClassMeetingConfig} fields relevant to the
 * class-meeting-config status UI — combined with the new meeting-URL-status
 * fields added by the prerequisite Pothos schema update.
 */
export type ClassMeetingConfigWithStatus = Pick<
  ClassMeetingConfigsWithStatusQuery_classMeetingConfigs,
  "id" | "classInstanceId" | "meetingUrlStatus" | "meetingUrlExpiresAt" | "meetingUrlError"
> & {
  /** Nested provider slug, resolved via `provider { slug }` — nullable in codegen. */
  readonly providerSlug: string | null;
};

/**
 * Non-null extraction of the codegen `meetingUrlStatus` field so downstream
 * tasks can narrow `string | null` to the known UI union when non-null.
 */
export type MeetingUrlStatusValue = NonNullable<
  ClassMeetingConfigsWithStatusQuery_classMeetingConfigs["meetingUrlStatus"]
>;

/**
 * Shape of an existing user-meeting-config row as displayed in the profile
 * configs table. Extends the codegen fragment with the new status fields.
 */
export type UserMeetingConfigRow = Pick<
  UserMeetingConfigFieldsFragment,
  "id" | "providerId" | "label" | "isDefault" | "hasSecret" | "oauthTokenExpiresAt"
> & {
  /** URL generation status — nullable until backend populates it. */
  readonly meetingUrlStatus: ClassMeetingConfigsWithStatusQuery_classMeetingConfigs["meetingUrlStatus"];
  /** URL expiration datetime — nullable until backend populates it. */
  readonly meetingUrlExpiresAt: ClassMeetingConfigsWithStatusQuery_classMeetingConfigs["meetingUrlExpiresAt"];
  /** URL generation error message — nullable until backend populates it. */
  readonly meetingUrlError: ClassMeetingConfigsWithStatusQuery_classMeetingConfigs["meetingUrlError"];
  /** Provider slug resolved via nested `provider { slug }` selection. */
  readonly providerSlug: string | null;
};

// ---------------------------------------------------------------------------
// UI-only provider endpoint / token metadata shapes
// ---------------------------------------------------------------------------

/**
 * UI-only provider endpoint descriptor for the settings endpoint list.
 * The backend `MeetingProvider.urlAllowlist` is `string[]` — this structure
 * normalizes the display shape (`name`/`url`/`method`) for the UI list.
 */
export interface ProviderEndpoint {
  readonly name: string;
  readonly url: string;
  readonly method: "GET" | "POST";
}

/**
 * UI-only token metadata for the settings token-metadata dialog.
 * Fields are derived from the codegen `MeetingIntegrationConnectedAccount`
 * fragment (See {@link MeetingIntegrationConnectedAccountFieldsFragment}).
 */
export interface TokenMetadata {
  readonly issuedAt: string;
  readonly expiresAt: string | null;
  readonly scopes: readonly string[];
  readonly tokenType: string;
}

/**
 * UI-only normalized test-connection result for the result panel.
 * Maps codegen fragment fields to display-friendly shapes.
 */
export type TestConnectionResult = Pick<
  TestMeetingConnectionResultFieldsFragment,
  "ok" | "latencyMs" | "errorCode" | "errorMessage"
> & {
  readonly endpoint: string | null;
  readonly authStatus: string | null;
};

// ---------------------------------------------------------------------------
// Generation preview result (from `generateMeetingUrl` mutation)
// ---------------------------------------------------------------------------

/**
 * Preview URL result shape derived from the codegen mutation operation.
 * Used by the "preview URL" callout in the profile meeting-configs view.
 */
export type GenerateMeetingUrlPreview = Pick<
  GenerateMeetingUrlMutation_generateMeetingUrl,
  "joinUrl" | "meetingId" | "expiresAt"
>;
