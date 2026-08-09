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
export const DEFAULT_SEED_ADMIN_PASSWORD = process.env.DEFAULT_SEED_ADMIN_PASSWORD ?? ["Seed", "Pass1!"].join("_");

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

const internalSuperAdmins: InternalDemoUser[] = [
  {
    name: "Super Admin",
    email: ADMIN_EMAIL,
    plainPassword: resolveAdminPassword(),
    isSuperAdmin: true,
    groupSlug: SystemPermissionGroupSlug.SUPER_ADMIN,
  },
];

const internalAcademyAdmins: InternalDemoUser[] = [
  {
    name: "Admin",
    email: "academy@siraj.local",
    plainPassword: DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.ACADEMY_ADMIN,
  },
];

const internalTeachers: InternalDemoUser[] = [
  {
    name: "Default Teacher",
    email: "teacher@siraj.local",
    plainPassword: DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
  },
];

const internalSupervisors: InternalDemoUser[] = [
  {
    name: "Default Supervisor",
    email: "supervisor@siraj.local",
    plainPassword: DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.SUPERVISOR_DEFAULT,
  },
];

const internalStaff: InternalDemoUser[] = [
  {
    name: "Default Staff",
    email: "staff@siraj.local",
    plainPassword: DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.STAFF_DEFAULT,
  },
];

const internalStudents: InternalDemoUser[] = [
  {
    name: "Default Student",
    email: "student@siraj.local",
    plainPassword: DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.STUDENT_DEFAULT,
  },
];

const internalParents: InternalDemoUser[] = [
  {
    name: "Default Parent",
    email: "parent@siraj.local",
    plainPassword: DEFAULT_SEED_ADMIN_PASSWORD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
  },
];

function sanitizeDemoUser(user: InternalDemoUser): DemoUser {
  const { name, email, isSuperAdmin, groupSlug } = user;
  return { name, email, isSuperAdmin, groupSlug };
}

export const superAdmins: DemoUser[] = internalSuperAdmins.map(sanitizeDemoUser);
export const academyAdmins: DemoUser[] = internalAcademyAdmins.map(sanitizeDemoUser);
export const teachers: DemoUser[] = internalTeachers.map(sanitizeDemoUser);
export const supervisors: DemoUser[] = internalSupervisors.map(sanitizeDemoUser);
export const staff: DemoUser[] = internalStaff.map(sanitizeDemoUser);
export const students: DemoUser[] = internalStudents.map(sanitizeDemoUser);
export const parents: DemoUser[] = internalParents.map(sanitizeDemoUser);

export const INTERNAL_DEMO_USERS: InternalDemoUser[] = [
  ...internalSuperAdmins,
  ...internalAcademyAdmins,
  ...internalTeachers,
  ...internalSupervisors,
  ...internalStaff,
  ...internalStudents,
  ...internalParents,
];
