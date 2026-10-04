import { type Dispatch, type SetStateAction, useState } from "react";
import {
  ClassType,
  type OnDemandNoCreditsOutcome,
  type SchedulingMode,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  emptyRecurringMeetingConfigState,
  type RecurringMeetingConfigFormState,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

/**
 * Field bag managed by `useDialogFormState`: one value/setter pair per form
 * control of the create-recurring-class dialog. Exposed publicly so tier
 * `DialogFormContent` prop signatures can reference it without re-importing
 * the hook return type.
 */
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

/**
 * Resets every dialog field back to its default value. Only the setter half
 * of the form state is touched; the value half is refreshed by React on the
 * next render.
 */
function resetFormState(state: CreateRecurringClassDialogFormState): void {
  state.setStudentId("");
  state.setSubjectId("");
  state.setDuration(60);
  state.setDefaultStartTime("09:00");
  state.setTimezone(IanaTimezone.Africa_Cairo);
  state.setClassType(ClassType.Regular);
  state.setMeetingConfig(emptyRecurringMeetingConfigState());
  state.setSchedulingMode(null);
  state.setQuotaId(null);
  state.setEarmarkedClasses(null);
  state.setGenerationHorizonWeeks(null);
  state.setOndemandNoCreditsOutcome(null);
  state.setMeetingConfigWarning(false);
  state.setCreatedClassInstanceId(null);
}

/** Declares the `useState` pair for every field of the dialog form. */
function useFormStateValues(): CreateRecurringClassDialogFormState {
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

export { resetFormState, useFormStateValues };
