"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  type Control,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormHandleSubmit,
  type UseFormSetValue,
  useForm,
} from "react-hook-form";
import { useRescheduleStore } from "@/frontend/common/stores/rescheduleStore";
import {
  type RescheduleFormData,
  rescheduleSchema,
} from "@/frontend/common/views/dashboard/reschedule/home/schemas/rescheduleSchema";
import type { RescheduleSession } from "@/frontend/common/views/dashboard/reschedule/home/types";

export interface UseRescheduleViewModelProps {
  readonly session: RescheduleSession;
  readonly defaultDate: string;
  readonly defaultTime: string;
  readonly isSubmitting: boolean;
  readonly onSubmit: (data: RescheduleFormData) => void | Promise<void>;
  readonly onCancel: () => void;
}

export interface RescheduleViewModel {
  readonly session: RescheduleSession;
  readonly control: Control<RescheduleFormData>;
  readonly errors: FieldErrors<RescheduleFormData>;
  readonly setValue: UseFormSetValue<RescheduleFormData>;
  readonly getValues: UseFormGetValues<RescheduleFormData>;
  readonly handleSubmit: UseFormHandleSubmit<RescheduleFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onSubmit: (data: RescheduleFormData) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissSuccess: () => void;
}

export function useRescheduleViewModel(props: Readonly<UseRescheduleViewModelProps>): RescheduleViewModel {
  const { session, defaultDate, defaultTime, isSubmitting, onSubmit, onCancel } = props;

  const showSuccess = useRescheduleStore(state => state.showSuccess);
  const setShowSuccess = useRescheduleStore(state => state.setShowSuccess);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      newDate: "",
      newTime: "",
    },
  });

  useEffect(() => {
    reset({ newDate: defaultDate, newTime: defaultTime });
  }, [defaultDate, defaultTime, reset]);

  const onDismissSuccess = () => {
    setShowSuccess(false);
  };

  return {
    session,
    control,
    errors,
    setValue,
    getValues,
    handleSubmit,
    isSubmitting,
    showSuccess,
    onSubmit,
    onCancel,
    onDismissSuccess,
  };
}
