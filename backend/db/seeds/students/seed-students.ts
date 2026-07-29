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
import { StudentSeedService } from "@/backend/services/seed/student-seed.service";
import type { ParentEntity, StudentEntity, TeacherEntity, UserSelectType } from "@/backend/types";

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

interface StudentSeedContext {
  seedConfig: SeedConfig;
  studentUsers: UserSelectType[];
  totalStudents: number;
  avatarUrls: Map<string, string | null>;
}

async function prepareStudentSeedContext(
  users: UserSelectType[],
  seedConfig: SeedConfig,
  parentsList: ParentEntity[],
  teachersList: TeacherEntity[]
): Promise<StudentSeedContext> {
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

  return { seedConfig, studentUsers, totalStudents, avatarUrls };
}

interface StudentRowSpec {
  name: string;
  idempotencyKey: string;
  timezoneOverride: string | null;
  status: StudentStatus;
  avatarUrl: string | null;
  parentId: string;
  primaryTeacherId: string;
  userId: string;
}

function buildStudentRowSpec(
  index: number,
  ctx: StudentSeedContext,
  parentsList: ParentEntity[],
  teachersList: TeacherEntity[]
): StudentRowSpec {
  const parent = parentsList[index % parentsList.length];
  const teacher = teachersList[index % teachersList.length];
  const avatarUrl = getAvatarUrl(ctx.avatarUrls, index);
  const studentUser = ctx.studentUsers[index];

  let name: string;
  let idempotencyKey: string;
  let timezoneOverride: string | null = null;

  if (index < DEMO_STUDENTS.length) {
    const demo = DEMO_STUDENTS[index];
    name = demo.name;
    idempotencyKey = demo.idempotencyKey;
    timezoneOverride = demo.timezoneOverride;
  } else {
    const extraIndex = index - DEMO_STUDENTS.length + 1;
    name = buildStudentName(ctx.seedConfig, extraIndex);
    idempotencyKey = `seed_student_${extraIndex}`;
  }

  const status = index === 0 ? StudentStatus.REGULAR : cycleAtIndex(ALL_STUDENT_STATUSES, index);

  return {
    name,
    idempotencyKey,
    timezoneOverride,
    status,
    avatarUrl,
    parentId: parent.id,
    primaryTeacherId: teacher.id,
    userId: studentUser.id,
  };
}

async function upsertStudentRow(spec: StudentRowSpec, assignmentDate: Date): Promise<StudentEntity> {
  const student = await StudentSeedService.seedStudentByKey({
    parentId: spec.parentId,
    userId: spec.userId,
    primaryTeacherId: spec.primaryTeacherId,
    name: spec.name,
    timezoneOverride: spec.timezoneOverride,
    idempotencyKey: spec.idempotencyKey,
    avatarUrl: spec.avatarUrl,
    status: spec.status,
    classesTotal: 10,
    classesRemaining: 5,
  });

  await StudentSeedService.seedTeacherAssignment(student.id, spec.primaryTeacherId, assignmentDate);
  return student;
}

export async function seedOrGet(
  parentsList: ParentEntity[],
  teachersList: TeacherEntity[],
  config?: SeedConfig,
  users: UserSelectType[] = []
) {
  logger.info("Seeding system students...");
  const seedConfig = config ?? loadSeedConfig();

  const ctx = await prepareStudentSeedContext(users, seedConfig, parentsList, teachersList);

  const results: StudentEntity[] = [];
  const assignmentDate = new Date("2020-01-01");

  for (let i = 0; i < ctx.totalStudents; i++) {
    const spec = buildStudentRowSpec(i, ctx, parentsList, teachersList);
    const student = await upsertStudentRow(spec, assignmentDate);
    results.push(student);
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
