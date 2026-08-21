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
import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from "react";
import {
  ClassType,
  type OnDemandNoCreditsOutcome,
  type SchedulingMode,
} from "@/frontend/common/graphql/generated/gql/graphql";
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
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
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
  readonly timezone: IanaTimezone;
  readonly setTimezone: Dispatch<SetStateAction<IanaTimezone>>;
  readonly classType: ClassType;
  readonly setClassType: Dispatch<SetStateAction<ClassType>>;
  readonly meetingConfig: RecurringMeetingConfigFormState;
  readonly setMeetingConfig: Dispatch<SetStateAction<RecurringMeetingConfigFormState>>;
  readonly schedulingMode: SchedulingMode | null;
  readonly setSchedulingMode: Dispatch<SetStateAction<SchedulingMode | null>>;
  readonly quotaId: string | null;
  readonly setQuotaId: Dispatch<SetStateAction<string | null>>;
  readonly earmarkedClasses: number | null;
  readonly setEarmarkedClasses: Dispatch<SetStateAction<number | null>>;
  readonly generationHorizonWeeks: number | null;
  readonly setGenerationHorizonWeeks: Dispatch<SetStateAction<number | null>>;
  readonly ondemandNoCreditsOutcome: OnDemandNoCreditsOutcome | null;
  readonly setOndemandNoCreditsOutcome: Dispatch<SetStateAction<OnDemandNoCreditsOutcome | null>>;
  readonly meetingConfigWarning: boolean;
  readonly setMeetingConfigWarning: Dispatch<SetStateAction<boolean>>;
  readonly createdClassInstanceId: string | null;
  readonly setCreatedClassInstanceId: Dispatch<SetStateAction<string | null>>;
}

// NEW FOR PLAN v5: resetFormState — module-scope helper that resets all form
// setters to their initial values. Extracted from useDialogFormState to keep
// the hook body under CodeScene's Large Method threshold.
function resetFormState(setters: {
  setStudentId: Dispatch<SetStateAction<string>>;
  setSubjectId: Dispatch<SetStateAction<string>>;
  setDuration: Dispatch<SetStateAction<number>>;
  setDefaultStartTime: Dispatch<SetStateAction<string>>;
  setTimezone: Dispatch<SetStateAction<IanaTimezone>>;
  setClassType: Dispatch<SetStateAction<ClassType>>;
  setMeetingConfig: Dispatch<SetStateAction<RecurringMeetingConfigFormState>>;
  setSchedulingMode: Dispatch<SetStateAction<SchedulingMode | null>>;
  setQuotaId: Dispatch<SetStateAction<string | null>>;
  setEarmarkedClasses: Dispatch<SetStateAction<number | null>>;
  setGenerationHorizonWeeks: Dispatch<SetStateAction<number | null>>;
  setOndemandNoCreditsOutcome: Dispatch<SetStateAction<OnDemandNoCreditsOutcome | null>>;
  setMeetingConfigWarning: Dispatch<SetStateAction<boolean>>;
  setCreatedClassInstanceId: Dispatch<SetStateAction<string | null>>;
}): void {
  setters.setStudentId("");
  setters.setSubjectId("");
  setters.setDuration(60);
  setters.setDefaultStartTime("09:00");
  setters.setTimezone(IanaTimezone.Africa_Cairo);
  setters.setClassType(ClassType.Regular);
  setters.setMeetingConfig(emptyRecurringMeetingConfigState());
  setters.setSchedulingMode(null);
  setters.setQuotaId(null);
  setters.setEarmarkedClasses(null);
  setters.setGenerationHorizonWeeks(null);
  setters.setOndemandNoCreditsOutcome(null);
  setters.setMeetingConfigWarning(false);
  setters.setCreatedClassInstanceId(null);
}

// NEW FOR PLAN v5: useFormStateValues — internal hook that declares all 14
// useState pairs. Extracted from useDialogFormState to keep each function
// under CodeScene's Large Method threshold.
function useFormStateValues() {
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [duration, setDuration] = useState(60);
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [timezone, setTimezone] = useState<IanaTimezone>(IanaTimezone.Africa_Cairo);
  const [classType, setClassType] = useState<ClassType>(ClassType.Regular);
  const [meetingConfig, setMeetingConfig] = useState<RecurringMeetingConfigFormState>(emptyRecurringMeetingConfigState);
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode | null>(null);
  const [quotaId, setQuotaId] = useState<string | null>(null);
  const [earmarkedClasses, setEarmarkedClasses] = useState<number | null>(null);
  const [generationHorizonWeeks, setGenerationHorizonWeeks] = useState<number | null>(null);
  const [ondemandNoCreditsOutcome, setOndemandNoCreditsOutcome] = useState<OnDemandNoCreditsOutcome | null>(null);
  const [meetingConfigWarning, setMeetingConfigWarning] = useState(false);
  const [createdClassInstanceId, setCreatedClassInstanceId] = useState<string | null>(null);

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
    schedulingMode,
    setSchedulingMode,
    quotaId,
    setQuotaId,
    earmarkedClasses,
    setEarmarkedClasses,
    generationHorizonWeeks,
    setGenerationHorizonWeeks,
    ondemandNoCreditsOutcome,
    setOndemandNoCreditsOutcome,
    meetingConfigWarning,
    setMeetingConfigWarning,
    createdClassInstanceId,
    setCreatedClassInstanceId,
  };
}

// NEW FOR PLAN v5: useDialogFormState — lifts the previously inline `useState`
// cluster + the `useEffect` reset-on-open out of the tier files. The hook
// body lives here (common), so the tier files do not themselves call
// `useState` or `useEffect` (per specs.md §3 N7 + N6).
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
