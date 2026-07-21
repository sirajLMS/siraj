"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import type { CreateRecurringClassInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createRecurringClassMutationDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents";
import { resolveBrowserIanaTimezoneId } from "@/frontend/common/lib/timezone";
import { useCreateRecurringClassStore } from "@/frontend/common/stores/createRecurringClassStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  createRecurringClassSchema,
  type RecurringClassFormData,
} from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import {
  type CreatedRecurringClassResult,
  DEFAULT_DAY_SCHEDULE,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  buildRecurringClassFormLabels,
  type RecurringClassFormLabels,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";
import { mapFormDataToInput } from "@/frontend/common/views/dashboard/classes/recurring/utils/mapRecurringClassFormData";
import {
  emptyRecurringMeetingConfigState,
  postCreateRecurringMeetingConfig,
  type RecurringMeetingConfigFormState,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import {
  getRecurringMeetingConfigErrorKey,
  resolveRecurringMeetingConfigErrorMessage,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/recurringMeetingConfigValidation";
import { useRouter } from "@/shared/i18n/navigation";
import type {
  CreateRecurringClassLabels,
  MeetingConfigClassScopeLabels,
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
} from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

// Form-instance bag returned by `react-hook-form`. Decoupling the type keeps the
// ViewModel interface stable while letting both tiers reference the same shared
// shape (specs §6.3 — ViewModel owns the form; tier views consume via props).
type RecurringClassFormInstance = ReturnType<typeof useForm<RecurringClassFormData>>;

export interface CreateRecurringClassViewModel {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly meetingConfigWarning: boolean;
  readonly meetingConfigWarningMessage: string;
  readonly goToClassLabel: string;
  readonly onGoToCreatedClass: () => void;
  readonly labels: CreateRecurringClassLabels;
  readonly formLabels: RecurringClassFormLabels;
  readonly onClose: () => void;
  readonly onSubmit: (data: RecurringClassFormData, meetingConfig: RecurringMeetingConfigFormState) => void;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
  readonly meetingConfig: RecurringMeetingConfigFormState;
  readonly onMeetingConfigChange: (next: RecurringMeetingConfigFormState) => void;
  readonly register: RecurringClassFormInstance["register"];
  readonly handleSubmit: RecurringClassFormInstance["handleSubmit"];
  readonly watch: RecurringClassFormInstance["watch"];
  readonly setValue: RecurringClassFormInstance["setValue"];
  readonly control: RecurringClassFormInstance["control"];
  readonly errors: RecurringClassFormInstance["formState"]["errors"];
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

function useRecurringClassSubmit(params: SubmitHookParams) {
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
  // NEW FOR PLAN v5: meetingConfig form-state lifted out of the tier view (specs N7).
  const [meetingConfig, setMeetingConfig] = useState<RecurringMeetingConfigFormState>(
    emptyRecurringMeetingConfigState()
  );

  const isSubmitting = useCreateRecurringClassStore(state => state.isSubmitting);
  const showSuccess = useCreateRecurringClassStore(state => state.showSuccess);
  const errorMessage = useCreateRecurringClassStore(state => state.errorMessage);
  const setSubmitting = useCreateRecurringClassStore(state => state.setSubmitting);
  const setShowSuccess = useCreateRecurringClassStore(state => state.setShowSuccess);
  const resetSuccess = useCreateRecurringClassStore(state => state.resetSuccess);
  const setErrorMessage = useCreateRecurringClassStore(state => state.setErrorMessage);
  const clearError = useCreateRecurringClassStore(state => state.clearError);

  const [createClassMutation] = useMutation(createRecurringClassMutationDocument);

  const formLabels = useMemo(() => buildRecurringClassFormLabels(labels), [labels]);
  const schema = useMemo(() => createRecurringClassSchema(labels.validation), [labels.validation]);

  // NEW FOR PLAN v5: `useForm` instantiation + `zodResolver` lifted out of the
  // tier view (specs N4 + §6.2 — ViewModel is the SOLE owner of the form).
  const formInstance = useForm<RecurringClassFormData>({
    resolver: zodResolver(schema) as unknown as Resolver<RecurringClassFormData>,
    defaultValues: {
      studentId: "",
      teacherId: "",
      subjectId: "",
      defaultStartTime: "09:00",
      durationHours: 0,
      durationMinutes: 45,
      timezone: resolveBrowserIanaTimezoneId(),
      classType: undefined,
      effectiveFrom: undefined,
      effectiveUntil: undefined,
      generateInstancesForWeeks: 4,
      days: DEFAULT_DAY_SCHEDULE.map(day => ({ ...day })),
    },
  });
  const { register, handleSubmit, watch, setValue, control, formState } = formInstance;

  const handleClose = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleSubmitInternal = useRecurringClassSubmit({
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

  const onSubmit = useCallback(
    (data: RecurringClassFormData, currentMeetingConfig: RecurringMeetingConfigFormState) => {
      void handleSubmitInternal(data, currentMeetingConfig);
    },
    [handleSubmitInternal]
  );

  const handleMeetingConfigChange = useCallback((next: RecurringMeetingConfigFormState) => {
    setMeetingConfig(next);
  }, []);

  const handleGoToCreatedClass = useCallback(() => {
    if (createdClassInstanceId) {
      router.push(`/classes/${createdClassInstanceId}`);
    }
  }, [createdClassInstanceId, router]);

  // NEW FOR PLAN v5: snackbar auto-dismiss timers lifted out of tier views
  // (specs N6 + N18 — data/side-effect timing belongs to the ViewModel).
  useEffect(() => {
    if (!showSuccess || meetingConfigWarning) return undefined;
    const timer = setTimeout(() => {
      resetSuccess();
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, meetingConfigWarning, resetSuccess]);

  useEffect(() => {
    if (!errorMessage) return undefined;
    const timer = setTimeout(() => {
      clearError();
    }, 5000);
    return () => {
      clearTimeout(timer);
    };
  }, [errorMessage, clearError]);

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
    formLabels,
    onClose: handleClose,
    onSubmit,
    onDismissSuccess: resetSuccess,
    onDismissError: clearError,
    meetingConfig,
    onMeetingConfigChange: handleMeetingConfigChange,
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    errors: formState.errors,
  };
}
