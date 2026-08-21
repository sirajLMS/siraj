import { CronRunStatus, CronScheduleStatus, CronTriggerSource } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

/** Returns localized label for a schedule status. */
export function getCronStatusLabel(status: CronScheduleStatus, labels: CronLabels): string {
  switch (status) {
    case CronScheduleStatus.Active:
      return labels.statusActive;
    case CronScheduleStatus.Paused:
      return labels.statusPaused;
    default:
      return labels.statusDisabled;
  }
}

/** Returns localized label for a run trigger source. */
export function getCronTriggerSourceLabel(source: CronTriggerSource, labels: CronLabels): string {
  switch (source) {
    case CronTriggerSource.VercelTicker:
      return labels.triggerSourceVercelTicker;
    case CronTriggerSource.VercelExplicit:
      return labels.triggerSourceVercelExplicit;
    case CronTriggerSource.External:
      return labels.triggerSourceExternal;
    case CronTriggerSource.Manual:
      return labels.triggerSourceManual;
    case CronTriggerSource.WorkerRetry:
      return labels.triggerSourceWorkerRetry;
    default:
      return source;
  }
}

/** Returns localized label for a run status. */
export function getCronRunStatusLabel(status: CronRunStatus, labels: CronLabels): string {
  switch (status) {
    case CronRunStatus.Pending:
      return labels.statusPending;
    case CronRunStatus.Running:
      return labels.statusRunning;
    case CronRunStatus.Completed:
      return labels.statusCompleted;
    case CronRunStatus.Failed:
      return labels.statusFailed;
    case CronRunStatus.Retrying:
      return labels.statusRetrying;
    case CronRunStatus.Timeout:
      return labels.statusTimeout;
    case CronRunStatus.Cancelled:
      return labels.statusCancelled;
    default:
      return status;
  }
}
