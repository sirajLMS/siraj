import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teachers } from "@/backend/db/schema/teachers";
import { users } from "@/backend/db/schema/users";
import {
  ALL_ACCOUNT_STATUSES,
  cycleAtIndex,
  getAvatarFileName,
  loadSeedConfig,
  pickTimezoneForIndex,
  type SeedConfig,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import logger from "@/backend/lib/logger";
import type { TimezoneEntity, UserSelectType } from "@/backend/types";

async function upsertTeacher(userId: string, timezoneIana: string, status: string, now: Date) {
  await db.update(users).set({ timezone: timezoneIana, updatedAt: now }).where(eq(users.id, userId));

  const [insertedTeacher] = await db
    .insert(teachers)
    .values({
      userId,
      status,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: teachers.userId,
      set: {
        status,
        updatedAt: now,
      },
    })
    .returning();

  return insertedTeacher;
}

function resolveTimezone(timezones: TimezoneEntity[], ianaId: string): TimezoneEntity {
  const match = timezones.find(t => t.ianaId === ianaId);
  if (!match) {
    throw new Error(`Timezone not found: ${ianaId}`);
  }
  return match;
}

export async function seedOrGet(users: UserSelectType[], timezones: TimezoneEntity[], config?: SeedConfig) {
  logger.info("Seeding system teachers...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  const defaultTimezone = timezones.find(t => t.ianaId === IanaTimezone.UTC) || timezones[0];
  if (!defaultTimezone) {
    throw new Error("No timezones found in seed data.");
  }

  const teacherUsers = users.filter(
    u => u.email === "teacher@siraj.local" || /^teacher-\d+@seed\.siraj\.local$/.test(u.email)
  );

  if (teacherUsers.length === 0) {
    throw new Error("No teacher users found in seed data.");
  }

  const results = [];
  for (let i = 0; i < teacherUsers.length; i++) {
    const user = teacherUsers[i];
    const tzIana = i === 0 ? IanaTimezone.UTC : pickTimezoneForIndex(i);
    resolveTimezone(timezones, tzIana);
    const status = i === 0 ? ALL_ACCOUNT_STATUSES[0] : cycleAtIndex(ALL_ACCOUNT_STATUSES, i);
    const teacher = await upsertTeacher(user.id, tzIana, status, now);

    if (shouldSeedExtendedFiles(seedConfig)) {
      try {
        const avatarFile = getAvatarFileName(i, 4);
        await seedEntityFile({
          assetRelativePath: `avatars/teachers/${avatarFile}`,
          bucketPath: `public/avatars/teachers/${avatarFile}`,
          referenceTable: "teachers",
          referenceId: teacher.id,
          usageType: "avatar",
          ensureParentDirs: ["public/avatars/teachers"],
        });
      } catch (error) {
        logger.error(`Failed to seed teacher avatar for ${teacher.id}:`, error);
      }
    }

    results.push(teacher);
  }

  logger.info(`System teachers seeded (${results.length} total).`);
  return results;
}
