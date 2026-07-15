"use client";

import { type MutationTuple, useApolloClient, useMutation } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type {
  CreateRecurringClassInput,
  MutationCreateRecurringClassArgs,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { createRecurringClassMutationDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents";
import { useCreateRecurringClassStore } from "@/frontend/common/stores/createRecurringClassStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { CreateRecurringClassView } from "@/frontend/common/views/dashboard/classes/recurring/CreateRecurringClassView";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { mapFormDataToInput } from "@/frontend/common/views/dashboard/classes/recurring/utils/mapRecurringClassFormData";
import {
  postCreateRecurringMeetingConfig,
  type RecurringMeetingConfigFormState,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import {
  getRecurringMeetingConfigErrorKey,
  resolveRecurringMeetingConfigErrorMessage,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/recurringMeetingConfigValidation";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";
import type { CreateRecurringClassLabels } from "@/shared/locale/types/dashboard/classes/createRecurringClass";

type TranslationFn = ReturnType<typeof useAppTranslation>;

function useRecurringClassLabels(t: TranslationFn): CreateRecurringClassLabels {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      title: t.title,
      subtitle: t.subtitle,
      breadcrumbs: {
        dashboard: t.breadcrumbs.dashboard,
        classes: t.breadcrumbs.classes,
      },
      add: t.add,
      addClass: t.addClass,
      addedSuccessfully: t.addedSuccessfully,
      close: t.close,
      students: t.students,
      studentsPlaceholder: t.studentsPlaceholder,
      teacher: t.teacher,
      teacherPlaceholder: t.teacherPlaceholder,
      defaultStartTime: t.defaultStartTime,
      duration: t.duration,
      durationHours: t.durationHours,
      durationMinutes: t.durationMinutes,
      hours: t.hours,
      minutes: t.minutes,
      daysSelection: t.daysSelection,
      classSchedule: t.classSchedule,
      timeOverride: t.timeOverride,
      weekendOff: t.weekendOff,
      timezone: t.timezone,
      timezonePlaceholder: t.timezonePlaceholder,
      classType: t.classType,
      classTypePlaceholder: t.classTypePlaceholder,
      days: {
        monday: t.days.monday,
        tuesday: t.days.tuesday,
        wednesday: t.days.wednesday,
        thursday: t.days.thursday,
        friday: t.days.friday,
        saturday: t.days.saturday,
        sunday: t.days.sunday,
      },
      validation: {
        studentRequired: t.validation.studentRequired,
        teacherRequired: t.validation.teacherRequired,
        startTimeRequired: t.validation.startTimeRequired,
        durationRequired: t.validation.durationRequired,
        daysRequired: t.validation.daysRequired,
        durationHoursMax: t.validation.durationHoursMax,
        durationMinutesMax: t.validation.durationMinutesMax,
        timezoneRequired: t.validation.timezoneRequired,
        creationFailed: t.validation.creationFailed,
      },
    }),
    [t]
  );
}

interface SubmitHookParams {
  readonly t: TranslationFn;
  readonly tMeeting: TranslationFn;
  readonly tClassScope: TranslationFn;
  readonly client: ReturnType<typeof useApolloClient>;
  readonly router: ReturnType<typeof useRouter>;
  readonly createClassMutation: MutationTuple<
    Operations.CreateRecurringClassMutation,
    MutationCreateRecurringClassArgs
  >[0];
  readonly setSubmitting: (value: boolean) => void;
  readonly resetSuccess: () => void;
  readonly clearError: () => void;
  readonly setShowSuccess: (value: boolean) => void;
  readonly setErrorMessage: (message: string) => void;
  readonly setMeetingConfigWarning: (value: boolean) => void;
  readonly setCreatedClassInstanceId: (id: string | null) => void;
}

function useRecurringClassSubmit(params: SubmitHookParams) {
  return useCallback(
    async (data: RecurringClassFormData, meetingConfig: RecurringMeetingConfigFormState) => {
      const {
        t,
        tMeeting,
        tClassScope,
        client,
        router,
        createClassMutation,
        setSubmitting,
        resetSuccess,
        clearError,
        setShowSuccess,
        setErrorMessage,
        setMeetingConfigWarning,
        setCreatedClassInstanceId,
      } = params;

      const meetingErrorKey = getRecurringMeetingConfigErrorKey(meetingConfig);
      const meetingErrorMessage = resolveRecurringMeetingConfigErrorMessage(meetingErrorKey, {
        recurringFieldsRequired: tClassScope.recurringFieldsRequired,
        urlNotAllowed: tMeeting.urlNotAllowed,
      });
      if (meetingErrorMessage) {
        setErrorMessage(meetingErrorMessage);
        return;
      }

      setSubmitting(true);
      resetSuccess();
      clearError();
      setMeetingConfigWarning(false);
      setCreatedClassInstanceId(null);

      try {
        const input: CreateRecurringClassInput = mapFormDataToInput(data);
        const { data: result } = await createClassMutation({ variables: { input } });

        if (result?.createRecurringClass) {
          const recurringScheduleId = result.createRecurringClass.recurringScheduleId;
          const firstClassInstanceId = result.createRecurringClass.classInstanceIds?.[0] ?? null;
          let meetingConfigSaved = true;

          if (recurringScheduleId) {
            const meetingResult = await postCreateRecurringMeetingConfig(client, recurringScheduleId, meetingConfig);
            meetingConfigSaved = meetingResult.success;
            if (!meetingResult.success) {
              setMeetingConfigWarning(true);
              setCreatedClassInstanceId(firstClassInstanceId);
            }
          }

          setShowSuccess(true);
          logger.info("Recurring class created:", result.createRecurringClass.id);

          if (meetingConfigSaved) {
            setTimeout(() => {
              if (firstClassInstanceId) {
                router.push(`/classes/${firstClassInstanceId}`);
              } else {
                router.push("/dashboard");
              }
            }, 1500);
          }
        } else {
          setErrorMessage(t.validation.creationFailed);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error("Error creating recurring class", { err: error });
        setErrorMessage(t.validation.creationFailed);
      } finally {
        setSubmitting(false);
      }
    },
    [params]
  );
}

export function CreateRecurringClassContainer() {
  const t = useAppTranslation("dashboard.createRecurringClass");
  const tMeeting = useAppTranslation("ui.meetingConfig").manager;
  const tClassScope = useAppTranslation("ui.meetingConfig").classScope;
  const tRecurring = useAppTranslation("ui.meetingConfig").recurringSchedule;
  const router = useRouter();
  const client = useApolloClient();
  const [meetingConfigWarning, setMeetingConfigWarning] = useState(false);
  const [createdClassInstanceId, setCreatedClassInstanceId] = useState<string | null>(null);
  const permissions = useUserStore(state => state.permissions);

  const isSubmitting = useCreateRecurringClassStore(state => state.isSubmitting);
  const showSuccess = useCreateRecurringClassStore(state => state.showSuccess);
  const errorMessage = useCreateRecurringClassStore(state => state.errorMessage);
  const setSubmitting = useCreateRecurringClassStore(state => state.setSubmitting);
  const setShowSuccess = useCreateRecurringClassStore(state => state.setShowSuccess);
  const resetSuccess = useCreateRecurringClassStore(state => state.resetSuccess);
  const setErrorMessage = useCreateRecurringClassStore(state => state.setErrorMessage);
  const clearError = useCreateRecurringClassStore(state => state.clearError);

  const canCreate = permissions.includes(AppPermission.ScheduleManageRecurring);
  const [createClassMutation] = useMutation(createRecurringClassMutationDocument);
  const labels = useRecurringClassLabels(t);

  const handleClose = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleSubmit = useRecurringClassSubmit({
    t,
    tMeeting,
    tClassScope,
    client,
    router,
    createClassMutation,
    setSubmitting,
    resetSuccess,
    clearError,
    setShowSuccess,
    setErrorMessage,
    setMeetingConfigWarning,
    setCreatedClassInstanceId,
  });

  const handleGoToCreatedClass = useCallback(() => {
    if (createdClassInstanceId) {
      router.push(`/classes/${createdClassInstanceId}`);
    }
  }, [createdClassInstanceId, router]);

  if (!canCreate) {
    return null;
  }

  return (
    <CreateRecurringClassView
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      errorMessage={errorMessage}
      meetingConfigWarning={meetingConfigWarning}
      meetingConfigWarningMessage={tMeeting.postCreateFailure}
      goToClassLabel={tRecurring.goToClass}
      onGoToCreatedClass={handleGoToCreatedClass}
      labels={labels}
      onClose={handleClose}
      onSubmit={handleSubmit}
      onDismissSuccess={resetSuccess}
      onDismissError={clearError}
    />
  );
}
