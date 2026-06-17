interface InternalDemoUser {
  name: string;
  email: string;
  plainPassword?: string;
  isSuperAdmin: boolean;
  groupSlug: string;
}

export type DemoUser = Omit<InternalDemoUser, "plainPassword">;

const PWD = "12345678";

const _superAdmins: InternalDemoUser[] = [
  {
    name: "Super Admin",
    email: "admin@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: true,
    groupSlug: "super_admin",
  },
];

const _academyAdmins: InternalDemoUser[] = [
  {
    name: "Academy Admin",
    email: "academy@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: "academy_admin",
  },
];

const _teachers: InternalDemoUser[] = [
  {
    name: "Default Teacher",
    email: "teacher@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: "teacher_default",
  },
];

const _parents: InternalDemoUser[] = [
  {
    name: "Default Parent",
    email: "parent@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: "parent_default",
  },
];

const _staff: InternalDemoUser[] = [
  {
    name: "Default Staff",
    email: "staff@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: "staff_default",
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
