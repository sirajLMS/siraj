"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type { useForm } from "react-hook-form";
import { createRecurringClassMutationDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type {
  ClassSubjectOption,
  RecurringMeetingConfigValidation,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { CreateRecurringClassLabelsBySection } from "@/frontend/common/views/dashboard/classes/recurring/types/createRecurringClassViewModel.types";
import { useClassSubjects } from "@/frontend/common/views/dashboard/classes/recurring/useClassSubjects";
import { useCreateRecurringClassActions } from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel.actions";
import { buildCreateRecurringClassLabelsBySection } from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel.helpers";
import {
  useRecurringClassForm,
  useRecurringClassMeetingConfig,
  useRecurringClassStoreBindings,
  useSnackbarAutoDismiss,
} from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel.hooks";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

type RecurringClassFormInstance = ReturnType<typeof useForm<RecurringClassFormData>>;

export interface CreateRecurringClassViewModel {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly meetingConfigWarning: boolean;
  readonly labelsBySection: CreateRecurringClassLabelsBySection;
  readonly onGoToCreatedClass: () => void;
  readonly onClose: () => void;
  readonly onSubmit: (data: RecurringClassFormData, meetingConfig: RecurringMeetingConfigFormState) => void;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
  readonly meetingConfig: RecurringMeetingConfigFormState;
  readonly meetingConfigValidation: RecurringMeetingConfigValidation;
  readonly onMeetingConfigChange: (next: RecurringMeetingConfigFormState) => void;
  readonly subjects: readonly ClassSubjectOption[];
  readonly subjectsLoading: boolean;
  readonly register: RecurringClassFormInstance["register"];
  readonly handleSubmit: RecurringClassFormInstance["handleSubmit"];
  readonly watch: RecurringClassFormInstance["watch"];
  readonly setValue: RecurringClassFormInstance["setValue"];
  readonly control: RecurringClassFormInstance["control"];
  readonly errors: RecurringClassFormInstance["formState"]["errors"];
}

export type UseCreateRecurringClassViewModelProps = Record<string, never>;

export function useCreateRecurringClassViewModel(
  _props: Readonly<UseCreateRecurringClassViewModelProps> = {}
): CreateRecurringClassViewModel {
  const labels = useAppTranslation(Translation.Dashboard.CreateRecurringClass);
  const tMeeting = useAppTranslation(Translation.Ui.MeetingConfig).manager;
  const tClassScope = useAppTranslation(Translation.Ui.MeetingConfig).classScope;
  const tRecurringSchedule = useAppTranslation(Translation.Ui.MeetingConfigRecurringSchedule);

  const router = useRouter();
  const client = useApolloClient();
  const store = useRecurringClassStoreBindings();
  const [createClassMutation] = useMutation(createRecurringClassMutationDocument);
  const form = useRecurringClassForm(labels);
  const { subjects, loading: subjectsLoading } = useClassSubjects();
  const { meetingConfig, meetingConfigValidation, onMeetingConfigChange } = useRecurringClassMeetingConfig();
  const [meetingConfigWarning, setMeetingConfigWarning] = useState(false);
  const [createdClassInstanceId, setCreatedClassInstanceId] = useState<string | null>(null);

  const actions = useCreateRecurringClassActions({
    t: labels,
    tMeeting,
    tClassScope,
    client,
    router,
    createClassMutation,
    createdClassInstanceId,
    setSubmitting: store.setSubmitting,
    resetSuccess: store.resetSuccess,
    clearError: store.clearError,
    setShowSuccess: store.setShowSuccess,
    setErrorMessage: store.setErrorMessage,
    setMeetingConfigWarning,
    setCreatedClassInstanceId,
  });

  useSnackbarAutoDismiss({
    showSuccess: store.showSuccess,
    meetingConfigWarning,
    resetSuccess: store.resetSuccess,
    errorMessage: store.errorMessage,
    clearError: store.clearError,
  });

  const labelsBySection = useMemo(
    () =>
      buildCreateRecurringClassLabelsBySection({
        labels,
        formLabels: form.formLabels,
        meetingConfigWarningMessage: tMeeting.postCreateFailure,
        goToClassLabel: tRecurringSchedule.goToClass,
      }),
    [labels, form.formLabels, tMeeting.postCreateFailure, tRecurringSchedule.goToClass]
  );

  return {
    isSubmitting: store.isSubmitting,
    showSuccess: store.showSuccess,
    errorMessage: store.errorMessage,
    meetingConfigWarning,
    labelsBySection,
    onGoToCreatedClass: actions.onGoToCreatedClass,
    onClose: actions.onClose,
    onSubmit: actions.onSubmit,
    onDismissSuccess: store.resetSuccess,
    onDismissError: store.clearError,
    meetingConfig,
    meetingConfigValidation,
    onMeetingConfigChange,
    subjects,
    subjectsLoading,
    register: form.register,
    handleSubmit: form.handleSubmit,
    watch: form.watch,
    setValue: form.setValue,
    control: form.control,
    errors: form.errors,
  };
}
