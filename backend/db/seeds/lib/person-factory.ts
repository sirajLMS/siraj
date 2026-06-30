import { SystemPermissionGroupSlug } from "@/shared/lib/enum";
import { getFakerForIndex } from "./faker-client";
import type { SeedConfig } from "./seed-config";

export interface SeedUserSpec {
  name: string;
  email: string;
  plainPassword: string;
  isSuperAdmin: boolean;
  groupSlug: SystemPermissionGroupSlug;
  idempotencyKey: string;
}

// eslint-disable-next-line sonarjs/no-hardcoded-passwords
const SEED_PASSWORD = "Seed_Pass1!";

const SEED_TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "Europe/London",
  "America/New_York",
  "Asia/Dubai",
  "Asia/Riyadh",
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
      plainPassword: SEED_PASSWORD,
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
      plainPassword: SEED_PASSWORD,
      isSuperAdmin: false,
      groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
      idempotencyKey: `seed_parent_user_${i}`,
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
  const fileNumber = String((index % 8) + 1).padStart(2, "0");
  return `${fileNumber}.png`;
}
