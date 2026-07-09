// DEV ONLY: Never use these credentials in production

import { SystemPermissionGroupSlug } from "@/shared/constants/permission-group.enum";

interface InternalDemoUser {
  name: string;
  email: string;
  plainPassword?: string;
  isSuperAdmin: boolean;
  groupSlug: SystemPermissionGroupSlug;
}

export type DemoUser = Omit<InternalDemoUser, "plainPassword">;

// Centralized default seed admin password. Imported by seed-users.ts to avoid
// duplicating the literal. Must never be used in production — guarded below.
// eslint-disable-next-line sonarjs/no-hardcoded-passwords
export const DEFAULT_SEED_ADMIN_PASSWORD = "Seed_Pass1!";

function resolveAdminPassword(): string {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword) return adminPassword;

  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv === "production") {
    throw new Error("Default seed admin password must not be used in production — set ADMIN_PASSWORD env var");
  }
  return DEFAULT_SEED_ADMIN_PASSWORD;
}

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@siraj.local";

const _superAdmins: InternalDemoUser[] = [
  {
    name: "Super Admin",
    email: ADMIN_EMAIL,
    plainPassword: resolveAdminPassword(),
    isSuperAdmin: true,
    groupSlug: SystemPermissionGroupSlug.SUPER_ADMIN,
  },
];

const _academyAdmins: InternalDemoUser[] = [
  {
    name: "Admin",
    email: "academy@siraj.local",
    plainPassword: DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.ACADEMY_ADMIN,
  },
];

const _teachers: InternalDemoUser[] = [
  {
    name: "Default Teacher",
    email: "teacher@siraj.local",
    plainPassword: DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
  },
];

const _parents: InternalDemoUser[] = [
  {
    name: "Default Parent",
    email: "parent@siraj.local",
    plainPassword: DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
  },
];

export const superAdmins: DemoUser[] = _superAdmins.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const academyAdmins: DemoUser[] = _academyAdmins.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const teachers: DemoUser[] = _teachers.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const parents: DemoUser[] = _parents.map(({ plainPassword: _plainPassword, ...rest }) => rest);

export const INTERNAL_DEMO_USERS: InternalDemoUser[] = [..._superAdmins, ..._academyAdmins, ..._teachers, ..._parents];
