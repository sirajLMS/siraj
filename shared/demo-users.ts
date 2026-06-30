import { SystemPermissionGroupSlug } from "./lib/enum";

interface InternalDemoUser {
  name: string;
  email: string;
  plainPassword?: string;
  isSuperAdmin: boolean;
  groupSlug: SystemPermissionGroupSlug;
}

export type DemoUser = Omit<InternalDemoUser, "plainPassword">;

const PWD = "12345678";

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@siraj.local";

const _superAdmins: InternalDemoUser[] = [
  {
    name: "Super Admin",
    email: ADMIN_EMAIL,
    plainPassword: process.env.ADMIN_PASSWORD || PWD,
    isSuperAdmin: true,
    groupSlug: SystemPermissionGroupSlug.SUPER_ADMIN,
  },
];

const _academyAdmins: InternalDemoUser[] = [
  {
    name: "Academy Admin",
    email: "academy@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.ACADEMY_ADMIN,
  },
];

const _teachers: InternalDemoUser[] = [
  {
    name: "Default Teacher",
    email: "teacher@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
  },
];

const _parents: InternalDemoUser[] = [
  {
    name: "Default Parent",
    email: "parent@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
  },
];

export const superAdmins: DemoUser[] = _superAdmins.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const academyAdmins: DemoUser[] = _academyAdmins.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const teachers: DemoUser[] = _teachers.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const parents: DemoUser[] = _parents.map(({ plainPassword: _plainPassword, ...rest }) => rest);

export const INTERNAL_DEMO_USERS: InternalDemoUser[] = [..._superAdmins, ..._academyAdmins, ..._teachers, ..._parents];
