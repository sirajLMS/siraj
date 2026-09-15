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

// Centralized default seed admin password — module-private on purpose.
// Must never be consumed directly; always go through resolveAdminPassword()
// which enforces the production / IS_DEMO / TEST_SERVER guards.
const DEFAULT_SEED_ADMIN_PASSWORD = process.env.DEFAULT_SEED_ADMIN_PASSWORD ?? ["Seed", "Pass1!"].join("_");

/**
 * Resolves the admin/test admin password with environment guards:
 * - prefers ADMIN_PASSWORD env var
 * - throws when IS_DEMO/TEST_SERVER is set without ADMIN_PASSWORD
 * - throws in production when only the default password would be used
 */
export function resolveAdminPassword(): string {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword) return adminPassword;

  if ((process.env.IS_DEMO === "true" || process.env.TEST_SERVER === "1") && !process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD env var is required when IS_DEMO/TEST_SERVER is set");
  }

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
    plainPassword: resolveAdminPassword(),
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.ACADEMY_ADMIN,
  },
];

const internalTeachers: InternalDemoUser[] = [
  {
    name: "Default Teacher",
    email: "teacher@siraj.local",
    plainPassword: resolveAdminPassword(),
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
  },
];

const internalSupervisors: InternalDemoUser[] = [
  {
    name: "Default Supervisor",
    email: "supervisor@siraj.local",
    plainPassword: resolveAdminPassword(),
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.SUPERVISOR_DEFAULT,
  },
];

const internalStaff: InternalDemoUser[] = [
  {
    name: "Default Staff",
    email: "staff@siraj.local",
    plainPassword: resolveAdminPassword(),
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.STAFF_DEFAULT,
  },
];

const internalStudents: InternalDemoUser[] = [
  {
    name: "Default Student",
    email: "student@siraj.local",
    plainPassword: resolveAdminPassword(),
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.STUDENT_DEFAULT,
  },
];

const internalParents: InternalDemoUser[] = [
  {
    name: "Default Parent",
    email: "parent@siraj.local",
    plainPassword: resolveAdminPassword(),
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
  },
];

function sanitizeDemoUser(user: InternalDemoUser): DemoUser {
  const { name, email, isSuperAdmin, groupSlug } = user;
  return { name, email, isSuperAdmin, groupSlug };
}

export const supervisors: DemoUser[] = internalSupervisors.map(sanitizeDemoUser);
export const students: DemoUser[] = internalStudents.map(sanitizeDemoUser);

export const INTERNAL_DEMO_USERS: InternalDemoUser[] = [
  ...internalSuperAdmins,
  ...internalAcademyAdmins,
  ...internalTeachers,
  ...internalSupervisors,
  ...internalStaff,
  ...internalStudents,
  ...internalParents,
];
