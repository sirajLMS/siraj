import type { GridColDef } from "@mui/x-data-grid";
import {
  CronConcurrencyPolicy,
  CronJobKind,
  type CronQueueStatsFieldsFragment,
  type CronRunFieldsFragment,
  type CronScheduleFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

export interface CronNotificationState {
  readonly errorOpen: boolean;
  readonly errorMsg: string;
  readonly successOpen: boolean;
  readonly successMsg: string;
  readonly infoOpen: boolean;
  readonly infoMsg: string;
  readonly showError: (message: string) => void;
  readonly showSuccess: (message: string) => void;
  readonly showInfo: (message: string) => void;
  readonly closeError: () => void;
  readonly closeSuccess: () => void;
  readonly closeInfo: () => void;
}

export interface CronScheduleFormData {
  readonly name: string;
  readonly description: string;
  readonly cronExpression: string;
  readonly jobKind: CronJobKind;
  readonly payload: string;
  readonly timezone: string;
  readonly concurrencyPolicy: CronConcurrencyPolicy;
  readonly maxRetries: string | number;
  readonly retryBackoffSeconds: string | number;
  readonly timeoutSeconds: string | number;
}

export const EMPTY_FORM: CronScheduleFormData = {
  name: "",
  description: "",
  cronExpression: "",
  jobKind: CronJobKind.Noop,
  payload: "",
  timezone: "UTC",
  concurrencyPolicy: CronConcurrencyPolicy.Allow,
  maxRetries: 3,
  retryBackoffSeconds: 60,
  timeoutSeconds: 300,
};

export interface CronViewProps {
  readonly labels: CronLabels;
  readonly locale: string;
  readonly rows: readonly CronScheduleFieldsFragment[];
  readonly columns: GridColDef<CronScheduleFieldsFragment>[];
  readonly loading: boolean;
  readonly queueStats: CronQueueStatsFieldsFragment | null;
  readonly queueStatsLoading: boolean;
  readonly createOpen: boolean;
  readonly editingSchedule: CronScheduleFieldsFragment | null;
  readonly deletingSchedule: CronScheduleFieldsFragment | null;
  readonly deleting: boolean;
  readonly saving: boolean;
  readonly triggering: boolean;
  readonly triggeringSchedule: CronScheduleFieldsFragment | null;
  readonly runsOpen: boolean;
  readonly runsSchedule: CronScheduleFieldsFragment | null;
  readonly runs: readonly CronRunFieldsFragment[];
  readonly runsLoading: boolean;
  readonly notifications: CronNotificationState;
  readonly canManage: boolean;
  readonly onCreateOpen: () => void;
  readonly onCreateClose: () => void;
  readonly onEditRow: (row: CronScheduleFieldsFragment) => void;
  readonly onEditClose: () => void;
  readonly onSave: (data: CronScheduleFormData) => Promise<void>;
  readonly onDeleteRow: (row: CronScheduleFieldsFragment) => void;
  readonly onDeleteClose: () => void;
  readonly onDeleteConfirm: () => Promise<void>;
  readonly onPauseRow: (row: CronScheduleFieldsFragment) => void;
  readonly onResumeRow: (row: CronScheduleFieldsFragment) => void;
  readonly onTriggerRow: (row: CronScheduleFieldsFragment) => void;
  readonly onTriggerClose: () => void;
  readonly onTriggerConfirm: () => void;
  readonly onRunsOpen: (row: CronScheduleFieldsFragment) => void;
  readonly onRunsClose: () => void;
  readonly onPreviewNextRuns: (expression: string, timezone: string) => string[];
}
