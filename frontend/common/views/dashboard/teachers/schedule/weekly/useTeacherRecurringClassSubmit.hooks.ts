"use client";

import type { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback } from "react";
import type { CreateRecurringClassInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { CreateRecurringClassResult } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherRecurringClassComplete.hooks";
import { buildCreateRecurringClassInput } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/utils";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";

export type CreateClassFn = (opts: { variables: { input: CreateRecurringClassInput } }) => Promise<{
  data?: { createRecurringClass?: CreateRecurringClassResult | null };
}>;

async function executeRecurringClassSubmit(params: {
  readonly teacherId: string;
  readonly formState: CreateRecurringClassDialogFormState;
  readonly days: readonly DayScheduleConfig[];
  readonly createClassMutation: CreateClassFn;
  readonly completeSuccessfulCreate: (result: CreateRecurringClassResult) => Promise<void>;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly creationFailedLabel: TeacherCreateRecurringClassLabels["errors"]["creationFailed"];
}): Promise<void> {
  const {
    teacherId,
    formState,
    days,
    createClassMutation,
    completeSuccessfulCreate,
    notifications,
    creationFailedLabel,
  } = params;

  try {
    const input = buildCreateRecurringClassInput({
      studentId: formState.studentId,
      teacherId,
      subjectId: formState.subjectId,
      duration: formState.duration,
      defaultStartTime: formState.defaultStartTime,
      timezone: formState.timezone,
      classType: formState.classType,
      days,
      schedulingMode: formState.schedulingMode,
      quotaId: formState.quotaId,
      earmarkedClasses: formState.earmarkedClasses,
      generationHorizonWeeks: formState.generationHorizonWeeks,
      ondemandNoCreditsOutcome: formState.ondemandNoCreditsOutcome,
    });

    const { data } = await createClassMutation({ variables: { input } });

    if (data?.createRecurringClass) {
      await completeSuccessfulCreate(data.createRecurringClass);
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("Failed to create recurring class", { err: error });
    notifications.show(creationFailedLabel, { severity: "error" });
  }
}

export function useHandleSubmit(args: {
  readonly teacherId: string;
  readonly formState: CreateRecurringClassDialogFormState;
  readonly days: readonly DayScheduleConfig[];
  readonly validateBeforeSubmit: () => boolean;
  readonly createClassMutation: CreateClassFn;
  readonly completeSuccessfulCreate: (result: CreateRecurringClassResult) => Promise<void>;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly creationFailedLabel: TeacherCreateRecurringClassLabels["errors"]["creationFailed"];
}) {
  const {
    teacherId,
    formState,
    days,
    validateBeforeSubmit,
    createClassMutation,
    completeSuccessfulCreate,
    notifications,
    creationFailedLabel,
  } = args;

  return useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateBeforeSubmit()) {
        return;
      }

      await executeRecurringClassSubmit({
        teacherId,
        formState,
        days,
        createClassMutation,
        completeSuccessfulCreate,
        notifications,
        creationFailedLabel,
      });
    },
    [
      validateBeforeSubmit,
      teacherId,
      formState,
      days,
      createClassMutation,
      completeSuccessfulCreate,
      notifications,
      creationFailedLabel,
    ]
  );
}
