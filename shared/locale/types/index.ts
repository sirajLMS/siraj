/**
 * Canonical barrel for `@/shared/locale/types`.
 *
 * Re-exports the entire shared/locale/types subtree so consumers can import
 * from `@/shared/locale/types` instead of deep paths like
 * `@/shared/locale/types/dashboard/teachers`.
 *
 * Ordering: alphabetical by group. Only `export * from "<relative>";` is used.
 */

// ─── Top-level directories (alphabetical) ──────────────────────────
export * from "./auth";
export * from "./common";
// ─── dashboard/<group> ─────────────────────────────────────────────
export * from "./dashboard/admin";
export * from "./dashboard/billing";
export * from "./dashboard/classes";
export * from "./dashboard/complaints";
export * from "./dashboard/core";
export * from "./dashboard/cron";
export * from "./dashboard/lms";
export * from "./dashboard/meeting-providers";
export * from "./dashboard/parents";
export * from "./dashboard/payment-catalogs";
export * from "./dashboard/permissions";
export * from "./dashboard/reports";
export * from "./dashboard/resources";
export * from "./dashboard/settings";
export * from "./dashboard/staff";
export * from "./dashboard/studentPortal";
export * from "./dashboard/students";
export * from "./dashboard/subjects";
export * from "./dashboard/suggestions";
export * from "./dashboard/supervisorPortal";
export * from "./dashboard/teachers";
export * from "./emails";
export * from "./errors";
// ─── Top-level files ───────────────────────────────────────────────
export * from "./message";
export * from "./notifications";
export * from "./profile";
export * from "./session";
export * from "./sms";
export * from "./ui";
