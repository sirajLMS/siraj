import { eq } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { classInstances, teachers } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import {
  type GenerateMeetingResult,
  MeetingChannelError,
  type MeetingProvider,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import { getMeetingChannel, providerKindToSlug } from "@/backend/services/meeting/channels/MeetingChannelFactory";
import { buildMeetingProviderCatalogSnapshot } from "@/backend/services/meeting/meeting-config-mask";
import type { DBTransaction, MeetingConfigDetails, MeetingConfigSnapshot } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

const MAX_RETRY_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export namespace MeetingConfigSnapshotService {
  async function assembleSnapshot(
    config: { id: string; providerId: string; label: string | null; details: MeetingConfigDetails },
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<MeetingConfigSnapshot> {
    const provider = await MeetingProviderRepository.getByIdOrThrow(config.providerId, tErrors, tx);
    const details = parseMeetingConfigDetails(provider, config.details);

    return {
      userMeetingConfigId: config.id,
      providerId: config.providerId,
      label: config.label,
      details,
      provider: buildMeetingProviderCatalogSnapshot(provider),
      snapshottedAt: new Date().toISOString(),
    };
  }

  export async function buildSessionSnapshot(
    configId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<MeetingConfigSnapshot> {
    const config = await UserMeetingConfigRepository.getByIdOrThrow(configId, tErrors, tx);
    return assembleSnapshot(config, tErrors, tx);
  }

  export async function buildClassSessionSnapshot(
    configId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<MeetingConfigSnapshot> {
    const config = await ClassMeetingConfigRepository.getByIdOrThrow(configId, tErrors, tx);
    return assembleSnapshot(config, tErrors, tx);
  }

  // ─── Booking-time generation (post-commit dispatch) ───────────────────

  /**
   * Resolve the provider for a class instance by checking
   * meetingProviderId first, then falling back to the user meeting config.
   */
  async function resolveProviderForInstance(
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
  async function generateWithRetry(
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

  /**
   * Resolves the meeting config attached to a class instance and generates
   * a meeting URL via the provider adapter if auto-generation is supported.
   *
   * On success: updates `class_instances.meeting_join_url`.
   * On failure: logs `meetingGenerationFailed` and leaves `meeting_join_url NULL`.
   *
   * Bounded retry: 3 attempts with exponential backoff 200ms → 400ms → 800ms.
   *
   * Idempotent: re-running with the same class id overwrites the URL.
   */
  export async function generateAndAttachForClassInstance(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<{ success: boolean; joinUrl: string | null }> {
    const client = queryDb(tx);
    const [instance] = await client
      .select()
      .from(classInstances)
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);

    if (!instance) {
      logger.warn("generateAndAttachForClassInstance: class instance not found", { classInstanceId });
      return { success: false, joinUrl: null };
    }

    const resolved = await resolveProviderForInstance(instance, tx);
    if (!resolved) {
      const isTestServer = process.env.TEST_SERVER === "1";
      if (isTestServer) {
        logger.debug("generateAndAttachForClassInstance: no provider resolved, skipping", {
          classInstanceId,
          providerLookupReason: "no_provider_resolved",
        });
      } else {
        logger.warn("generateAndAttachForClassInstance: no provider resolved, skipping", {
          classInstanceId,
          providerLookupReason: "no_provider_resolved",
        });
      }
      return { success: false, joinUrl: null };
    }

    const provider = await MeetingProviderRepository.getById(resolved.providerId, tx);
    if (!provider) {
      logger.warn("generateAndAttachForClassInstance: provider not found", {
        classInstanceId,
        providerId: resolved.providerId,
      });
      return { success: false, joinUrl: null };
    }

    // Manual provider — no-op (existing path)
    if (provider.providerKind === "manual") {
      logger.info("generateAndAttachForClassInstance: manual provider, skipping", {
        classInstanceId,
        providerKind: provider.providerKind,
      });
      return { success: false, joinUrl: null };
    }

    const slug = providerKindToSlug(provider.providerKind);
    if (!slug) {
      logger.warn("generateAndAttachForClassInstance: unsupported provider kind", {
        classInstanceId,
        providerKind: provider.providerKind,
      });
      return { success: false, joinUrl: null };
    }

    const topic = `Class ${classInstanceId.slice(0, 8)}`;
    const startDateTime = instance.scheduledStartAt?.toISOString();
    const durationMinutes = instance.durationMinutes ?? undefined;

    // Resolve teacherId → userId for per-user OAuth token support
    let actorUserId: string | undefined;
    if (instance.teacherId) {
      const [teacher] = await client
        .select({ userId: teachers.userId })
        .from(teachers)
        .where(eq(teachers.id, instance.teacherId))
        .limit(1);
      if (teacher?.userId) {
        actorUserId = teacher.userId;
      }
    }

    const joinUrl = await generateWithRetry(
      slug,
      { topic, startDateTime, durationMinutes, actorUserId },
      classInstanceId,
      provider.providerKind,
      instance.meetingConfigSnapshot ?? null
    );
    return { success: joinUrl !== null, joinUrl };
  }

  // ─── Class cancel: best-effort deleteMeeting ──────────────────────────

  /**
   * On class cancel, best-effort calls `adapter.deleteMeeting(meetingId)` if
   * the adapter exposes it. Failures are log-only — the class cancel
   * transaction must not be blocked by provider cleanup issues.
   */
  export async function cancelMeetingForClassInstance(classInstanceId: string, tx?: DBTransaction): Promise<void> {
    const client = queryDb(tx);
    const [instance] = await client
      .select()
      .from(classInstances)
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);

    if (!instance?.meetingJoinUrl) {
      return;
    }

    const upstreamMeetingId = instance.meetingConfigSnapshot?.upstreamMeetingId ?? null;
    if (!upstreamMeetingId) {
      logger.warn("cancelMeetingForClassInstance: no upstream meeting ID in snapshot, skipping deleteMeeting", {
        classInstanceId,
      });
      return;
    }

    const meetingConfigId = instance.userMeetingConfigId ?? instance.meetingProviderId;
    if (!meetingConfigId) {
      return;
    }

    let providerIdResolved = instance.meetingProviderId;
    if (!providerIdResolved && instance.userMeetingConfigId) {
      const userConfig = await UserMeetingConfigRepository.getById(instance.userMeetingConfigId, tx);
      providerIdResolved = userConfig?.providerId ?? null;
    }

    if (!providerIdResolved) {
      return;
    }

    const provider = await MeetingProviderRepository.getById(providerIdResolved, tx);
    if (!provider) {
      return;
    }

    const slug = providerKindToSlug(provider.providerKind);
    if (!slug) {
      return;
    }

    try {
      const adapter = await getMeetingChannel(slug);
      if (adapter.deleteMeeting) {
        await adapter.deleteMeeting(upstreamMeetingId);
        logger.info("cancelMeetingForClassInstance: deleted remote meeting", {
          classInstanceId,
          providerKind: provider.providerKind,
        });
      }
    } catch (error) {
      logger.warn("cancelMeetingForClassInstance: best-effort deleteMeeting failed (log-only)", {
        classInstanceId,
        providerKind: provider.providerKind,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
