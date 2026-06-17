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

const _superAdmins: InternalDemoUser[] = [
  {
    name: "Super Admin",
    email: "admin@siraj.local",
    plainPassword: PWD,
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

const _staff: InternalDemoUser[] = [
  {
    name: "Default Staff",
    email: "staff@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: SystemPermissionGroupSlug.STAFF_DEFAULT,
  },
];

export const superAdmins: DemoUser[] = _superAdmins.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const academyAdmins: DemoUser[] = _academyAdmins.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const teachers: DemoUser[] = _teachers.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const parents: DemoUser[] = _parents.map(({ plainPassword: _plainPassword, ...rest }) => rest);
export const staff: DemoUser[] = _staff.map(({ plainPassword: _plainPassword, ...rest }) => rest);

export const ALL_DEMO_USERS: DemoUser[] = [...superAdmins, ...academyAdmins, ...teachers, ...parents, ...staff];

// Exported exclusively for backend seeders, DO NOT import this in frontend code
export const INTERNAL_DEMO_USERS: InternalDemoUser[] = [
  ..._superAdmins,
  ..._academyAdmins,
  ..._teachers,
  ..._parents,
  ..._staff,
];
