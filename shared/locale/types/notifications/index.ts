/**
 * NotificationsLabels — compile-time TypeScript i18n schema for the `notifications`
 * namespace. Consumed by `backend/services/notification/notification-payloads.builders.ts`
 * via `getServerTranslations(locale).notificationsTranslations`.
 *
 * Convention (per shared/AGENTS.md):
 *   - Static strings stay as `string`.
 *   - Interpolated strings are typed as functions with explicit param shapes.
 *   - This file is the SOLE source of truth for notification title/body strings —
 *     building notification payloads inline with English literals is forbidden
 *     (specs.md F3). Every builder pulls from here.
 *
 * The schema is keyed by `NotificationEventType` from
 * `@/backend/enum` — but to keep `shared/` free of `@/backend/**` imports, the
 * event-type keys are reproduced as plain string-literal unions and validated by
 * the consuming layer (specs.md §1 forbids `@/backend/**` in `shared/`).
 */

// ─── Invoice event keys ────────────────────────────────────────────────

/** Labels for the `INVOICE_GENERATED` event — title string + body template. */
export interface InvoiceGeneratedLabels {
  /** Static title shown on all channels for this event. */
  readonly title: string;
  /** Body template parameterised on the invoice id and amount with currency. */
  readonly body: (params: { invoiceId: string; amount: string; currency: string }) => string;
}

/** Labels for the `INVOICE_STATUS_CHANGED` event, keyed by action. */
export interface InvoiceStatusChangedLabels {
  readonly proofSubmitted: {
    readonly title: string;
    readonly body: (params: { invoiceId: string }) => string;
  };
  readonly proofApproved: {
    readonly title: string;
    readonly body: (params: { invoiceId: string }) => string;
  };
  readonly proofRejected: {
    readonly title: string;
    readonly body: (params: { invoiceId: string }) => string;
  };
  readonly markedPaid: {
    readonly title: string;
    readonly body: (params: { invoiceId: string }) => string;
  };
}

// ─── Payment-method event keys ─────────────────────────────────────────

/** Labels for the `PAYMENT_METHOD_CHANGED` event, keyed by action. */
export interface PaymentMethodChangedLabels {
  readonly created: { readonly title: string; readonly body: (params: { identifier: string }) => string };
  readonly updated: { readonly title: string; readonly body: (params: { identifier: string }) => string };
  readonly deleted: { readonly title: string; readonly body: (params: { identifier: string }) => string };
  readonly setDefault: { readonly title: string; readonly body: (params: { identifier: string }) => string };
  readonly verified: { readonly title: string; readonly body: (params: { identifier: string }) => string };
}

// ─── Class lifecycle event keys ─────────────────────────────────────────

/** Body params shared by all class-lifecycle events that reference a class instance. */
export interface ClassLifecycleBodyParams {
  readonly studentName: string;
  readonly scheduledStartAt: string;
}

export interface ClassScheduledLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams) => string;
}

export interface ClassActivatedLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams) => string;
}

export interface ClassStartedLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams) => string;
}

export interface ClassCompletedLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams) => string;
}

export interface ClassMarkedAbsentLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams) => string;
}

export interface ClassMarkedMissedLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams) => string;
}

export interface ClassLeaveRequestedLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams) => string;
}

export interface ClassRescheduledLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams & { newStartAt: string }) => string;
}

export interface ClassCancelledLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams) => string;
}

export interface ClassResetLabels {
  readonly title: string;
  readonly body: (params: ClassLifecycleBodyParams) => string;
}

// ─── Student lifecycle event keys ──────────────────────────────────────

/** Recipient variants for `STUDENT_TEACHER_REASSIGNED`. */
export type StudentTeacherReassignmentRecipient = "parent" | "oldTeacher" | "newTeacher";

export interface StudentTeacherReassignedLabels {
  readonly parent: {
    readonly title: string;
    readonly body: (params: { studentName: string; newTeacherName: string }) => string;
  };
  readonly oldTeacher: {
    readonly title: string;
    readonly body: (params: { studentName: string; newTeacherName: string }) => string;
  };
  readonly newTeacher: {
    readonly title: string;
    readonly body: (params: { studentName: string; oldTeacherName: string }) => string;
  };
}

export interface StudentStatusChangedLabels {
  readonly title: string;
  readonly body: (params: { studentName: string; oldStatus: string; newStatus: string }) => string;
}

export interface StudentQuotaOverriddenLabels {
  readonly title: string;
  readonly body: (params: { studentName: string; newClassesRemaining: number }) => string;
}

// ─── Top-level namespace ────────────────────────────────────────────────

/**
 * NotificationsLabels — top-level exported shape, registered as
 * `notificationsTranslations` on `Translations` in
 * `@/shared/locale/types/message.ts`.
 */
export interface NotificationsLabels {
  readonly invoiceGenerated: InvoiceGeneratedLabels;
  readonly invoiceStatusChanged: InvoiceStatusChangedLabels;
  readonly paymentMethodChanged: PaymentMethodChangedLabels;
  readonly classScheduled: ClassScheduledLabels;
  readonly classActivated: ClassActivatedLabels;
  readonly classStarted: ClassStartedLabels;
  readonly classCompleted: ClassCompletedLabels;
  readonly classMarkedAbsent: ClassMarkedAbsentLabels;
  readonly classMarkedMissed: ClassMarkedMissedLabels;
  readonly classLeaveRequested: ClassLeaveRequestedLabels;
  readonly classRescheduled: ClassRescheduledLabels;
  readonly classCancelled: ClassCancelledLabels;
  readonly classReset: ClassResetLabels;
  readonly studentTeacherReassigned: StudentTeacherReassignedLabels;
  readonly studentStatusChanged: StudentStatusChangedLabels;
  readonly studentQuotaOverridden: StudentQuotaOverriddenLabels;

  // Drawer UI keys
  readonly drawerTitle: string;
  readonly managePreferences: string;
  readonly markAllRead: string;
  readonly markAsRead: string;
  readonly reschedule: string;
  readonly viewEntity: string;
  readonly approveInvoice: string;
  readonly rejectInvoice: string;
  readonly noNotifications: string;
  readonly unreadCount: (count: number) => string;
}
