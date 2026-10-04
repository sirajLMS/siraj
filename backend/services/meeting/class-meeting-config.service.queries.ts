import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import type { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import type { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import {
  classInstances,
  classMeetingConfigs,
  meetingProviders,
  teachers,
  userMeetingConfigs,
} from "@/backend/db/schema";
import type { DBQueryExecutor, DBTransaction } from "@/backend/types";

export type ClassDefaultRow = typeof classMeetingConfigs.$inferSelect;

export async function getTeacherUserId(teacherId: string, tx?: DBTransaction): Promise<string | null> {
  const client = tx ?? db;
  const [row] = await client
    .select({ userId: teachers.userId })
    .from(teachers)
    .where(eq(teachers.id, teacherId))
    .limit(1);
  return row?.userId ?? null;
}

export async function fetchClassDefaults(
  client: DBQueryExecutor,
  uniqueInstanceIds: string[]
): Promise<{ defaultsMap: Map<string, ClassDefaultRow>; providerIds: string[] }> {
  const classDefaults = await client
    .select()
    .from(classMeetingConfigs)
    .where(
      and(inArray(classMeetingConfigs.classInstanceId, uniqueInstanceIds), eq(classMeetingConfigs.isDefault, true))
    );

  const defaultsMap = new Map<string, ClassDefaultRow>();
  const providerIds = new Set<string>();
  for (const config of classDefaults) {
    if (config.classInstanceId) {
      defaultsMap.set(config.classInstanceId, config);
      providerIds.add(config.providerId);
    }
  }
  return { defaultsMap, providerIds: [...providerIds] };
}

export async function fetchRecurringDefaults(
  client: DBQueryExecutor,
  unresolvedInstanceIds: string[]
): Promise<{
  recurringDefaultsMap: Map<string, ClassDefaultRow>;
  instanceToRecurringId: Map<string, string>;
  instanceTeacherMap: Map<string, string>;
  teacherIds: Set<string>;
  providerIds: string[];
}> {
  const instanceRows = await client
    .select({
      id: classInstances.id,
      recurringScheduleId: classInstances.recurringScheduleId,
      teacherId: classInstances.teacherId,
    })
    .from(classInstances)
    .where(inArray(classInstances.id, unresolvedInstanceIds));

  const recurringScheduleIds = new Set<string>();
  const teacherIds = new Set<string>();
  const instanceToRecurringId = new Map<string, string>();
  const instanceTeacherMap = new Map<string, string>();
  for (const row of instanceRows) {
    if (row.recurringScheduleId) {
      recurringScheduleIds.add(row.recurringScheduleId);
      instanceToRecurringId.set(row.id, row.recurringScheduleId);
    }
    if (row.teacherId) {
      teacherIds.add(row.teacherId);
      instanceTeacherMap.set(row.id, row.teacherId);
    }
  }

  const recurringDefaultsMap = new Map<string, ClassDefaultRow>();
  const providerIds = new Set<string>();
  if (recurringScheduleIds.size === 0) {
    return { recurringDefaultsMap, instanceToRecurringId, instanceTeacherMap, teacherIds, providerIds: [] };
  }

  const recurringDefaults = await client
    .select()
    .from(classMeetingConfigs)
    .where(
      and(
        inArray(classMeetingConfigs.recurringScheduleId, [...recurringScheduleIds]),
        eq(classMeetingConfigs.isDefault, true)
      )
    );
  for (const config of recurringDefaults) {
    if (config.recurringScheduleId) {
      recurringDefaultsMap.set(config.recurringScheduleId, config);
      providerIds.add(config.providerId);
    }
  }
  return {
    recurringDefaultsMap,
    instanceToRecurringId,
    instanceTeacherMap,
    teacherIds,
    providerIds: [...providerIds],
  };
}

export async function fetchTeacherUserDefaults(
  client: DBQueryExecutor,
  stillUnresolvedInstanceIds: string[],
  teacherIds: Set<string>,
  instanceTeacherMap: Map<string, string>
): Promise<{
  teacherDefaultsMap: Map<string, Awaited<ReturnType<typeof UserMeetingConfigRepository.getDefaultForUser>>>;
  instanceToTeacherUserId: Map<string, string>;
  providerIds: string[];
}> {
  type TeacherDefaultRow = NonNullable<Awaited<ReturnType<typeof UserMeetingConfigRepository.getDefaultForUser>>>;
  const teacherDefaultsMap = new Map<string, TeacherDefaultRow | null>();
  const instanceToTeacherUserId = new Map<string, string>();
  const providerIds = new Set<string>();

  if (stillUnresolvedInstanceIds.length === 0 || teacherIds.size === 0) {
    return { teacherDefaultsMap, instanceToTeacherUserId, providerIds: [] };
  }

  const teacherRows = await client
    .select({ id: teachers.id, userId: teachers.userId })
    .from(teachers)
    .where(inArray(teachers.id, [...teacherIds]));

  const teacherToUserMap = new Map(teacherRows.map(t => [t.id, t.userId]));
  for (const instId of stillUnresolvedInstanceIds) {
    const tId = instanceTeacherMap.get(instId);
    const uId = tId ? teacherToUserMap.get(tId) : undefined;
    if (uId) {
      instanceToTeacherUserId.set(instId, uId);
    }
  }

  const userIds = [...new Set(teacherRows.map(t => t.userId))];
  if (userIds.length > 0) {
    const userDefaults = await client
      .select()
      .from(userMeetingConfigs)
      .where(and(inArray(userMeetingConfigs.userId, userIds), eq(userMeetingConfigs.isDefault, true)));
    for (const config of userDefaults) {
      teacherDefaultsMap.set(config.userId, config);
      providerIds.add(config.providerId);
    }
  }

  return { teacherDefaultsMap, instanceToTeacherUserId, providerIds: [...providerIds] };
}

export async function fetchProvidersMap(client: DBQueryExecutor, providerIds: Set<string>) {
  const providerMap = new Map<string, Awaited<ReturnType<typeof MeetingProviderRepository.getById>>>();
  if (providerIds.size === 0) {
    return providerMap;
  }
  const providers = await client
    .select()
    .from(meetingProviders)
    .where(inArray(meetingProviders.id, [...providerIds]));
  for (const p of providers) {
    providerMap.set(p.id, p);
  }
  return providerMap;
}
