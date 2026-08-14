import { type Column, eq, isNull } from "drizzle-orm";
import type { MeetingConfigDetails } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Label equality helper — `eq(labelColumn, label)` when label is truthy,
 * `isNull(labelColumn)` when label is null/undefined.
 *
 * Shared between `classMeetingConfigs` and `userMeetingConfigs` repos
 * to eliminate the identical `labelCondition` function duplicated in both.
 */
export function labelCondition(labelColumn: Column, label: string | null | undefined) {
  return label ? eq(labelColumn, label) : isNull(labelColumn);
}

/**
 * Returns the row if non-null, otherwise throws `meetingConfigNotFound`.
 *
 * Shared between both meeting config repos — each repo's `getByIdOrThrow`
 * delegates here after fetching the row, eliminating the duplicated
 * null-check + throw pattern.
 */
export function requireConfigOrThrow<TSelect>(row: TSelect | null, id: string, tErrors: ErrorsLabels): TSelect {
  if (row) return row;
  throw new Error(tErrors.meetingConfigNotFound(id));
}

interface MeetingConfigInsertInput {
  readonly providerId: string;
  readonly label?: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret?: string | null;
  readonly providerMetadata?: Record<string, unknown> | null;
}

/**
 * Shared insert values builder for meeting config repos.
 *
 * Both `class-meeting-config` and `user-meeting-config` repos build the
 * same core insert payload (providerId, label, isDefault, details,
 * encryptedSecret, providerMetadata, createdAt, updatedAt). Extracting
 * this eliminates the jscpd clone between the two `create` methods.
 */
export function buildMeetingConfigInsertValues(input: MeetingConfigInsertInput, now: Date) {
  return {
    providerId: input.providerId,
    label: input.label ?? null,
    isDefault: input.isDefault,
    details: input.details,
    encryptedSecret: input.encryptedSecret ?? null,
    providerMetadata: input.providerMetadata ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

interface MeetingConfigUpdateInput {
  readonly providerId: string;
  readonly label?: string | null;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetails;
  readonly encryptedSecret?: string | null;
  readonly providerMetadata?: Record<string, unknown> | null;
}

/**
 * Shared update payload builder for meeting config repos.
 *
 * Both repos' `upsertMany` pass the same set of fields to `update`:
 * label, isDefault, details, encryptedSecret, providerId, providerMetadata.
 * Extracting this eliminates the jscpd clone between the two `upsertMany`
 * methods.
 */
export function buildMeetingConfigUpdatePayload(input: MeetingConfigUpdateInput) {
  return {
    label: input.label ?? null,
    isDefault: input.isDefault,
    details: input.details,
    encryptedSecret: input.encryptedSecret ?? null,
    providerId: input.providerId,
    providerMetadata: input.providerMetadata ?? null,
  };
}
