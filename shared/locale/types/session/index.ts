/**
 * SessionLabels — compile-time safe type schema for the "session" namespace.
 * Migrated from shared/messages/types/session/main.ts (next-intl format).
 *
 * All fields that used {placeholder} ICU placeholders in next-intl are now
 * typed as functions with explicit, named parameters — checked at compile time.
 */
export interface SessionLabels {
  readonly leaveProcessedDescription: (successorId: string) => string;
  readonly absentWaitingRemark: string;
  readonly leaveRescheduledRemark: string;
  readonly resetDescription: string;
  readonly absentEventDescription: string;
  readonly autoMissedEventDescription: string;
  readonly manualRescheduleDescription: (newStart: string) => string;
  readonly manualRescheduleRemark: (oldStart: string, newStart: string) => string;
  readonly activateDescription: string;
  readonly forceActivateDescription: string;
  readonly startDescription: string;
  readonly stopDescription: string;
  readonly softDeleteDescription: string;
  readonly teacherQuotaExhaustedNote: (used: number, max: number) => string;
  readonly classTypes: {
    readonly REGULAR: string;
    readonly TRIAL: string;
    readonly ADVANCE: string;
  };
}
