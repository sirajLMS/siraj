/**
 * SearchScheduleLabels — type schema for the dashboard.core.searchSchedule namespace.
 *
 * Keys that previously contained ICU {param} placeholders are now typed as
 * functions with explicit, named parameters — checked at compile time.
 */
export interface SearchScheduleLabels {
  // ─── Static strings ────────────────────────────────────────────────
  readonly pageTitle: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly fromTime: string;
  readonly toTime: string;
  readonly teacherGender: string;
  readonly allGenders: string;
  readonly dateRange: string;
  readonly timeRange: string;
  readonly filters: string;
  readonly applyFilters: string;
  readonly clearFilters: string;
  readonly sort: string;
  readonly male: string;
  readonly female: string;
  readonly teacherName: string;
  readonly teacherNamePlaceholder: string;
  readonly teacherNameNoResults: string;
  readonly teacherNameTypeToSearch: string;
  readonly minAvailableDays: string;
  readonly minTotalGaps: string;
  readonly sortBy: string;
  readonly daysOfWeek: string;
  readonly searchBtn: string;
  readonly noResults: string;
  readonly errorLoading: string;
  readonly viewMonthSchedule: string;
  readonly monthScheduleError: string;
  readonly closeMonthSchedule: string;
  readonly previousMonth: string;
  readonly nextMonth: string;

  // ─── Interpolated → typed functions ────────────────────────────────
  readonly resultsCount: (count: number, gaps: number) => string;
  readonly availableDaysCount: (count: number) => string;
  readonly monthScheduleTitle: (name: string) => string;

  // ─── Sort options ──────────────────────────────────────────────────
  readonly sortOptions: {
    readonly mostAvailableDays: string;
    readonly mostGaps: string;
    readonly nameAsc: string;
    readonly nameDesc: string;
    readonly timezoneAsc: string;
  };

  // ─── Days of week ──────────────────────────────────────────────────
  readonly day: {
    readonly monday: string;
    readonly tuesday: string;
    readonly wednesday: string;
    readonly thursday: string;
    readonly friday: string;
    readonly saturday: string;
    readonly sunday: string;
  };

  // ─── Calendar ──────────────────────────────────────────────────────
  readonly calendar: {
    readonly days: {
      readonly sun: string;
      readonly mon: string;
      readonly tue: string;
      readonly wed: string;
      readonly thu: string;
      readonly fri: string;
      readonly sat: string;
    };
  };
}
