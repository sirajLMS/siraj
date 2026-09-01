import { getEnvironmentConfig } from "@/backend/lib/env";
import type { UserSelectType } from "@/backend/types";
import { students, supervisors } from "@/shared/demo-users";

/** Email used to identify the system super admin (from ADMIN_EMAIL env var, fallback admin@siraj.local) */
const ADMIN_USER_EMAIL = getEnvironmentConfig().adminEmail || "admin@siraj.local";

/** Canonical demo supervisor login email from shared/demo-users.ts */
export const SUPERVISOR_USER_EMAIL = supervisors[0]?.email ?? "supervisor@siraj.local";

/** Canonical demo student login email from shared/demo-users.ts */
export const STUDENT_USER_EMAIL = students[0]?.email ?? "student@siraj.local";

/**
 * Find the admin user from the seeded users list.
 * Used by all seeders that need a system admin for audit trails, approvals, etc.
 *
 * @returns The admin user entity, or undefined if not found
 */
export function findAdminUser(usersList: UserSelectType[]): UserSelectType | undefined {
  return usersList.find(u => u.email === ADMIN_USER_EMAIL);
}

/**
 * Find the admin user, or fall back to the first user in the list.
 * Use this when the admin is optional but a user ID is still needed.
 *
 * @returns The admin user entity, or the first user, or undefined if list is empty
 */
export function findAdminUserOrFallback(usersList: UserSelectType[]): UserSelectType | undefined {
  return findAdminUser(usersList) ?? usersList[0];
}

/**
 * Find the demo supervisor user from the seeded users list.
 * Prefer for LMS review / complaint response attribution.
 */
function findSupervisorUser(usersList: UserSelectType[]): UserSelectType | undefined {
  return usersList.find(u => u.email === SUPERVISOR_USER_EMAIL);
}

/**
 * Prefer demo supervisor for workflow attribution; fall back to admin then first user.
 */
export function findSupervisorUserOrFallback(usersList: UserSelectType[]): UserSelectType | undefined {
  return findSupervisorUser(usersList) ?? findAdminUserOrFallback(usersList);
}
