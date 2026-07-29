export interface ScheduleTrackingParentLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly tabs: {
    readonly reschedule: string;
    readonly status: string;
    readonly alerts: string;
  };
}
