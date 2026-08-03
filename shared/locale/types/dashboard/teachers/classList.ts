export interface TeacherClassListLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly noClasses: string;
  readonly viewDetails: string;
  readonly viewClassAudit: string;
  readonly joinVideo: string;
  readonly durationMinutes: (minutes: number) => string;
  readonly errors: {
    readonly failedToLoad: string;
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
    readonly ON_DEMAND_CONFLICT_HELD: string;
    readonly ON_DEMAND_NO_CREDITS_ABSENT: string;
    readonly ON_DEMAND_NO_CREDITS_CANCELLED: string;
    readonly ON_DEMAND_PENDING_CREDITS: string;
  };
}
