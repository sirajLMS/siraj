import type { ClassInstanceQuery, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { useClassActionHandlers } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassActionHandlers";
import type { ClassDetailsHeaderLabels } from "@/frontend/common/views/dashboard/classes/details/types";
import type { ClassDetailsLabels } from "@/shared/locale";

export type ClassInstance = NonNullable<ClassInstanceQuery["classInstance"]>;

export type SessionActionProps = {
  readonly onStart: () => Promise<void>;
  readonly onAbsent: () => Promise<void>;
  readonly onLeave: (reason: string) => Promise<void>;
  readonly onReset: () => Promise<void>;
  readonly isStarting: boolean;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly error: null;
};

type Translations = ClassDetailsLabels;

export type Handlers = ReturnType<typeof useClassActionHandlers>;

type FeedbackState = { readonly message: string; readonly severity: "success" | "error" } | null;

/**
 * Store-backed state + handlers for the admin override-rate dialog. The dialog
 * lives in `classDetailsStore` so it survives viewport tier switches; handlers
 * are bound to the container's action handlers by the ViewModel.
 */
export interface OverrideRateDialogState {
  readonly open: boolean;
  readonly amount: string;
  readonly currency: CurrencyCode | null;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly onAmountChange: (value: string) => void;
  readonly onCurrencyChange: (value: CurrencyCode | null) => void;
  readonly onSubmit: (clearOverride: boolean) => Promise<void>;
}

export type OverrideRateDialogStoreSlice = {
  readonly open: boolean;
  readonly amount: string;
  readonly currency: CurrencyCode | null;
  readonly setAmount: (value: string) => void;
  readonly setCurrency: (value: CurrencyCode | null) => void;
  readonly setOpen: (value: boolean) => void;
  readonly openDialog: (amount: string, currency: CurrencyCode | null) => void;
};

export type EarlyReturnStatus = "loading" | "invalidId" | "error";

export type EarlyReturnSharedFields = {
  readonly isWarningDismissed: boolean;
  readonly setIsWarningDismissed: (value: boolean) => void;
  readonly handlers: Handlers;
  readonly feedbackState: FeedbackState;
  readonly deleteDialogOpen: boolean;
  readonly setDeleteDialogOpen: (value: boolean) => void;
  readonly onGenerateLog: () => void;
  readonly overrideRateDialog: OverrideRateDialogState;
  readonly t: Translations;
  readonly headerLabels: ClassDetailsHeaderLabels;
  readonly canViewSessionDetails: boolean;
};

export type MutationsShape = {
  startSession: () => Promise<void>;
  markAbsent: () => Promise<void>;
  processLeave: (reason: string) => Promise<void>;
  resetSession: () => Promise<void>;
  isStarting: boolean;
  isMarkingAbsent: boolean;
  isProcessingLeave: boolean;
  isResetting: boolean;
};

type ClassDetailsSharedFields = {
  readonly canOverride: boolean;
  readonly isParentView: boolean;
  readonly isStudentView: boolean;
  readonly canViewSessionDetails: boolean;
  readonly isWarningDismissed: boolean;
  readonly setIsWarningDismissed: (value: boolean) => void;
  readonly handlers: Handlers;
  readonly sessionActionProps: SessionActionProps;
  readonly feedbackState: FeedbackState;
  readonly deleteDialogOpen: boolean;
  readonly setDeleteDialogOpen: (value: boolean) => void;
  readonly onGenerateLog: () => void;
  readonly overrideRateDialog: OverrideRateDialogState;
  readonly t: Translations;
  readonly headerLabels: ClassDetailsHeaderLabels;
  readonly formattedScheduledDate: string;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
};

export type ReadyInputs = ClassDetailsSharedFields & {
  readonly instance: ClassInstance;
};

export interface ClassDetailsViewModel extends ClassDetailsSharedFields {
  readonly status: "loading" | "invalidId" | "error" | "ready";
  readonly instance: ClassInstance | null;
}
