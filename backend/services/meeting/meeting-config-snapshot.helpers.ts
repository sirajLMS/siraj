import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { classInstances } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import { MeetingChannelError } from "@/backend/services/meeting/channels/IMeetingChannel";
import { getMeetingChannel } from "@/backend/services/meeting/channels/MeetingChannelFactory";
import type { DBTransaction, GenerateMeetingResult, MeetingConfigSnapshot, MeetingProvider } from "@/backend/types";

const MAX_RETRY_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Resolve the provider for a class instance by checking
 * meetingProviderId first, then falling back to the user meeting config.
 */
export async function resolveProviderForInstance(
  instance: { readonly meetingProviderId: string | null; readonly userMeetingConfigId: string | null },
  tx?: DBTransaction
): Promise<{ readonly providerId: string } | null> {
  if (instance.meetingProviderId) {
    return { providerId: instance.meetingProviderId };
  }
  if (instance.userMeetingConfigId) {
    const userConfig = await UserMeetingConfigRepository.getById(instance.userMeetingConfigId, tx);
    if (userConfig?.providerId) {
      return { providerId: userConfig.providerId };
    }
  }
  return null;
}

/** Persist the generated join URL + updated snapshot to the class instance row. */
async function persistGeneratedUrl(
  classInstanceId: string,
  slug: MeetingProvider,
  result: GenerateMeetingResult,
  existingSnapshot: MeetingConfigSnapshot | null
): Promise<void> {
  const upstreamMeetingId = result.meetingId ?? null;
  const autoFields = {
    upstreamMeetingId,
    providerMetadata: result.providerMetadata ?? existingSnapshot?.providerMetadata ?? null,
  };

  const updatedSnapshot: MeetingConfigSnapshot | null = existingSnapshot
    ? { ...existingSnapshot, ...autoFields }
    : {
        ...autoFields,
        userMeetingConfigId: null,
        providerId: "",
        label: null,
        details: { meetingUrl: result.joinUrl },
        provider: {
          catalogId: "",
          catalogSlug: slug,
          catalogName: { en: slug, ar: slug },
          logoUrl: null,
          supportsAutoGeneration: true,
        },
        snapshottedAt: new Date().toISOString(),
      };

  await db
    .update(classInstances)
    .set({
      meetingJoinUrl: result.joinUrl,
      meetingConfigSnapshot: updatedSnapshot,
      updatedAt: new Date(),
    })
    .where(eq(classInstances.id, classInstanceId));
}

/** Returns true if the error is non-retryable (should stop retrying). */
function isNonRetryable(error: unknown): error is MeetingChannelError {
  return error instanceof MeetingChannelError && !error.retryable;
}

/**
 * Attempt to generate a meeting URL via the adapter with bounded retry.
 * Returns the join URL on success, or null after all attempts are exhausted.
 */
export async function generateWithRetry(
  slug: MeetingProvider,
  input: {
    readonly topic: string;
    readonly startDateTime?: string;
    readonly durationMinutes?: number;
    readonly actorUserId?: string;
  },
  classInstanceId: string,
  providerKind: string,
  existingSnapshot: MeetingConfigSnapshot | null
): Promise<string | null> {
  let lastError: unknown = null;

  async function attempt(n: number): Promise<string | null> {
    if (n > MAX_RETRY_ATTEMPTS) {
      return null;
    }

    try {
      const adapter = await getMeetingChannel(slug);
      const result: GenerateMeetingResult = await adapter.generateMeeting({
        topic: input.topic,
        startDateTime: input.startDateTime,
        durationMinutes: input.durationMinutes,
        actorUserId: input.actorUserId,
      });

      await persistGeneratedUrl(classInstanceId, slug, result, existingSnapshot);

      logger.info("generateAndAttachForClassInstance: success", {
        classInstanceId,
        attempt: n,
        joinUrl: result.joinUrl,
        upstreamMeetingId: result.meetingId ?? null,
      });

      return result.joinUrl;
    } catch (error) {
      lastError = error;
      logger.warn("generateAndAttachForClassInstance: attempt failed", {
        classInstanceId,
        attempt: n,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        error: error instanceof Error ? error.message : String(error),
        isMeetingChannelError: error instanceof MeetingChannelError,
      });

      if (isNonRetryable(error)) {
        logger.warn("generateAndAttachForClassInstance: non-retryable error, skipping retries", {
          classInstanceId,
          attempt: n,
          code: error.code,
          error: error.message,
        });
        return null;
      }

      if (n < MAX_RETRY_ATTEMPTS) {
        await sleep(BASE_BACKOFF_MS * 2 ** (n - 1));
      }

      return attempt(n + 1);
    }
  }

  const joinUrl = await attempt(1);

  if (joinUrl === null) {
    logger.error("generateAndAttachForClassInstance: meetingGenerationFailed", {
      classInstanceId,
      providerKind,
      attempts: MAX_RETRY_ATTEMPTS,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });
  }

  return joinUrl;
}
