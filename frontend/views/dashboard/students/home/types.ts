/**
 * Student Directory — Shared Types
 *
 * GraphQL-generated types (from codegen) are used for data shapes.
 * This file contains UI-specific types that don't have a direct GraphQL equivalent.
 */

/**
 * UI-specific status union type.
 * Maps from GraphQL StudentStatus enum values to display-friendly lowercase strings.
 * The container component is responsible for mapping between GraphQL enum and these values.
 */
export type StudentAccountStatus = "activated" | "deactivated" | "regular" | "on_leave" | "suspended" | "on_trial";

/**
 * UI-specific enrollment status.
 * Not present in the GraphQL schema — derived from business logic (e.g., classes_total, status).
 */
export type StudentEnrollmentStatus = "regular" | "prospect" | "withdrawn";

/**
 * Metric item displayed in the student directory header cards.
 */
export interface MetricItem {
  readonly key: string;
  readonly value: number;
  readonly label: string;
}

/**
 * Mobile-specific metric keys — subset of all metrics shown on mobile viewport.
 */
export const MOBILE_METRIC_KEYS = ["activated", "regular", "on_leave", "suspended"] as const;

/**
 * Icon mapping for mobile metric display.
 * Import icons at point of use in the container or view component.
 */
export const MOBILE_METRIC_ICON_KEYS = {
  activated: "HowToRegOutlined",
  regular: "PersonOutlined",
  on_leave: "EventBusyOutlined",
  suspended: "BlockOutlined",
} as const;