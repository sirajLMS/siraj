export interface DstMigrationLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly actions: {
    readonly updateSchedules: string;
    readonly migrating: string;
    readonly migrationComplete: string;
    readonly successMessage: string;
  };
  readonly errors: {
    readonly mutationFailed: string;
    readonly noDstTransitionDetected: string;
  };
  readonly sections: {
    readonly updated: string;
    readonly errors: string;
    readonly checkedEmpty: string;
    readonly conflictsDetected: string;
    readonly successfullyUpdated: string;
    readonly inactiveVerified: string;
  };
  readonly metrics: {
    readonly totalAudited: string;
    readonly successful: string;
    readonly conflicts: string;
    readonly unchanged: string;
  };
  readonly table: {
    readonly studentName: string;
    readonly from: string;
    readonly to: string;
    readonly sessionsCount: (count: number) => string;
  };
  readonly conflicts: {
    readonly teacherLabel: (name: string) => string;
  };
  readonly checkedEmpty: {
    readonly inactiveNote: string;
  };
}
