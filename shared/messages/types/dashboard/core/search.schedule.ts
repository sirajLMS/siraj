export interface SearchScheduleLabels {
  readonly pageTitle: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly fromTime: string;
  readonly toTime: string;
  readonly gender: string;
  readonly allGenders: string;
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
  readonly sort: {
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
}
