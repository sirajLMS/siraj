"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import type { CreateRecurringClassInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createRecurringClassMutationDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents";
import { useCreateRecurringClassStore } from "@/frontend/common/stores/createRecurringClassStore";
import { logger } from "@/frontend/common/utils/logger";
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
import type {
  CreateRecurringClassLabels,
  MeetingConfigClassScopeLabels,
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
} from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

export interface CreateRecurringClassViewModel {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly meetingConfigWarning: boolean;
  readonly meetingConfigWarningMessage: string;
  readonly goToClassLabel: string;
  readonly onGoToCreatedClass: () => void;
  readonly labels: CreateRecurringClassLabels;
  readonly onClose: () => void;
  readonly onSubmit: (data: RecurringClassFormData, meetingConfig: RecurringMeetingConfigFormState) => void;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

export type UseCreateRecurringClassViewModelProps = Record<string, never>;

interface SubmitHookParams {
  readonly t: CreateRecurringClassLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tClassScope: MeetingConfigClassScopeLabels;
  readonly client: ReturnType<typeof useApolloClient>;
  readonly router: ReturnType<typeof useRouter>;
  readonly createClassMutation: (opts: {
    readonly variables: { readonly input: CreateRecurringClassInput };
  }) => Promise<{
    readonly data?: {
      readonly createRecurringClass?: {
        readonly id: string | null;
        readonly recurringScheduleId: string | null;
        readonly classInstanceIds?: ReadonlyArray<string> | null;
      } | null;
    };
  }>;
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

export function useCreateRecurringClassViewModel(
  _props: Readonly<UseCreateRecurringClassViewModelProps> = {}
): CreateRecurringClassViewModel {
  const translations = useAppTranslation();
  const labels = translations.dashboardTranslations.createRecurringClass;
  const tMeeting = translations.uiTranslations.meetingConfigManager;
  const tClassScope = translations.uiTranslations.meetingConfigClassScope;
  const tRecurringSchedule: MeetingConfigRecurringScheduleLabels =
    translations.uiTranslations.meetingConfigRecurringSchedule;

  const router = useRouter();
  const client = useApolloClient();
  const [meetingConfigWarning, setMeetingConfigWarning] = useState(false);
  const [createdClassInstanceId, setCreatedClassInstanceId] = useState<string | null>(null);

  const isSubmitting = useCreateRecurringClassStore(state => state.isSubmitting);
  const showSuccess = useCreateRecurringClassStore(state => state.showSuccess);
  const errorMessage = useCreateRecurringClassStore(state => state.errorMessage);
  const setSubmitting = useCreateRecurringClassStore(state => state.setSubmitting);
  const setShowSuccess = useCreateRecurringClassStore(state => state.setShowSuccess);
  const resetSuccess = useCreateRecurringClassStore(state => state.resetSuccess);
  const setErrorMessage = useCreateRecurringClassStore(state => state.setErrorMessage);
  const clearError = useCreateRecurringClassStore(state => state.clearError);

  const [createClassMutation] = useMutation(createRecurringClassMutationDocument);

  const handleClose = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleSubmit = useRecurringClassSubmit({
    t: labels,
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

  const goToClassLabel = tRecurringSchedule.goToClass;

  return {
    isSubmitting,
    showSuccess,
    errorMessage,
    meetingConfigWarning,
    meetingConfigWarningMessage: tMeeting.postCreateFailure,
    goToClassLabel,
    onGoToCreatedClass: handleGoToCreatedClass,
    labels,
    onClose: handleClose,
    onSubmit: handleSubmit,
    onDismissSuccess: resetSuccess,
    onDismissError: clearError,
  };
}
