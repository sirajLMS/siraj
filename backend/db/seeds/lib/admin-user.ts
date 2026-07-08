import type { UserSelectType } from "@/backend/types";

/** Email used to identify the system super admin (from ADMIN_EMAIL env var, fallback admin@siraj.local) */
export const ADMIN_USER_EMAIL = process.env.ADMIN_EMAIL || "admin@siraj.local";

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
