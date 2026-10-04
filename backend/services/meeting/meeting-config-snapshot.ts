import { eq } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { classInstances, teachers } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { getMeetingChannel, providerKindToSlug } from "@/backend/services/meeting/channels/MeetingChannelFactory";
import { buildMeetingProviderCatalogSnapshot } from "@/backend/services/meeting/meeting-config-mask";
import {
  generateWithRetry,
  resolveProviderForInstance,
} from "@/backend/services/meeting/meeting-config-snapshot.helpers";
import type { DBTransaction, MeetingConfigDetails, MeetingConfigSnapshot } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

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
      logger.logDomainError("generateAndAttachForClassInstance: no provider resolved, skipping", {
        classInstanceId,
        providerLookupReason: "no_provider_resolved",
      });
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
