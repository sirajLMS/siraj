export interface TeachersDirectoryLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly metrics: {
    readonly activated: string;
    readonly deactivated: string;
  };
  readonly actions: {
    readonly updateSchedules: string;
    readonly addTeacher: string;
    readonly joinRoom: string;
    readonly viewSchedule: string;
    readonly options: string;
  };
  readonly table: {
    readonly hash: string;
    readonly image: string;
    readonly name: string;
    readonly email: string;
    readonly zoom: string;
    readonly schedule: string;
    readonly options: string;
    readonly showingOf: string;
    readonly linkPending: string;
  };
  readonly fields: {
    readonly phone: string;
  };
  readonly status: {
    readonly active: string;
    readonly offline: string;
  };
}
