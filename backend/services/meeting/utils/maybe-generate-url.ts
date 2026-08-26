import { logger } from "@/backend/lib/logger";
import { MeetingChannelError } from "@/backend/services/meeting/channels/IMeetingChannel";;
import { meetingChannel } from "@/backend/services/meeting/channels/MeetingChannelFactory";
import type { MeetingConfigDetails, MeetingProviderSelectType } from "@/backend/types";

export interface MaybeGenerateUrlResult {
  readonly details: MeetingConfigDetails;
  readonly providerMetadata: Record<string, unknown> | null;
  readonly encryptedSecret?: string | null;
}

/**
 * Decides whether to auto-generate a meeting URL via the provider adapter
 * or use a user-supplied URL (manual override).
 *
 * - **Manual provider** → return details unchanged (existing path).
 * - **Auto provider + blank meetingUrl** → call adapter, set meetingUrl + providerMetadata.
 * - **Auto provider + user-supplied meetingUrl** → accept as-is (manual override), no generation.
 *
 * Typed errors from the adapter layer (e.g. `ZoomApiError`, `RateLimitedError`)
 * are allowed to propagate to the service layer, which surfaces them to the resolver.
 */
export async function maybeGenerateUrl(
  provider: MeetingProviderSelectType,
  details: MeetingConfigDetails,
  options: {
    readonly topic: string;
    readonly startDateTime?: string;
    readonly durationMinutes?: number;
    readonly actorUserId?: string;
  }
): Promise<MaybeGenerateUrlResult> {
  // Manual provider — existing path, no generation.
  if (provider.providerKind === "manual") {
    return { details, providerMetadata: null };
  }

  const hasUserUrl = Boolean(details.meetingUrl && details.meetingUrl.trim() !== "");

  // Auto provider with user-supplied URL — manual override, skip generation.
  if (hasUserUrl) {
    return { details, providerMetadata: null };
  }

  // Auto provider, no user URL — generate via adapter.
  logger.info("Auto-generating meeting URL", {
    providerKind: provider.providerKind,
    slug: provider.slug,
  });

  const result = await meetingChannel.generateMeeting(provider.providerKind, {
    topic: options.topic,
    startDateTime: options.startDateTime,
    durationMinutes: options.durationMinutes,
    actorUserId: options.actorUserId,
  });

  return {
    details: { ...details, meetingUrl: result.joinUrl },
    providerMetadata: result.providerMetadata ?? null,
    encryptedSecret: result.password ?? null,
  };
}

/**
 * Type guard for `MeetingChannelError` — useful for service-level catch blocks
 * to decide whether to re-throw a typed error or wrap an unexpected exception.
 */
export function isMeetingChannelError(error: unknown): error is MeetingChannelError {
  return error instanceof MeetingChannelError;
}
