import type { OverrideDialogRow } from "@/frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel";
import type {
  ClassAuditLabels,
  ClassAuditViewProps,
} from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import type { ClassAuditLabels as ClassAuditLocaleLabels } from "@/shared/locale/types/dashboard/classes/audit";

export type ClassAuditT = ClassAuditLocaleLabels;
type Audit = NonNullable<ClassAuditViewProps["audit"]>;
export type MaybeAudit = Audit | null | undefined;

/**
 * Admin-note edit dialog slice. Dialog state lives in `classAuditStore` so an
 * open dialog and its draft survive viewport tier switches.
 */
interface AdminNoteDialogState {
  readonly open: boolean;
  readonly content: string;
  readonly isSaving: boolean;
  readonly onContentChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onSave: () => void;
}

/** Payroll override dialog slice. Open state lives in `classAuditStore` so the deep link and the card share one dialog across tiers. */
export interface PayrollOverrideDialogState {
  readonly open: boolean;
  readonly row: OverrideDialogRow | null;
  readonly onClose: () => void;
  readonly onApplied: () => void;
}

/** Shell states render loading/error chrome only — the tier views never receive stubbed handlers. */
interface ClassAuditShellViewModel {
  readonly status: "loading" | "invalidId" | "error";
  readonly audit: null;
  readonly labels: Record<string, never>;
  readonly isResending: boolean;
  /** Re-runs the audit query; used by the switcher to recover from a failed fetch. */
  readonly onRetry: () => void;
}

interface ClassAuditReadyViewModel extends Omit<ClassAuditViewProps, "audit" | "labels"> {
  readonly status: "ready";
  readonly audit: Audit;
  readonly labels: ClassAuditLabels;
  /** Re-runs the audit query; used by the switcher to recover from a failed fetch. */
  readonly onRetry: () => void;
  readonly adminNoteDialog: AdminNoteDialogState;
  readonly payrollOverrideDialog: PayrollOverrideDialogState;
}

export type ClassAuditViewModel = ClassAuditShellViewModel | ClassAuditReadyViewModel;

/** Admin-note dialog slice extended with the action that seeds the draft and opens it. */
export interface AdminNoteDialogStateWithOpen extends AdminNoteDialogState {
  readonly openDialog: () => void;
}
