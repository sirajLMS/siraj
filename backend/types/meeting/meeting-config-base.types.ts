import type { MeetingProviderSelectType } from "@/backend/types";

/**
 * User meeting config details (JSONB on `user_meeting_configs`).
 * Validated against provider `field_schema` + `url_allowlist` at service boundary.
 *
 * Defined here (not in `meeting-config.types.ts`) to avoid a circular import:
 * `meeting-config.types.ts` imports base types from this file, so the shared
 * `MeetingConfigDetails` type must live here. It is re-exported from
 * `meeting-config.types.ts` for backwards compatibility.
 */
export type MeetingConfigDetails = {
  readonly meetingUrl?: string | null;
  readonly username?: string;
  readonly tenantId?: string;
};

/**
 * Shared fields between `ClassMeetingConfigSelectType` and
 * `UserMeetingConfigSelectType` — extracted to eliminate cross-file
 * type duplication. Both consumer types extend this base.
 */
export type MeetingConfigBaseSelectType = {
  readonly id: string;
  readonly providerId: string;
  readonly label: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret: string | null;
  readonly providerMetadata: Record<string, unknown> | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type MeetingConfigBaseInsertType = {
  readonly id?: string;
  readonly providerId: string;
  readonly label?: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret?: string | null;
  readonly providerMetadata?: Record<string, unknown> | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type MeetingConfigBaseReturnType = MeetingConfigBaseSelectType & {
  readonly hasSecret?: boolean;
  readonly provider?: MeetingProviderSelectType;
};

/**
 * Public (GraphQL) DTO for meeting configs, bound directly by the Pothos
 * `UserMeetingConfig` / `ClassMeetingConfig` objects. The `encryptedSecret`
 * column is structurally excluded — the GraphQL surface only exposes
 * `hasSecret` and the service-layer masked `providerMetadata`, so raw or
 * encrypted secret values can never reach clients through this boundary.
 */
type MeetingConfigPublicReturnType = Omit<MeetingConfigBaseReturnType, "encryptedSecret">;

/**
 * Shared Pothos field-builder shape covering the common GraphQL-exposed
 * fields of the user and class meeting config objects. Derived from
 * {@link MeetingConfigPublicReturnType} so shared field definitions can
 * never reference the sensitive DB fields that the public DTO omits.
 */
export type MeetingConfigPublicShape = Pick<
  MeetingConfigPublicReturnType,
  "providerId" | "provider" | "details" | "hasSecret" | "providerMetadata" | "createdAt" | "updatedAt"
>;

export type MeetingConfigBaseSubmitInput = Omit<
  MeetingConfigBaseInsertType,
  "id" | "createdAt" | "updatedAt" | "encryptedSecret" | "providerMetadata"
> & {
  readonly password?: string | null;
};

/**
 * Repo-level insert input for meeting config helper builders.
 *
 * A subset of {@link MeetingConfigBaseInsertType} — only the fields
 * that {@link buildMeetingConfigInsertValues} needs to construct a
 * DB insert payload (timestamps are added by the builder).
 */
export interface MeetingConfigInsertInput {
  readonly providerId: string;
  readonly label?: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret?: string | null;
  readonly providerMetadata?: Record<string, unknown> | null;
}

/**
 * Repo-level update input for meeting config helper builders.
 *
 * A subset of {@link MeetingConfigBaseInsertType} — only the fields
 * that {@link buildMeetingConfigUpdatePayload} needs to construct a
 * DB update payload.
 */
export interface MeetingConfigUpdateInput {
  readonly providerId: string;
  readonly label?: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret?: string | null;
  readonly providerMetadata?: Record<string, unknown> | null;
}

/** Minimal shape for prepareMeetingConfigUpsert input. */
export interface PrepareMeetingConfigInput {
  readonly providerId: string;
  readonly label?: string | null;
  readonly details: MeetingConfigDetails;
}

/** Context passed to the transform callback of prepareMeetingConfigUpsert. */
export interface PrepareTransformCtx {
  readonly provider: MeetingProviderSelectType;
  readonly details: MeetingConfigDetails;
  readonly providerMetadata: Record<string, unknown> | null;
  readonly encryptedSecret?: string | null;
}
