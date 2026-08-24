export interface SelfServiceRescheduleLabels {
  readonly buttons: {
    readonly delay: string;
    readonly cancel: string;
  };
  readonly delayModal: {
    readonly title: string;
    readonly proposedStartAt: string;
    readonly reason: string;
    readonly reasonPlaceholder: string;
    readonly submit: string;
    readonly cancel: string;
    readonly successMessage: string;
  };
  readonly cancelConfirm: {
    readonly title: string;
    readonly message: string;
    readonly reason: string;
    readonly reasonPlaceholder: string;
    readonly confirm: string;
    readonly cancel: string;
    readonly successMessage: string;
  };
  readonly statusBadge: {
    readonly pending: string;
    readonly approved: string;
    readonly rejected: string;
    readonly rescheduled: string;
    readonly cancelled: string;
  };
  readonly requestType: {
    readonly delay: string;
    readonly cancel: string;
  };
  readonly errors: {
    readonly sessionLocked: string;
    readonly duplicateRequest: string;
    readonly requestFailed: string;
  };
  readonly requestsList: {
    readonly title: string;
    readonly emptyState: string;
    readonly emptyStateDescription: string;
    readonly sessionDate: string;
    readonly reason: string;
    readonly submittedAt: string;
    readonly processedAt: string;
  };
}
