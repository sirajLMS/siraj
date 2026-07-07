export interface SearchScheduleLabels {
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
  readonly resultsCount: string;
  readonly availableDaysCount: string;
  readonly errorLoading: string;
  readonly viewMonthSchedule: string;
  readonly monthScheduleTitle: string;
  readonly monthScheduleError: string;
  readonly closeMonthSchedule: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly sortOptions: {
    readonly mostAvailableDays: string;
    readonly mostGaps: string;
    readonly nameAsc: string;
    readonly nameDesc: string;
    readonly timezoneAsc: string;
  };
  readonly day: {
    readonly monday: string;
    readonly tuesday: string;
    readonly wednesday: string;
    readonly thursday: string;
    readonly friday: string;
    readonly saturday: string;
    readonly sunday: string;
  };
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
