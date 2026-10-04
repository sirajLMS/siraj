import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatScheduleTimeOnly } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import type {
  ClassDetailsViewModel,
  ClassInstance,
  EarlyReturnSharedFields,
  EarlyReturnStatus,
  Handlers,
  MutationsShape,
  OverrideRateDialogState,
  OverrideRateDialogStoreSlice,
  ReadyInputs,
  SessionActionProps,
} from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel.types";
import {
  type ClassDetailsHeaderLabels,
  formatClassDetailDate,
} from "@/frontend/common/views/dashboard/classes/details/types";
import type { ClassDetailsLabels } from "@/shared/locale";

const noopAsync = () => Promise.resolve();

const noopSessionActionProps: SessionActionProps = {
  onStart: noopAsync,
  onAbsent: noopAsync,
  onLeave: noopAsync,
  onReset: noopAsync,
  isStarting: false,
  isMarkingAbsent: false,
  isProcessingLeave: false,
  isResetting: false,
  error: null,
};

export function buildOverrideRateDialog(
  store: OverrideRateDialogStoreSlice,
  handlers: Handlers,
  seedAmount: string,
  seedCurrency: CurrencyCode | null
): OverrideRateDialogState {
  return {
    open: store.open,
    amount: store.amount,
    currency: store.currency,
    onOpen: () => store.openDialog(seedAmount, seedCurrency),
    onClose: () => store.setOpen(false),
    onAmountChange: store.setAmount,
    onCurrencyChange: store.setCurrency,
    onSubmit: async (clearOverride: boolean) => {
      // An empty amount (or an explicit clear action) removes the override entirely.
      const normalizedAmount = store.amount.trim();
      const rateAmount = clearOverride || normalizedAmount.length === 0 ? null : normalizedAmount;
      const rateCurrency = rateAmount ? store.currency : null;
      await handlers.handleOverrideRate(rateAmount, rateCurrency);
      store.setOpen(false);
    },
  };
}

export function buildClassDetailsHeaderLabels(
  t: ClassDetailsLabels,
  classTypes: ClassDetailsHeaderLabels["classTypes"]
): ClassDetailsHeaderLabels {
  return {
    pageSubtitleAdmin: t.pageSubtitleAdmin,
    pageSubtitleTeacher: t.pageSubtitleTeacher,
    pageSubtitleStudent: t.pageSubtitleStudent,
    classTypes,
    breadcrumbs: {
      dashboard: t.breadcrumbs.dashboard,
      classes: t.breadcrumbs.classes,
    },
  };
}

export function formatClassInstanceSchedule(instance: ClassInstance, locale: string) {
  return {
    formattedScheduledDate: formatClassDetailDate(instance.scheduledDate, locale),
    formattedStartTime: formatScheduleTimeOnly(instance.startTime, locale),
    formattedEndTime: formatScheduleTimeOnly(instance.endTime, locale),
  };
}

export function buildEarlyReturnViewModel(
  status: EarlyReturnStatus,
  shared: EarlyReturnSharedFields
): ClassDetailsViewModel {
  return {
    status,
    instance: null,
    canOverride: false,
    isParentView: false,
    isStudentView: false,
    canViewSessionDetails: shared.canViewSessionDetails,
    isWarningDismissed: shared.isWarningDismissed,
    setIsWarningDismissed: shared.setIsWarningDismissed,
    handlers: shared.handlers,
    sessionActionProps: noopSessionActionProps,
    feedbackState: shared.feedbackState,
    deleteDialogOpen: shared.deleteDialogOpen,
    setDeleteDialogOpen: shared.setDeleteDialogOpen,
    onGenerateLog: shared.onGenerateLog,
    overrideRateDialog: shared.overrideRateDialog,
    t: shared.t,
    headerLabels: shared.headerLabels,
    formattedScheduledDate: "",
    formattedStartTime: "",
    formattedEndTime: "",
  };
}

export function buildSessionActionProps(mutations: MutationsShape): SessionActionProps {
  return {
    onStart: () => mutations.startSession(),
    onAbsent: () => mutations.markAbsent(),
    onLeave: (reason: string) => mutations.processLeave(reason),
    onReset: () => mutations.resetSession(),
    isStarting: mutations.isStarting,
    isMarkingAbsent: mutations.isMarkingAbsent,
    isProcessingLeave: mutations.isProcessingLeave,
    isResetting: mutations.isResetting,
    error: null,
  };
}

export function buildReadyViewModel(inputs: ReadyInputs): ClassDetailsViewModel {
  return {
    status: "ready",
    instance: inputs.instance,
    canOverride: inputs.canOverride,
    isParentView: inputs.isParentView,
    isStudentView: inputs.isStudentView,
    canViewSessionDetails: inputs.canViewSessionDetails,
    isWarningDismissed: inputs.isWarningDismissed,
    setIsWarningDismissed: inputs.setIsWarningDismissed,
    handlers: inputs.handlers,
    sessionActionProps: inputs.sessionActionProps,
    feedbackState: inputs.feedbackState,
    deleteDialogOpen: inputs.deleteDialogOpen,
    setDeleteDialogOpen: inputs.setDeleteDialogOpen,
    onGenerateLog: inputs.onGenerateLog,
    overrideRateDialog: inputs.overrideRateDialog,
    t: inputs.t,
    headerLabels: inputs.headerLabels,
    formattedScheduledDate: inputs.formattedScheduledDate,
    formattedStartTime: inputs.formattedStartTime,
    formattedEndTime: inputs.formattedEndTime,
  };
}
