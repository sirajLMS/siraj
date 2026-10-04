"use client";

import {
  buildEarlyReturnViewModel,
  buildReadyViewModel,
  buildSessionActionProps,
  formatClassInstanceSchedule,
} from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel.helpers";
import { useClassDetailsViewModelCore } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel.hooks";
import type {
  ClassDetailsViewModel,
  ClassInstance,
  OverrideRateDialogState,
} from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel.types";

export type { ClassDetailsViewModel, ClassInstance, OverrideRateDialogState };

export function useClassDetailsViewModel(): ClassDetailsViewModel {
  const core = useClassDetailsViewModelCore();

  const earlyReturnShared = {
    isWarningDismissed: core.isWarningDismissed,
    setIsWarningDismissed: core.setIsWarningDismissed,
    handlers: core.handlers,
    feedbackState: core.feedbackState,
    deleteDialogOpen: core.deleteDialogOpen,
    setDeleteDialogOpen: core.setDeleteDialogOpen,
    onGenerateLog: core.onGenerateLog,
    overrideRateDialog: core.overrideRateDialog,
    t: core.t,
    headerLabels: core.headerLabels,
    canViewSessionDetails: core.canViewSessionDetails,
  };

  if (core.loading) {
    return buildEarlyReturnViewModel("loading", earlyReturnShared);
  }

  if (!core.id) {
    return buildEarlyReturnViewModel("invalidId", earlyReturnShared);
  }

  if (core.error || !core.data?.classInstance) {
    return buildEarlyReturnViewModel("error", earlyReturnShared);
  }

  const instance = core.data.classInstance;
  const { formattedScheduledDate, formattedStartTime, formattedEndTime } = formatClassInstanceSchedule(
    instance,
    core.locale
  );

  return buildReadyViewModel({
    instance,
    canOverride: core.canOverride,
    isParentView: core.isParentView,
    isStudentView: core.isStudentView,
    canViewSessionDetails: core.canViewSessionDetails,
    isWarningDismissed: core.isWarningDismissed,
    setIsWarningDismissed: core.setIsWarningDismissed,
    handlers: core.handlers,
    sessionActionProps: buildSessionActionProps(core.mutations),
    feedbackState: core.feedbackState,
    deleteDialogOpen: core.deleteDialogOpen,
    setDeleteDialogOpen: core.setDeleteDialogOpen,
    onGenerateLog: core.onGenerateLog,
    overrideRateDialog: core.overrideRateDialog,
    t: core.t,
    headerLabels: core.headerLabels,
    formattedScheduledDate,
    formattedStartTime,
    formattedEndTime,
  });
}
