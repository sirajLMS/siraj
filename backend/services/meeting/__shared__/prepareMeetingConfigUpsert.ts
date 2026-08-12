import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { safeMaybeGenerateUrl } from "@/backend/services/meeting/__shared__/meetingConfigHelpers";
import type { DBTransaction } from "@/backend/types";
import type { MeetingConfigDetails } from "@/backend/types/meeting";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Minimal shape that every input to
 * {@link prepareMeetingConfigUpsert} must satisfy. Both
 * `UserMeetingConfigSubmitInput` and `ClassMeetingConfigInsertType` extend
 * `MeetingConfigBaseInsertType` / `MeetingConfigBaseSubmitInput`, which
 * guarantees these fields exist.
 */
interface PrepareMeetingConfigInput {
  readonly providerId: string;
  readonly label?: string | null;
  readonly details: MeetingConfigDetails;
}

/**
 * Context passed to the `transform` callback of
 * {@link prepareMeetingConfigUpsert}.
 *
 * The provider, parsed details, and the result of `safeMaybeGenerateUrl`
 * (normalised details, provider metadata, optional encrypted secret) are
 * provided so callers can build their entity-specific upsert payload without
 * duplicating the batch-fetch / validate / generate pipeline.
 */
interface PrepareTransformCtx {
  readonly provider: MeetingProviderSelectType;
  readonly details: MeetingConfigDetails;
  readonly providerMetadata: Record<string, unknown> | null;
  readonly encryptedSecret?: string | null;
}

/**
 * Capture the duplicated "prepare" pipeline shared by
 * `upsertManyUserMeetingConfigs` and `upsertManyClassMeetingConfigs`.
 *
 * Pipeline:
 * 1. Batch-fetch all providers in a single query (`MeetingProviderRepository.getByIds`).
 * 2. Build a provider map keyed by id.
 * 3. Validate every input has a matching provider (throws
 *    `tErrors.meetingProviderNotFound(providerId)` otherwise).
 * 4. Parallelise adapter URL generation via `Promise.all`.
 * 5. For each input: look up the provider, parse the details, call
 *    `safeMaybeGenerateUrl` with `topic: input.label ?? options.topicDefault`,
 *    then delegate to the caller-supplied `transform` callback to produce the
 *    prepared result.
 *
 * The `transform` callback receives the original input plus the ctx with
 * the provider, normalised `details`, `providerMetadata`, and optional
 * `encryptedSecret` so each caller can shape its payload without re-running
 * the shared pipeline.
 */
export async function prepareMeetingConfigUpsert<TInput extends PrepareMeetingConfigInput, TPrepared>(
  inputs: readonly TInput[],
  options: {
    readonly topicDefault: string;
    readonly tx?: DBTransaction;
    readonly tErrors: ErrorsLabels;
  },
  transform: (input: TInput, ctx: PrepareTransformCtx) => TPrepared
): Promise<TPrepared[]> {
  if (inputs.length === 0) return [];

  const { topicDefault, tx, tErrors } = options;

  // Batch-fetch all providers in a single query instead of N sequential calls
  const providerIds = [...new Set(inputs.map(({ providerId }) => providerId))];
  const providerRows = await MeetingProviderRepository.getByIds(providerIds, tx);
  const providerMap = new Map(providerRows.map(p => [p.id, p]));

  // Validate all inputs have a matching provider before any adapter work
  validateProviders(inputs, providerMap, tErrors);

  // Parallelise adapter URL generation across all inputs
  return Promise.all(
    inputs.map(async input => {
      const provider = providerMap.get(input.providerId);
      // Defensive — validated above, but narrowing for TS
      if (!provider) {
        throw new Error(tErrors.meetingProviderNotFound(input.providerId));
      }
      const parsedDetails = parseMeetingConfigDetails(provider, input.details);
      const { details, providerMetadata, encryptedSecret } = await safeMaybeGenerateUrl(
        provider,
        parsedDetails,
        {
          topic: input.label ?? topicDefault,
        },
        tErrors.meetingConfigCreateFailed
      );
      return transform(input, {
        provider,
        details,
        providerMetadata,
        encryptedSecret,
      });
    })
  );
}

/**
 * Validates that every input has a matching provider in the map. Throws
 * `tErrors.meetingProviderNotFound(providerId)` for the first missing
 * provider so callers get a clear, i18n-aware error before any adapter work.
 */
function validateProviders(
  inputs: readonly PrepareMeetingConfigInput[],
  providerMap: Map<string, MeetingProviderSelectType>,
  tErrors: ErrorsLabels
): void {
  for (const { providerId } of inputs) {
    if (!providerMap.has(providerId)) {
      throw new Error(tErrors.meetingProviderNotFound(providerId));
    }
  }
}
