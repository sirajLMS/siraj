import {
  ALL_STUDENT_STATUSES,
  buildStudentName,
  cycleAtIndex,
  getStudentAvatarFileName,
  getTotalStudents,
  linkAvatarsToEntities,
  loadSeedConfig,
  type SeedConfig,
  STUDENT_AVATAR_FILES,
  seedAvatarPool,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import { StudentStatus } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { StudentBootstrapService } from "@/backend/services/student/student-bootstrap.service";
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

  const avatarUrls = shouldSeedExtendedFiles(seedConfig)
    ? await seedAvatarPool({
        assetDir: "avatars/students",
        bucketDir: "public/avatars/students",
        poolFiles: STUDENT_AVATAR_FILES,
        referenceTable: "students",
        entities: [],
      })
    : new Map<string, string | null>();

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
  }

  if (shouldSeedExtendedFiles(seedConfig)) {
    await linkAvatarsToEntities({
      assetDir: "avatars/students",
      bucketDir: "public/avatars/students",
      poolFiles: STUDENT_AVATAR_FILES,
      referenceTable: "students",
      entities: results,
    });
  }

  logger.info(`System students seeded (${results.length} total).`);
  return results;
}
