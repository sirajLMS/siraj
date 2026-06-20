export interface SearchScheduleLabels {
  readonly pageTitle: string;
  readonly fromTime: string;
  readonly toTime: string;
  readonly gender: string;
  readonly allGenders: string;
  readonly male: string;
  readonly female: string;
  readonly searchBtn: string;
  readonly noResults: string;
  readonly resultsCount: string;
  readonly errorLoading: string;
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
