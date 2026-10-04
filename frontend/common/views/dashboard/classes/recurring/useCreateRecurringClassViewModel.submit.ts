import type { useApolloClient } from "@apollo/client/react";
import { useCallback } from "react";
import type { CreateRecurringClassInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type { CreatedRecurringClassResult } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { mapFormDataToInput } from "@/frontend/common/views/dashboard/classes/recurring/utils/mapRecurringClassFormData";
import {
  postCreateRecurringMeetingConfig,
  type RecurringMeetingConfigFormState,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import {
  getRecurringMeetingConfigErrorKey,
  resolveRecurringMeetingConfigErrorMessage,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/recurringMeetingConfigValidation";
import type { useRouter } from "@/shared/i18n/navigation";
import type {
  CreateRecurringClassLabels,
  MeetingConfigClassScopeLabels,
  MeetingConfigManagerLabels,
} from "@/shared/locale";

export interface SubmitHookParams {
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

function resolveMeetingConfigErrorMessage(
  meetingConfig: RecurringMeetingConfigFormState,
  labels: {
    readonly recurringFieldsRequired: string;
    readonly urlNotAllowed: string;
  }
): string | null {
  const meetingErrorKey = getRecurringMeetingConfigErrorKey(meetingConfig);
  return resolveRecurringMeetingConfigErrorMessage(meetingErrorKey, labels);
}

function scheduleCreationSuccessRedirect(
  router: SubmitHookParams["router"],
  firstClassInstanceId: string | null
): void {
  setTimeout(() => {
    if (firstClassInstanceId) {
      router.push(`/classes/${firstClassInstanceId}`);
    } else {
      router.push("/dashboard");
    }
  }, 1500);
}

async function persistMeetingConfigAndCollectResult(
  params: SubmitHookParams,
  recurringScheduleId: string | null,
  firstClassInstanceId: string | null,
  meetingConfig: RecurringMeetingConfigFormState
): Promise<CreatedRecurringClassResult> {
  let meetingConfigSaved = true;
  if (recurringScheduleId) {
    const meetingResult = await postCreateRecurringMeetingConfig(params.client, recurringScheduleId, meetingConfig);
    meetingConfigSaved = meetingResult.success;
    if (!meetingResult.success) {
      params.setMeetingConfigWarning(true);
      params.setCreatedClassInstanceId(firstClassInstanceId);
    }
  }
  return { recurringScheduleId, firstClassInstanceId, meetingConfigSaved };
}

export function useRecurringClassSubmit(params: SubmitHookParams) {
  return useCallback(
    async (data: RecurringClassFormData, meetingConfig: RecurringMeetingConfigFormState) => {
      const {
        t,
        tMeeting,
        tClassScope,
        router,
        createClassMutation,
        setSubmitting,
        resetSuccess,
        clearError,
        setShowSuccess,
        setErrorMessage,
      } = params;

      const meetingErrorMessage = resolveMeetingConfigErrorMessage(meetingConfig, {
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
      params.setMeetingConfigWarning(false);
      params.setCreatedClassInstanceId(null);

      try {
        const input: CreateRecurringClassInput = mapFormDataToInput(data);
        const { data: result } = await createClassMutation({ variables: { input } });

        if (!result?.createRecurringClass) {
          setErrorMessage(t.validation.creationFailed);
          return;
        }

        const created = result.createRecurringClass;
        const { firstClassInstanceId, meetingConfigSaved } = await persistMeetingConfigAndCollectResult(
          params,
          created.recurringScheduleId,
          created.classInstanceIds?.[0] ?? null,
          meetingConfig
        );

        setShowSuccess(true);
        logger.info("Recurring class created:", created.id);

        if (meetingConfigSaved) {
          scheduleCreationSuccessRedirect(router, firstClassInstanceId);
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
