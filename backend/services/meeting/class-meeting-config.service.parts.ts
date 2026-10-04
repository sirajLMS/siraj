import { queryDb } from "@/backend/db";
import type { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import type { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { EffectiveMeetingSource } from "@/backend/enum";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import {
  type ClassDefaultRow,
  fetchClassDefaults,
  fetchProvidersMap,
  fetchRecurringDefaults,
  fetchTeacherUserDefaults,
} from "@/backend/services/meeting/class-meeting-config.service.queries";
import { buildMeetingProviderCatalogSnapshot } from "@/backend/services/meeting/meeting-config-mask";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import type {
  DBTransaction,
  EffectiveMeetingReturnType,
  MeetingConfigDetails,
  MeetingConfigSnapshot,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export const EMPTY_EFFECTIVE_MEETING: EffectiveMeetingReturnType = {
  joinUrl: null,
  providerSlug: null,
  providerName: null,
  logoUrl: null,
  meetingId: null,
  source: EffectiveMeetingSource.NONE,
  configId: null,
  providerId: null,
  supportsAutoGeneration: false,
};

function extractMeetingId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split("/").findLast(segment => segment !== "");
    return lastSegment ?? null;
  } catch {
    return null;
  }
}

function buildEffectiveFromSnapshot(
  snapshot: MeetingConfigSnapshot,
  source: EffectiveMeetingSource,
  configId: string,
  providerId: string
): EffectiveMeetingReturnType {
  return {
    joinUrl: snapshot.details.meetingUrl ?? null,
    providerSlug: snapshot.provider.catalogSlug,
    providerName: snapshot.provider.catalogName,
    logoUrl: snapshot.provider.logoUrl,
    meetingId: snapshot.details.meetingUrl ? extractMeetingId(snapshot.details.meetingUrl) : null,
    source,
    configId,
    providerId,
    supportsAutoGeneration: snapshot.provider.supportsAutoGeneration,
  };
}

export async function fromClassConfig(
  config: Awaited<ReturnType<typeof ClassMeetingConfigRepository.getDefaultForClassInstance>>,
  source: EffectiveMeetingSource.CLASS | EffectiveMeetingSource.RECURRING,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<EffectiveMeetingReturnType> {
  if (!config) {
    return EMPTY_EFFECTIVE_MEETING;
  }

  const snapshot = await MeetingConfigSnapshotService.buildClassSessionSnapshot(config.id, tErrors, tx);
  return buildEffectiveFromSnapshot(snapshot, source, config.id, config.providerId);
}

async function fromTeacherDefault(
  teacherDefault: Awaited<ReturnType<typeof UserMeetingConfigRepository.getDefaultForUser>>,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<EffectiveMeetingReturnType> {
  if (!teacherDefault) {
    return EMPTY_EFFECTIVE_MEETING;
  }

  const snapshot = await MeetingConfigSnapshotService.buildSessionSnapshot(teacherDefault.id, tErrors, tx);
  return buildEffectiveFromSnapshot(
    snapshot,
    EffectiveMeetingSource.TEACHER,
    teacherDefault.id,
    teacherDefault.providerId
  );
}

export async function resolveTeacherDefault(
  userId: string,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<EffectiveMeetingReturnType> {
  const teacherDefault = await UserMeetingConfigRepository.getDefaultForUser(userId, tx);
  return fromTeacherDefault(teacherDefault, tErrors, tx);
}

type EffectiveConfigSourceRow = {
  id: string;
  providerId: string;
  label: string | null;
  details: MeetingConfigDetails;
};

function buildEffectiveFromConfigRow(
  config: EffectiveConfigSourceRow,
  source: EffectiveMeetingSource,
  providerMap: ReadonlyMap<string, Awaited<ReturnType<typeof MeetingProviderRepository.getById>>>
): EffectiveMeetingReturnType {
  const provider = providerMap.get(config.providerId);
  if (!provider) {
    return EMPTY_EFFECTIVE_MEETING;
  }
  const details = parseMeetingConfigDetails(provider, config.details);
  const snapshot = {
    userMeetingConfigId: config.id,
    providerId: config.providerId,
    label: config.label,
    details,
    provider: buildMeetingProviderCatalogSnapshot(provider),
    snapshottedAt: new Date().toISOString(),
  };
  return buildEffectiveFromSnapshot(snapshot, source, config.id, config.providerId);
}

function resolveEffectiveSelections(args: {
  uniqueInstanceIds: string[];
  classDefaultsMap: ReadonlyMap<string, ClassDefaultRow>;
  recurringDefaultsMap: ReadonlyMap<string, ClassDefaultRow>;
  teacherDefaultsMap: ReadonlyMap<string, Awaited<ReturnType<typeof UserMeetingConfigRepository.getDefaultForUser>>>;
  instanceToRecurringId: ReadonlyMap<string, string>;
  instanceToTeacherUserId: ReadonlyMap<string, string>;
  providerMap: ReadonlyMap<string, Awaited<ReturnType<typeof MeetingProviderRepository.getById>>>;
}): Map<string, EffectiveMeetingReturnType> {
  const resultMap = new Map<string, EffectiveMeetingReturnType>();

  for (const id of args.uniqueInstanceIds) {
    const classConfig = args.classDefaultsMap.get(id);
    const recId = args.instanceToRecurringId.get(id);
    const recConfig = recId ? args.recurringDefaultsMap.get(recId) : undefined;
    const teacherUserId = args.instanceToTeacherUserId.get(id);
    const teacherConfig = teacherUserId ? args.teacherDefaultsMap.get(teacherUserId) : undefined;

    let effective: EffectiveMeetingReturnType = EMPTY_EFFECTIVE_MEETING;
    if (classConfig) {
      effective = buildEffectiveFromConfigRow(classConfig, EffectiveMeetingSource.CLASS, args.providerMap);
    } else if (recConfig) {
      effective = buildEffectiveFromConfigRow(recConfig, EffectiveMeetingSource.RECURRING, args.providerMap);
    } else if (teacherConfig) {
      effective = buildEffectiveFromConfigRow(teacherConfig, EffectiveMeetingSource.TEACHER, args.providerMap);
    }
    resultMap.set(id, effective);
  }

  return resultMap;
}

export async function buildEffectiveMeetingMap(
  classInstanceIds: readonly string[],
  tx?: DBTransaction
): Promise<Map<string, EffectiveMeetingReturnType>> {
  const resultMap = new Map<string, EffectiveMeetingReturnType>();
  if (classInstanceIds.length === 0) {
    return resultMap;
  }

  const client = queryDb(tx);
  const uniqueInstanceIds = [...new Set(classInstanceIds)];
  const providerIds = new Set<string>();

  const classDefaults = await fetchClassDefaults(client, uniqueInstanceIds);
  const classDefaultsMap = classDefaults.defaultsMap;
  for (const pid of classDefaults.providerIds) {
    providerIds.add(pid);
  }

  const unresolvedInstanceIds = uniqueInstanceIds.filter(id => !classDefaultsMap.has(id));
  let recurringDefaultsMap = new Map<string, ClassDefaultRow>();
  let teacherDefaultsMap = new Map<string, Awaited<ReturnType<typeof UserMeetingConfigRepository.getDefaultForUser>>>();
  let instanceToRecurringId = new Map<string, string>();
  let instanceToTeacherUserId = new Map<string, string>();

  if (unresolvedInstanceIds.length > 0) {
    const rec = await fetchRecurringDefaults(client, unresolvedInstanceIds);
    recurringDefaultsMap = rec.recurringDefaultsMap;
    instanceToRecurringId = rec.instanceToRecurringId;
    for (const pid of rec.providerIds) {
      providerIds.add(pid);
    }

    const stillUnresolvedInstanceIds = unresolvedInstanceIds.filter(id => {
      const recId = instanceToRecurringId.get(id);
      return !recId || !recurringDefaultsMap.has(recId);
    });

    const teacher = await fetchTeacherUserDefaults(
      client,
      stillUnresolvedInstanceIds,
      rec.teacherIds,
      rec.instanceTeacherMap
    );
    teacherDefaultsMap = teacher.teacherDefaultsMap;
    instanceToTeacherUserId = teacher.instanceToTeacherUserId;
    for (const pid of teacher.providerIds) {
      providerIds.add(pid);
    }
  }

  const providerMap = await fetchProvidersMap(client, providerIds);

  return resolveEffectiveSelections({
    uniqueInstanceIds,
    classDefaultsMap,
    recurringDefaultsMap,
    teacherDefaultsMap,
    instanceToRecurringId,
    instanceToTeacherUserId,
    providerMap,
  });
}
