import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
// DEV ONLY: Never use these credentials in production

import { getAvatarFileNameForPersona } from "@/backend/db/seeds/lib/avatar-file-registry";
import { getFakerForIndex } from "@/backend/db/seeds/lib/faker-client";
import type { SeedConfig } from "@/backend/db/seeds/lib/seed-config";
import { SystemPermissionGroupSlug } from "@/backend/enum";

export interface SeedUserSpec {
  name: string;
  email: string;
  plainPassword: string;
  isSuperAdmin: boolean;
  groupSlug: SystemPermissionGroupSlug;
  idempotencyKey: string;
}

import { resolveAdminPassword } from "@/shared/demo-users";

// Resolved lazily so the production / IS_DEMO / TEST_SERVER guards in
// resolveAdminPassword() evaluate against the environment at call time.
const seedPassword = (): string => resolveAdminPassword();

const SEED_TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "Europe/London",
  "America/New_York",
  "Asia/Dubai",
  IanaTimezone.Asia_Riyadh,
  "Asia/Singapore",
  "Australia/Sydney",
] as const;

export function buildExtraTeacherUserSpecs(config: SeedConfig): SeedUserSpec[] {
  const specs: SeedUserSpec[] = [];
  for (let i = 1; i <= config.extraTeachers; i++) {
    const faker = getFakerForIndex(config.fakerSeed, i);
    specs.push({
      name: faker.person.fullName(),
      email: `teacher-${i}@seed.siraj.local`,
      plainPassword: seedPassword(),
      isSuperAdmin: false,
      groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
      idempotencyKey: `seed_teacher_user_${i}`,
    });
  }
  return specs;
}

export function buildExtraParentUserSpecs(config: SeedConfig): SeedUserSpec[] {
  const specs: SeedUserSpec[] = [];
  for (let i = 1; i <= config.extraParents; i++) {
    const faker = getFakerForIndex(config.fakerSeed, 1000 + i);
    specs.push({
      name: faker.person.fullName(),
      email: `parent-${i}@seed.siraj.local`,
      plainPassword: seedPassword(),
      isSuperAdmin: false,
      groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
      idempotencyKey: `seed_parent_user_${i}`,
    });
  }
  return specs;
}

/**
 * Build the extra student login user specs beyond the single default demo student
 * (`student@siraj.local` defined in `shared/demo-users.ts`).
 *
 * The student seeder (`getTotalStudents`) produces `2 + config.extraStudents` student
 * rows (two demo + extras). One of those two demo rows is paired with the default demo
 * student user; this helper produces the remaining `1 + extraStudents` users so that
 * every seeded student has a corresponding login account.
 */
export function buildExtraStudentUserSpecs(config: SeedConfig): SeedUserSpec[] {
  const specs: SeedUserSpec[] = [];
  const count = 1 + config.extraStudents;
  for (let i = 1; i <= count; i++) {
    const faker = getFakerForIndex(config.fakerSeed, 3000 + i);
    specs.push({
      name: faker.person.fullName(),
      email: `student-${i}@seed.siraj.local`,
      plainPassword: seedPassword(),
      isSuperAdmin: false,
      groupSlug: SystemPermissionGroupSlug.STUDENT_DEFAULT,
      idempotencyKey: `seed_student_user_${i}`,
    });
  }
  return specs;
}

export function buildStudentName(config: SeedConfig, index: number): string {
  const faker = getFakerForIndex(config.fakerSeed, 2000 + index);
  return faker.person.fullName();
}

export function pickTimezoneForIndex(index: number): string {
  return SEED_TIMEZONES[index % SEED_TIMEZONES.length];
}

export function getStudentAvatarFileName(index: number): string {
  return getAvatarFileNameForPersona("students", index);
}
