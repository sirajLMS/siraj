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
// ─── Top-level files ───────────────────────────────────────────────
export * from "./dashboard";
// ─── dashboard/<group> ─────────────────────────────────────────────
export * from "./dashboard/admin";
export * from "./dashboard/billing";
export * from "./dashboard/classes";
export * from "./dashboard/complaints";
export * from "./dashboard/core";
export * from "./dashboard/lms";
export * from "./dashboard/meeting-providers/main";
export * from "./dashboard/parents";
export * from "./dashboard/payment-catalogs/main";
export * from "./dashboard/permissions";
export * from "./dashboard/reports";
export * from "./dashboard/resources";
export * from "./dashboard/staff";
export * from "./dashboard/studentPortal";
export * from "./dashboard/students";
export * from "./dashboard/subjects";
export * from "./dashboard/suggestions";
export * from "./dashboard/supervisorPortal";
export * from "./dashboard/teachers";
export * from "./emails";
export * from "./errors";
export * from "./message";
export * from "./notifications";
export * from "./profile";
export * from "./profile-translations";
export * from "./session";
export * from "./sms";
export * from "./ui";
export * from "./ui-translations";
