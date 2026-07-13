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
import type { ParentEntity, TeacherEntity, UserSelectType } from "@/backend/types";

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

const DEMO_STUDENT_USER_EMAIL = "student@siraj.local";
const EXTRA_STUDENT_USER_EMAIL_RE = /^student-\d+@seed\.siraj\.local$/;

function selectStudentUsers(users: UserSelectType[]): UserSelectType[] {
  return users.filter(u => u.email === DEMO_STUDENT_USER_EMAIL || EXTRA_STUDENT_USER_EMAIL_RE.test(u.email));
}

export async function seedOrGet(
  parentsList: ParentEntity[],
  teachersList: TeacherEntity[],
  config?: SeedConfig,
  users: UserSelectType[] = []
) {
  logger.info("Seeding system students...");
  const seedConfig = config ?? loadSeedConfig();

  if (!parentsList?.length) {
    throw new Error("No parents available to link to students.");
  }
  if (!teachersList?.length) {
    throw new Error("No teachers available to link to students.");
  }

  const studentUsers = selectStudentUsers(users);
  const totalStudents = getTotalStudents(seedConfig);
  if (studentUsers.length < totalStudents) {
    throw new Error(
      `Not enough student login users found: have ${studentUsers.length}, need ${totalStudents}. ` +
        "Ensure buildExtraStudentUserSpecs runs in seed-users.ts before seeding students."
    );
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

  const results = [];
  const assignmentDate = new Date("2020-01-01");

  for (let i = 0; i < totalStudents; i++) {
    const parent = parentsList[i % parentsList.length];
    const teacher = teachersList[i % teachersList.length];
    const avatarUrl = getAvatarUrl(avatarUrls, i);
    const studentUser = studentUsers[i];

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
      userId: studentUser.id,
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
