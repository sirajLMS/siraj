"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRescheduleStore } from "@/frontend/stores/rescheduleStore";
import { logger } from "@/frontend/utils/logger";
import { useRouter } from "@/shared/i18n/routing";
import { RescheduleView } from "./RescheduleView";
import { type RescheduleFormData, rescheduleSchema } from "./schemas/rescheduleSchema";

const DEFAULT_FORM_VALUES: RescheduleFormData = {
  newDate: "2023-10-24",
  newTime: "22:30",
};

export function RescheduleContainer() {
  const router = useRouter();
  const session = useRescheduleStore(state => state.session);
  const isSubmitting = useRescheduleStore(state => state.isSubmitting);
  const setSubmitting = useRescheduleStore(state => state.setSubmitting);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    if (!showSuccess) return undefined;
    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess]);

  const onSubmit = async (formData: RescheduleFormData) => {
    setSubmitting(true);
    try {
      logger.info("Submitting class reschedule", { sessionId: session.sessionId, formData });
      await new Promise(resolve => setTimeout(resolve, 1500));
      logger.info("Class rescheduled successfully", { sessionId: session.sessionId });
      setShowSuccess(true);
      reset(DEFAULT_FORM_VALUES);
    } catch (error) {
      logger.error("Failed to reschedule class", { error });
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = () => {
    router.push("/schedule/tracking/status");
  };

  return (
    <RescheduleView
      session={session}
      control={control}
      errors={errors}
      setValue={setValue}
      getValues={getValues}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      onSubmit={onSubmit}
      onCancel={onCancel}
      onDismissSuccess={() => {
        setShowSuccess(false);
      }}
    />
  );
}
