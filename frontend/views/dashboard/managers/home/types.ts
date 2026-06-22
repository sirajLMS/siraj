export type { ManagerDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";

/**
 * Managers Directory — Shared Types
 *
 * GraphQL-generated types (from codegen) are used for data shapes.
 * This file contains UI-specific types for filters and display logic.
 */

/**
 * UI-specific role filter type.
 * Maps from GraphQL `roleSlug` (e.g., "super_admin", "academy_admin") to display-friendly categories.
 */
export type ManagerRole = "admin" | "staff";

/**
 * UI-specific status filter type.
 */
export type ManagerStatus = "active" | "offline";

/**
 * Manager directory metrics displayed in header cards.
 */
export interface ManagersMetrics {
  readonly totalAdmin: number;
  readonly systemStaff: number;
  readonly activeNow: number;
  readonly alerts: number;
}

/**
 * Helper type for the role filter dropdown.
 */
export type ManagerRoleFilter = "all" | ManagerRole;

/**
 * Helper type for the status filter dropdown.
 */
export type ManagerStatusFilter = "all" | ManagerStatus;

/**
 * View-specific manager type.
 * Maps the GraphQL ManagerDirectoryRow fields to what the UI views expect.
 */
export interface Manager {
  readonly id: string;
  readonly name: string;
  readonly role: ManagerRole;
  readonly status: ManagerStatus;
  readonly email: string;
  readonly skypeId: string;
  readonly phone: string;
  readonly avatarUrl: string;
}
