/** Labels for the Cron Management admin namespace. */

export interface CronLabels {
  pageTitle: string;
  pageSubtitle: string;
  // Table headers
  colName: string;
  colExpression: string;
  colJobKind: string;
  colStatus: string;
  colNextRun: string;
  colLastRun: string;
  colConcurrencyPolicy: string;
  colActions: string;
  colTriggerSource: string;
  colAttempt: string;
  colDuration: string;
  colErrorMessage: string;
  colStartedAt: string;
  // Status labels
  statusActive: string;
  statusPaused: string;
  statusDisabled: string;
  // Actions
  actionCreate: string;
  actionEdit: string;
  actionPause: string;
  actionResume: string;
  actionDelete: string;
  actionTrigger: string;
  actionConfirm: string;
  actionCancel: string;
  // Dialog
  dialogCreateTitle: string;
  dialogEditTitle: string;
  dialogRunsTitle: (name: string) => string;
  // Form fields
  fieldName: string;
  fieldDescription: string;
  fieldCronExpression: string;
  fieldJobKind: string;
  fieldPayload: string;
  fieldTimezone: string;
  fieldConcurrencyPolicy: string;
  fieldMaxRetries: string;
  fieldRetryBackoffSeconds: string;
  fieldTimeoutSeconds: string;
  // Job kind labels
  jobKindNoop: string;
  // Concurrency policy labels
  concurrencyAllow: string;
  concurrencySkip: string;
  concurrencyReplace: string;
  // Preview
  previewNextRuns: string;
  // Queue stats
  queueStatsTitle: string;
  queueStatsPending: string;
  queueStatsInFlight: string;
  queueStatsFailed: string;
  // Run history
  runsTitle: string;
  runsCount: (count: number) => string;
  statusPending: string;
  statusRunning: string;
  statusCompleted: string;
  statusFailed: string;
  statusRetrying: string;
  statusTimeout: string;
  statusCancelled: string;
  // Trigger source labels
  triggerSourceVercelTicker: string;
  triggerSourceVercelExplicit: string;
  triggerSourceExternal: string;
  triggerSourceWorkerRetry: string;
  triggerSourceManual: string;
  // Queue backend labels
  pgBoss: string;
  bullmqPostgres: string;
  customSql: string;
  queueBackendStub: string;
  bullmqRedis: string;
  // Additional run status
  statusSkipped: string;
  // Empty state
  emptyMessage: string;
  // Manual trigger confirm dialog
  manualTriggerConfirmTitle: string;
  manualTriggerConfirmMessage: (name: string) => string;
  manualTriggerConfirmButton: string;
  manualTriggerCancel: string;
  // Loading indicator
  loading: string;
  // Success messages
  scheduleCreated: string;
  scheduleUpdated: string;
  scheduleDeleted: string;
  schedulePaused: string;
  scheduleResumed: string;
  scheduleTriggered: string;
  triggerSkipped: string;
  // Errors
  errors: {
    invalidCronExpression: (expr: string) => string;
    scheduleNameTaken: (name: string) => string;
    scheduleNotFound: (id: string) => string;
    scheduleInactive: string;
    scheduleNotActive: string;
    scheduleNotPaused: string;
    concurrencyConflict: string;
    queueBackendNotAvailable: string;
    permissionDenied: string;
    payloadTooLarge: string;
    invalidTimezone: (tz: string) => string;
    runNotFound: (id: string) => string;
    manualTriggerConflict: string;
    dispatchSendFailed: (id: string) => string;
    enqueueRetryFailed: (id: string) => string;
    queueBackendUnknown: (backend: string) => string;
    genericError: string;
    // API route-level errors
    missingScheduleId: string;
    invalidScheduleIdFormat: string;
    tickerFailed: string;
    classRemindersFailed: string;
    whatsappSyncSweepFailed: string;
    whatsappWebhookSweepFailed: string;
    userContextRequired: string;
    // Cron auth errors (machine-to-machine API responses)
    unauthorized: string;
    methodNotAllowed: string;
    serverMisconfigured: string;
  };
}
