export interface TeacherAvailabilityLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly exportPdf: string;
  readonly searchTitle: string;
  readonly from: string;
  readonly to: string;
  readonly gender: string;
  readonly any: string;
  readonly male: string;
  readonly female: string;
  readonly submit: string;
  readonly table: {
    readonly time: string;
    readonly monday: string;
    readonly tuesday: string;
    readonly wednesday: string;
    readonly thursday: string;
    readonly friday: string;
    readonly saturday: string;
    readonly sunday: string;
    readonly mon: string;
    readonly tue: string;
    readonly wed: string;
    readonly thu: string;
    readonly fri: string;
    readonly sat: string;
    readonly sun: string;
  };
  readonly insights: {
    readonly peakLoad: string;
    readonly peakLoadDesc: string;
    readonly availableStaff: string;
    readonly availableStaffDesc: string;
    readonly teachersCount: string;
    readonly localTimezones: string;
    readonly localTimezonesDesc: string;
  };
  readonly mobile: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
  };
}
