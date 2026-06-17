export interface DemoUser {
  name: string;
  email: string;
  plainPassword: string;
  isSuperAdmin: boolean;
  groupSlug: string;
}

const PWD = "12345678";

export const superAdmins: DemoUser[] = [
  {
    name: "Super Admin",
    email: "admin@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: true,
    groupSlug: "super_admin",
  },
];

export const teachers: DemoUser[] = [
  {
    name: "Default Teacher",
    email: "teacher@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: "teacher_default",
  },
];

export const parents: DemoUser[] = [
  {
    name: "Default Parent",
    email: "parent@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: "parent_default",
  },
];

export const staff: DemoUser[] = [
  {
    name: "Default Staff",
    email: "staff@siraj.local",
    plainPassword: PWD,
    isSuperAdmin: false,
    groupSlug: "staff_default",
  },
];

export const ALL_DEMO_USERS: DemoUser[] = [...superAdmins, ...teachers, ...parents, ...staff];
