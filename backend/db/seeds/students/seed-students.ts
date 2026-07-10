import {
  ALL_STUDENT_STATUSES,
  buildStudentName,
  cycleAtIndex,
  getStudentAvatarFileName,
  getTotalStudents,
  loadSeedConfig,
  resolveAssetPath,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import { StudentStatus } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { StorageService } from "@/backend/services/storage/storage.service";
import { StudentBootstrapService } from "@/backend/services/student/student-bootstrap.service";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import { getStorageService } from "@/backend/storage/storage.service";
import type { ParentEntity, TeacherEntity } from "@/backend/types";

const DEMO_STUDENTS = [
  { name: "Demo Student", idempotencyKey: "demo_student_1", timezoneOverride: null as string | null, avatarIndex: 1 },
  {
    name: "Demo Student London",
    idempotencyKey: "demo_student_london_1",
    timezoneOverride: "Europe/London",
    avatarIndex: 2,
  },
] as const;

async function seedAvatarAssets(): Promise<Map<string, string | null>> {
  const avatarUrls = new Map<string, string | null>();

  try {
    const fileSeeder = await createFileSeedingService();
    await fileSeeder.ensureDirectory("public", true);
    await fileSeeder.ensureDirectory("public/avatars", true);
    await fileSeeder.ensureDirectory("public/avatars/students", true);

    const storageService = await getStorageService();

    for (let i = 1; i <= 8; i++) {
      const fileName = `${String(i).padStart(2, "0")}.png`;
      const bucketPath = `public/avatars/students/${fileName}`;
      const localFilePath = resolveAssetPath(`avatars/students/${fileName}`);

      try {
        await fileSeeder.seedFile({ bucketPath, localFilePath });
        const fileInfo = await storageService.fileInfoByPath(bucketPath);
        if (!fileInfo?.url) {
          throw new Error(`File info URL is missing for ${bucketPath}`);
        }
        avatarUrls.set(fileName, fileInfo.url);
      } catch (fileError) {
        logger.error(`Failed to seed avatar ${fileName}:`, fileError);
        avatarUrls.set(fileName, null);
      }
    }

    if (avatarUrls.size === 0 || Array.from(avatarUrls.values()).every(url => url === null)) {
      throw new Error("No student avatars were successfully seeded.");
    }

    logger.info("Student avatar assets seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed student avatars:", error);
    throw error;
  }

  return avatarUrls;
}

function getAvatarUrl(avatarUrls: Map<string, string | null>, index: number): string | null {
  const fileName = getStudentAvatarFileName(index);
  return avatarUrls.get(fileName) ?? null;
}

export async function seedOrGet(parentsList: ParentEntity[], teachersList: TeacherEntity[], config?: SeedConfig) {
  logger.info("Seeding system students...");
  const seedConfig = config ?? loadSeedConfig();

  if (!parentsList?.length) {
    throw new Error("No parents available to link to students.");
  }
  if (!teachersList?.length) {
    throw new Error("No teachers available to link to students.");
  }

  const avatarUrls = await seedAvatarAssets();
  const totalStudents = getTotalStudents(seedConfig);
  const results = [];
  const assignmentDate = new Date("2020-01-01");

  for (let i = 0; i < totalStudents; i++) {
    const parent = parentsList[i % parentsList.length];
    const teacher = teachersList[i % teachersList.length];
    const avatarUrl = getAvatarUrl(avatarUrls, i);

    let name: string;
    let idempotencyKey: string;
    let timezoneOverride: string | null = null;

    if (i < DEMO_STUDENTS.length) {
      const demo = DEMO_STUDENTS[i];
      name = demo.name;
      idempotencyKey = demo.idempotencyKey;
      timezoneOverride = demo.timezoneOverride;
    } else {
      const extraIndex = i - DEMO_STUDENTS.length + 1;
      name = buildStudentName(seedConfig, extraIndex);
      idempotencyKey = `seed_student_${extraIndex}`;
    }

    const status = i === 0 ? StudentStatus.REGULAR : cycleAtIndex(ALL_STUDENT_STATUSES, i);

    const student = await StudentBootstrapService.upsertByIdempotencyKey({
      parentId: parent.id,
      primaryTeacherId: teacher.id,
      name,
      timezoneOverride,
      idempotencyKey,
      avatarUrl,
      status,
      classesTotal: 10,
      classesRemaining: 5,
    });
    results.push(student);

    await StudentBootstrapService.ensureTeacherAssignment(student.id, teacher.id, assignmentDate);

    if (avatarUrl) {
      const fileName = getStudentAvatarFileName(i);
      try {
        await StorageService.linkFileToEntity({
          referenceTable: "students",
          referenceId: student.id,
          usageType: "avatar",
          filePath: `public/avatars/students/${fileName}`,
        });
      } catch (error) {
        logger.error(`Failed to register avatar usage for student ${student.id}:`, error);
      }
    }
  }

  logger.info(`System students seeded (${results.length} total).`);
  return results;
}
