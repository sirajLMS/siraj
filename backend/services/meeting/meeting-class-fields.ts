import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { teachers } from "@/backend/db/schema";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import type { MeetingConfigSnapshot } from "@/backend/types/meeting/meeting-config.types";

export type ClassMeetingFields = {
  readonly meetingJoinUrl: string | null;
  readonly meetingConfigSnapshot: MeetingConfigSnapshot | null;
};

async function getTeacherUserId(teacherId: string, tx?: DBTransaction): Promise<string | null> {
  const client = tx ?? db;
  const [row] = await client
    .select({ userId: teachers.userId })
    .from(teachers)
    .where(eq(teachers.id, teacherId))
    .limit(1);
  return row?.userId ?? null;
}

export namespace MeetingClassFieldsService {
  export async function resolveForTeacher(
    teacherId: string,
    options?: { readonly explicitMeetingJoinUrl?: string | null; readonly tx?: DBTransaction }
  ): Promise<ClassMeetingFields> {
    const { explicitMeetingJoinUrl, tx } = options ?? {};

    if (explicitMeetingJoinUrl !== undefined) {
      return { meetingJoinUrl: explicitMeetingJoinUrl, meetingConfigSnapshot: null };
    }

    const userId = await getTeacherUserId(teacherId, tx);
    if (!userId) {
      return { meetingJoinUrl: null, meetingConfigSnapshot: null };
    }

    const defaultConfig = await UserMeetingConfigRepository.getDefaultForUser(userId, tx);
    if (!defaultConfig) {
      return { meetingJoinUrl: null, meetingConfigSnapshot: null };
    }

    const snapshot = await MeetingConfigSnapshotService.buildSessionSnapshot(defaultConfig.id, tx);
    return {
      meetingJoinUrl: snapshot.details.meetingUrl,
      meetingConfigSnapshot: snapshot,
    };
  }

  export async function applyToInsertInput<T extends { teacherId: string; meetingJoinUrl?: string | null }>(
    input: T,
    tx?: DBTransaction
  ): Promise<T & ClassMeetingFields> {
    if (input.meetingJoinUrl !== undefined) {
      return {
        ...input,
        meetingJoinUrl: input.meetingJoinUrl,
        meetingConfigSnapshot: null,
      };
    }

    const fields = await resolveForTeacher(input.teacherId, { tx });
    return { ...input, ...fields };
  }
}
