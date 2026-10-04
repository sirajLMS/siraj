// Shared dialog hooks for the create-recurring-class dialog. Both tier files
// (`createRecurringClassDialog.{mobile,desktop}.tsx`) import this single
// implementation instead of declaring their own `useState` / `useEffect` /
// `function useX` copies — custom hooks live in this `hooks/` directory.

import type { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useState } from "react";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  getRecurringMeetingConfigErrorKey,
  isRecurringMeetingConfigValid,
  resolveRecurringMeetingConfigErrorMessage,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/recurringMeetingConfigValidation";
import {
  type CreateRecurringClassDialogFormState,
  resetFormState,
  useFormStateValues,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks/useCreateRecurringClassDialog.helpers";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigManagerLabels,
  TeacherCreateRecurringClassLabels,
} from "@/shared/locale";

export type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks/useCreateRecurringClassDialog.helpers";

/**
 * Owns the create-recurring-class form state: one value/setter pair per field
 * plus a reset whenever the dialog transitions from closed to open. Tier
 * dialog files consume this instead of declaring their own state cluster.
 */
export function useDialogFormState(isDialogOpen: boolean, resetDays: () => void): CreateRecurringClassDialogFormState {
  const s = useFormStateValues();

  // Reset all form state when the dialog transitions from closed to open.
  // Uses the "adjust state during render" pattern (React docs) instead of
  // setState-in-effect to avoid cascading renders.
  const [prevIsDialogOpen, setPrevIsDialogOpen] = useState(isDialogOpen);
  if (isDialogOpen !== prevIsDialogOpen) {
    setPrevIsDialogOpen(isDialogOpen);
    if (isDialogOpen) {
      resetFormState(s);
    }
  }

  // resetDays is an external-system sync (parent day state) — keep in effect.
  useEffect(() => {
    if (isDialogOpen) {
      resetDays();
    }
  }, [isDialogOpen, resetDays]);

  return s;
}

/**
 * Returns a stable validation callback for the dialog submit flow. Surfaces
 * the first failed rule through the supplied `useNotifications` handle using
 * localized copy from the dialog's translation namespaces.
 */
export function useValidation(
  state: CreateRecurringClassDialogFormState,
  days: readonly DayScheduleConfig[],
  notifications: ReturnType<typeof useNotifications>,
  t: TeacherCreateRecurringClassLabels,
  tClassScope: MeetingConfigClassScopeLabels,
  tMeeting: MeetingConfigManagerLabels
): () => boolean {
  return useCallback((): boolean => {
    if (!state.studentId) {
      notifications.show(t.errors.noStudentSelected, { severity: "error" });
      return false;
    }

    if (!state.subjectId) {
      notifications.show(t.errors.noSubjectSelected, { severity: "error" });
      return false;
    }

    const activeDays = days.filter(d => d.enabled);
    if (activeDays.length === 0) {
      notifications.show(t.errors.noDaysSelected, { severity: "error" });
      return false;
    }

    if (state.duration <= 0) {
      notifications.show(t.errors.durationMustBePositive, { severity: "error" });
      return false;
    }

    if (!isRecurringMeetingConfigValid(state.meetingConfig)) {
      const errorKey = getRecurringMeetingConfigErrorKey(state.meetingConfig);
      const message = resolveRecurringMeetingConfigErrorMessage(errorKey, {
        recurringFieldsRequired: tClassScope.recurringFieldsRequired,
        urlNotAllowed: tMeeting.urlNotAllowed,
      });
      notifications.show(message ?? tMeeting.urlNotAllowed, { severity: "error" });
      return false;
    }

    return true;
  }, [
    state.studentId,
    state.subjectId,
    state.duration,
    state.meetingConfig,
    days,
    notifications,
    t,
    tClassScope,
    tMeeting,
  ]);
}
