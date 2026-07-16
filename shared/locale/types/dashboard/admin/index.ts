/**
 * AdminDashboardLabels — type schema for the dashboard.admin namespace.
 *
 * Keys that previously contained ICU {param} placeholders are now typed as
 * functions with explicit, named parameters — checked at compile time.
 *
 * Keys that had ICU plural syntax (e.g. {minutes, plural, =1 {...} other {#...}})
 * are typed as (n: number) => string — implemented per-locale with plain TypeScript.
 */

export type { DstMigrationLabels } from "./dstMigration";

export interface AdminDashboardLabels {
  // ─── Static strings ────────────────────────────────────────────────
  readonly pageTitle: string;
  readonly roleLabel: string;
  readonly todayClasses: string;
  readonly updatedJustNow: string;
  readonly scheduleOverview: string;
  readonly searchPlaceholder: string;
  readonly listOfClassesOn: string;
  readonly teacher: string;
  readonly selectTeacher: string;
  readonly submit: string;
  readonly classId: string;
  readonly student: string;
  readonly time: string;
  readonly yourTime: string;
  readonly teacherTime: string;
  readonly studentTime: string;
  readonly duration: string;
  readonly status: string;
  readonly actions: string;
  readonly history: string;
  readonly details: string;
  readonly joinVideo: string;
  readonly noClasses: string;
  readonly loading: string;
  readonly today: string;
  readonly previousDay: string;
  readonly nextDay: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly goToPage: string;
  readonly dashboardOverview: string;
  readonly viewAll: string;
  readonly loadingTimeoutTitle: string;
  readonly loadingTimeoutDesc: string;
  readonly unauthenticatedTitle: string;
  readonly unauthenticatedDesc: string;
  readonly loadingFailedTitle: string;
  readonly loadingFailedDesc: string;
  readonly retryBtn: string;
  readonly loginBtn: string;

  // ─── Interpolated → typed functions ────────────────────────────────

  /** e.g. "1–10 of 87"  |  "١–١٠ من ٨٧" */
  readonly paginationRange: (from: number, to: number, total: number) => string;

  /** e.g. "Page 3 of 9"  |  "صفحة ٣ من ٩" */
  readonly pageOf: (current: number, total: number) => string;

  /** e.g. "Showing 10 of 87 classes" — replaces {shown}/{total} */
  readonly showingOf: (shown: number, total: number) => string;

  /** ICU plural → native TS: "Updated 1 minute ago" / "Updated 5 minutes ago" */
  readonly updatedMinutesAgo: (minutes: number) => string;

  // ─── Nested objects (no change needed) ─────────────────────────────
  readonly metrics: {
    readonly total: string;
    readonly regular: string;
    readonly trial: string;
    readonly advance: string;
    readonly rescheduled: string;
    readonly suspended: string;
    readonly taken: string;
    readonly pending: string;
    readonly activated: string;
    readonly running: string;
    readonly absent: string;
    readonly leave: string;
  };
  readonly statusLabels: {
    readonly PENDING: string;
    readonly TAKEN: string;
    readonly ABSENT: string;
    readonly LEAVE: string;
    readonly NOT_ACTIVATED: string;
    readonly ACTIVATED: string;
    readonly RUNNING: string;
    readonly COMPLETED: string;
  };
}
