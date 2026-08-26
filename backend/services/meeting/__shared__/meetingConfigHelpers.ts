import { logger } from "@/backend/lib/logger";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";
import { isMeetingChannelError, maybeGenerateUrl } from "@/backend/services/meeting/utils/maybe-generate-url";
import type { MeetingConfigDetails, MeetingProviderSelectType } from "@/backend/types";;

/**
 * Options shared between class and user meeting config URL generation.
 * Extra fields used only by the user service (e.g. `startDateTime`,
 * `durationMinutes`) are accepted optionally so both call sites can use
 * the same helper.
 */
interface GenerateUrlOptions {
  readonly topic: string;
  readonly startDateTime?: string;
  readonly durationMinutes?: number;
  readonly actorUserId?: string;
}

/**
 * Wraps `maybeGenerateUrl` with typed error handling shared by both
 * `class-meeting-config.service.ts` and `meeting-config.service.ts`.
 *
 * - `MeetingChannelError` subclasses (typed adapter errors) are logged at
 *   `warn` and re-thrown as-is so the caller can surface the
 *   provider-specific message.
 * - Unexpected errors are logged at `error` and re-thrown as a
 *   user-friendly generic error so internal details don't leak to the
 *   client.
 */
export async function safeMaybeGenerateUrl(
  provider: MeetingProviderSelectType,
  details: MeetingConfigDetails,
  options: GenerateUrlOptions,
  friendlyMessage: string
): Promise<{
  details: MeetingConfigDetails;
  providerMetadata: Record<string, unknown> | null;
  encryptedSecret?: string | null;
}> {
  try {
    return await maybeGenerateUrl(provider, details, options);
  } catch (error) {
    if (isMeetingChannelError(error)) {
      logger.warn("safeMaybeGenerateUrl: typed adapter error", {
        providerKind: provider.providerKind,
        slug: provider.slug,
        code: error.code,
        message: error.message,
      });
      throw error;
    }
    logger.error("safeMaybeGenerateUrl: unexpected error during URL generation", {
      providerKind: provider.providerKind,
      slug: provider.slug,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(friendlyMessage, { cause: error });
  }
}

/**
 * Batch-resolves `MeetingProviderSelectType` rows for a list of configs
 * by extracting unique `providerId` values and delegating to
 * `MeetingProviderCatalogService.getProvidersByIds`.
 *
 * Shared by both class and user meeting config services because the
 * resolution logic is identical regardless of the config entity type —
 * both config types expose a readonly `providerId: string` field.
 */
export function resolveProvidersForConfigs(
  configs: readonly { readonly providerId: string }[]
): Promise<Map<string, MeetingProviderSelectType>> {
  const ids = [...new Set(configs.map(c => c.providerId))];
  return MeetingProviderCatalogService.getProvidersByIds(ids);
}
