/** Cron management dashboard labels — English. */
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

export const dashboardCronEn: CronLabels = {
  pageTitle: "Cron Management",
  pageSubtitle: "Manage scheduled cron jobs and monitor their execution.",
  // Table headers
  colName: "Name",
  colExpression: "Cron Expression",
  colJobKind: "Job Kind",
  colStatus: "Status",
  colNextRun: "Next Run",
  colLastRun: "Last Run",
  colConcurrencyPolicy: "Concurrency",
  colActions: "Actions",
  colTriggerSource: "Trigger Source",
  colAttempt: "Attempt",
  colDuration: "Duration",
  colErrorMessage: "Error Message",
  colStartedAt: "Started At",
  // Status labels
  statusActive: "Active",
  statusPaused: "Paused",
  statusDisabled: "Disabled",
  // Actions
  actionCreate: "Create Schedule",
  actionEdit: "Edit",
  actionPause: "Pause",
  actionResume: "Resume",
  actionDelete: "Delete",
  actionTrigger: "Trigger Now",
  actionConfirm: "Confirm",
  actionCancel: "Cancel",
  // Dialog
  dialogCreateTitle: "Create Cron Schedule",
  dialogEditTitle: "Edit Cron Schedule",
  dialogRunsTitle: name => `Runs for ${name}`,
  // Form fields
  fieldName: "Name",
  fieldDescription: "Description",
  fieldCronExpression: "Cron Expression",
  fieldJobKind: "Job Kind",
  fieldPayload: "Payload (JSON)",
  fieldTimezone: "Timezone",
  fieldConcurrencyPolicy: "Concurrency Policy",
  fieldMaxRetries: "Max Retries",
  fieldRetryBackoffSeconds: "Retry Backoff (seconds)",
  fieldTimeoutSeconds: "Timeout (seconds)",
  jobKindNoop: "No-Op",
  concurrencyAllow: "Allow",
  concurrencySkip: "Skip",
  concurrencyReplace: "Replace",
  // Preview
  previewNextRuns: "Preview Next Runs",
  // Queue stats
  queueStatsTitle: "Queue Statistics",
  queueStatsPending: "Pending",
  queueStatsInFlight: "In Flight",
  queueStatsFailed: "Failed",
  // Run history
  runsTitle: "Run History",
  runsCount: count => {
    if (count === 0) {
      return "No runs";
    }
    if (count === 1) {
      return "1 run";
    }
    return `${count} runs`;
  },
  statusPending: "Pending",
  statusRunning: "Running",
  statusCompleted: "Completed",
  statusFailed: "Failed",
  statusRetrying: "Retrying",
  statusTimeout: "Timeout",
  statusCancelled: "Cancelled",
  // Trigger source labels
  triggerSourceVercelTicker: "Vercel Ticker",
  triggerSourceVercelExplicit: "Vercel Explicit",
  triggerSourceExternal: "External",
  triggerSourceWorkerRetry: "Worker Retry",
  triggerSourceManual: "Manual",
  // Queue backend labels
  pgBoss: "pg-boss",
  bullmqPostgres: "BullMQ (PostgreSQL)",
  customSql: "Custom SQL",
  queueBackendStub: "Stub (Development)",
  bullmqRedis: "BullMQ (Redis)",
  // Additional run status
  statusSkipped: "Skipped",
  // Empty state
  emptyMessage: 'No cron schedules found. Click "Create Schedule" to add one.',
  // Manual trigger confirm dialog
  manualTriggerConfirmTitle: "Trigger Schedule",
  manualTriggerConfirmMessage: name => `Are you sure you want to manually trigger "${name}"?`,
  manualTriggerConfirmButton: "Trigger Now",
  manualTriggerCancel: "Cancel",
  // Loading indicator
  loading: "Loading…",
  // Success messages
  scheduleCreated: "Schedule created successfully",
  scheduleUpdated: "Schedule updated successfully",
  scheduleDeleted: "Schedule deleted successfully",
  schedulePaused: "Schedule paused successfully",
  scheduleResumed: "Schedule resumed successfully",
  scheduleTriggered: "Schedule triggered successfully",
  triggerSkipped: "Trigger skipped — schedule already running",
  // Errors
  errors: {
    invalidCronExpression: expr => `Invalid cron expression: ${expr}`,
    scheduleNameTaken: name => `A schedule with name "${name}" already exists`,
    scheduleNotFound: id => `Schedule not found: ${id}`,
    scheduleInactive: "Schedule is not active",
    scheduleNotActive: "Schedule is not active — it may have already been paused or disabled",
    scheduleNotPaused: "Schedule is not paused — cannot resume a schedule that is not currently paused",
    concurrencyConflict: "A run for this schedule is already in progress",
    queueBackendNotAvailable: "The configured queue backend is not available",
    permissionDenied: "You do not have permission to manage cron schedules",
    invalidTimezone: tz => `Invalid timezone: ${tz}`,
    runNotFound: id => `Run not found: ${id}`,
    manualTriggerConflict: "A run is already in progress for this schedule",
    dispatchSendFailed: id => `Failed to dispatch run for schedule "${id}" — the queue adapter could not be reached`,
    enqueueRetryFailed: id => `Failed to enqueue retry for run "${id}" — the queue adapter could not be reached`,
    queueBackendUnknown: backend => `Unknown queue backend: ${backend}`,
    genericError: "An unexpected error occurred. Please try again.",
    // API route-level errors
    missingScheduleId: "Missing scheduleId query parameter",
    invalidScheduleIdFormat: "Invalid scheduleId format",
    tickerFailed: "Ticker failed",
    classRemindersFailed: "Class reminders failed",
    whatsappSyncSweepFailed: "WhatsApp sync sweep failed",
    whatsappWebhookSweepFailed: "WhatsApp webhook sweep failed",
    userContextRequired: "Authenticated user context is required to perform this action",
    // Cron auth errors (machine-to-machine API responses)
    unauthorized: "Unauthorized",
    methodNotAllowed: "Method not allowed",
    serverMisconfigured: "Server misconfigured",
  },
};
