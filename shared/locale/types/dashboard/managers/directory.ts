export interface ManagersDirectoryLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly mobileTitle: string;
  readonly metrics: {
    readonly totalAdmin: string;
    readonly systemStaff: string;
    readonly activeNow: string;
    readonly alerts: string;
  };
  readonly filters: {
    readonly allRoleTypes: string;
    readonly admin: string;
    readonly staff: string;
    readonly supervisor: string;
    readonly statusAll: string;
    readonly active: string;
    readonly inactive: string;
  };
  readonly table: {
    readonly hash: string;
    readonly manager: string;
    readonly contactDetails: string;
    readonly phone: string;
    readonly roleType: string;
    readonly options: string;
  };
  readonly fields: {
    readonly phone: string;
  };
  readonly actions: {
    readonly addManager: string;
    readonly options: string;
    readonly editProfile: string;
    readonly deactivate: string;
    readonly activate: string;
    readonly cancel: string;
    readonly processing: string;
    readonly save: string;
    readonly deactivateConfirmation: (name: string) => string;
    readonly activateConfirmation: (name: string) => string;
  };
  readonly status: {
    readonly active: string;
    readonly offline: string;
  };
  readonly roles: {
    readonly admin: string;
    readonly staff: string;
    readonly supervisor: string;
  };
  readonly showingOf: (count: number, total: number) => string;
  readonly noEntries: string;
}
