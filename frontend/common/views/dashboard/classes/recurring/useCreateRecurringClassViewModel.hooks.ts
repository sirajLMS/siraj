"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateRecurringClassStore } from "@/frontend/common/stores/createRecurringClassStore";
import {
  createRecurringClassSchema,
  type RecurringClassFormData,
} from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { buildRecurringClassDefaultValues } from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel.helpers";
import { useRecurringMeetingConfigValidation } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringMeetingConfigValidation";
import { buildRecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";
import {
  emptyRecurringMeetingConfigState,
  type RecurringMeetingConfigFormState,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { CreateRecurringClassLabels } from "@/shared/locale";

export function useRecurringClassStoreBindings() {
  const isSubmitting = useCreateRecurringClassStore(state => state.isSubmitting);
  const showSuccess = useCreateRecurringClassStore(state => state.showSuccess);
  const errorMessage = useCreateRecurringClassStore(state => state.errorMessage);
  const setSubmitting = useCreateRecurringClassStore(state => state.setSubmitting);
  const setShowSuccess = useCreateRecurringClassStore(state => state.setShowSuccess);
  const resetSuccess = useCreateRecurringClassStore(state => state.resetSuccess);
  const setErrorMessage = useCreateRecurringClassStore(state => state.setErrorMessage);
  const clearError = useCreateRecurringClassStore(state => state.clearError);

  return {
    isSubmitting,
    showSuccess,
    errorMessage,
    setSubmitting,
    setShowSuccess,
    resetSuccess,
    setErrorMessage,
    clearError,
  };
}

export function useRecurringClassForm(labels: CreateRecurringClassLabels) {
  const formLabels = useMemo(() => buildRecurringClassFormLabels(labels), [labels]);
  const schema = useMemo(() => createRecurringClassSchema(labels.validation), [labels.validation]);

  const formInstance = useForm<RecurringClassFormData>({
    resolver: zodResolver(schema),
    defaultValues: buildRecurringClassDefaultValues(),
  });
  const { register, handleSubmit, watch, setValue, control, formState } = formInstance;

  return { register, handleSubmit, watch, setValue, control, errors: formState.errors, formLabels };
}

export function useRecurringClassMeetingConfig() {
  const [meetingConfig, setMeetingConfig] = useState<RecurringMeetingConfigFormState>(
    emptyRecurringMeetingConfigState()
  );
  const meetingConfigValidation = useRecurringMeetingConfigValidation(meetingConfig);

  return { meetingConfig, meetingConfigValidation, onMeetingConfigChange: setMeetingConfig };
}

type SnackbarAutoDismissParams = {
  readonly showSuccess: boolean;
  readonly meetingConfigWarning: boolean;
  readonly resetSuccess: () => void;
  readonly errorMessage: string | null;
  readonly clearError: () => void;
};

export function useSnackbarAutoDismiss(params: SnackbarAutoDismissParams): void {
  const { showSuccess, meetingConfigWarning, resetSuccess, errorMessage, clearError } = params;

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
}
