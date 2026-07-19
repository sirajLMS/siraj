// NEW FOR PLAN v5 (newly created for the migration wave): Custom dialog
// hooks + validation lifted out of the byte-identical inline declarations in
// BOTH tier files `createRecurringClassDialog.{mobile,desktop}.tsx` per
// specs.md §3 N7 (state), N25 (`function useX` declarations in tier), and §5
// (custom hooks live in `frontend/common/views/dashboard/<domain>/hooks/`).
//
// Both tier files previously declared byte-identical copies of
// `useDialogFormState` (containing 8 `useState` + 1 `useEffect`) and
// `useValidation` (containing the form-validation logic keyed off the
// `useNotifications` API). Both tier files now import this single shared
// implementation — the tier files themselves contain no `useState` /
// `useEffect` / `function useX` declarations of their own.

import type { useNotifications } from "@toolpad/core/useNotifications";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { ClassType as ClassTypeEnum } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  emptyRecurringMeetingConfigState,
  type RecurringMeetingConfigFormState,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import {
  getRecurringMeetingConfigErrorKey,
  isRecurringMeetingConfigValid,
  resolveRecurringMeetingConfigErrorMessage,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/recurringMeetingConfigValidation";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigManagerLabels,
  TeacherCreateRecurringClassLabels,
} from "@/shared/locale";

// NEW FOR PLAN v5: CreateRecurringClassDialogFormState — the bag of fields
// managed by `useDialogFormState`. Exposed as a public type so tier
// `DialogFormContent` prop signatures can reference it without having to
// re-import the hook return type.
export interface CreateRecurringClassDialogFormState {
  readonly studentId: string;
  readonly setStudentId: Dispatch<SetStateAction<string>>;
  readonly subjectId: string;
  readonly setSubjectId: Dispatch<SetStateAction<string>>;
  readonly duration: number;
  readonly setDuration: Dispatch<SetStateAction<number>>;
  readonly defaultStartTime: string;
  readonly setDefaultStartTime: Dispatch<SetStateAction<string>>;
  readonly timezone: string;
  readonly setTimezone: Dispatch<SetStateAction<string>>;
  readonly classType: ClassTypeEnum;
  readonly setClassType: Dispatch<SetStateAction<ClassTypeEnum>>;
  readonly meetingConfig: RecurringMeetingConfigFormState;
  readonly setMeetingConfig: Dispatch<SetStateAction<RecurringMeetingConfigFormState>>;
  readonly meetingConfigWarning: boolean;
  readonly setMeetingConfigWarning: Dispatch<SetStateAction<boolean>>;
  readonly createdClassInstanceId: string | null;
  readonly setCreatedClassInstanceId: Dispatch<SetStateAction<string | null>>;
}

// NEW FOR PLAN v5: useDialogFormState — lifts the previously inline `useState`
// cluster + the `useEffect` reset-on-open out of the tier files. The hook
// body lives here (common), so the tier files do not themselves call
// `useState` or `useEffect` (per specs.md §3 N7 + N6).
export function useDialogFormState(isDialogOpen: boolean, resetDays: () => void): CreateRecurringClassDialogFormState {
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [duration, setDuration] = useState(60);
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [timezone, setTimezone] = useState("Africa/Cairo");
  const [classType, setClassType] = useState<ClassTypeEnum>(ClassTypeEnum.Regular);
  const [meetingConfig, setMeetingConfig] = useState<RecurringMeetingConfigFormState>(emptyRecurringMeetingConfigState);
  const [meetingConfigWarning, setMeetingConfigWarning] = useState(false);
  const [createdClassInstanceId, setCreatedClassInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (isDialogOpen) {
      setStudentId("");
      setSubjectId("");
      setDuration(60);
      setDefaultStartTime("09:00");
      setTimezone("Africa/Cairo");
      setClassType(ClassTypeEnum.Regular);
      setMeetingConfig(emptyRecurringMeetingConfigState());
      setMeetingConfigWarning(false);
      setCreatedClassInstanceId(null);
      resetDays();
    }
  }, [isDialogOpen, resetDays]);

  return {
    studentId,
    setStudentId,
    subjectId,
    setSubjectId,
    duration,
    setDuration,
    defaultStartTime,
    setDefaultStartTime,
    timezone,
    setTimezone,
    classType,
    setClassType,
    meetingConfig,
    setMeetingConfig,
    meetingConfigWarning,
    setMeetingConfigWarning,
    createdClassInstanceId,
    setCreatedClassInstanceId,
  };
}

// NEW FOR PLAN v5: useValidation — lifts the previously inline
// `function useValidation` out of the tier files. Returns a stable
// validation callback that consults the supplied `useNotifications`
// handle to surface the form errors.
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
