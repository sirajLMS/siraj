"use client";

import { useCallback } from "react";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import {
  type SubmitHookParams,
  useRecurringClassSubmit,
} from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel.submit";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";

type CreateRecurringClassActionsParams = SubmitHookParams & {
  readonly createdClassInstanceId: string | null;
};

interface CreateRecurringClassActions {
  readonly onClose: () => void;
  readonly onGoToCreatedClass: () => void;
  readonly onSubmit: (data: RecurringClassFormData, meetingConfig: RecurringMeetingConfigFormState) => void;
}

export function useCreateRecurringClassActions(params: CreateRecurringClassActionsParams): CreateRecurringClassActions {
  const { router, createdClassInstanceId } = params;

  const handleClose = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleGoToCreatedClass = useCallback(() => {
    if (createdClassInstanceId) {
      router.push(`/classes/${createdClassInstanceId}`);
    }
  }, [createdClassInstanceId, router]);

  const handleSubmitInternal = useRecurringClassSubmit(params);

  const onSubmit = useCallback(
    (data: RecurringClassFormData, currentMeetingConfig: RecurringMeetingConfigFormState) => {
      void handleSubmitInternal(data, currentMeetingConfig);
    },
    [handleSubmitInternal]
  );

  return { onClose: handleClose, onGoToCreatedClass: handleGoToCreatedClass, onSubmit };
}
