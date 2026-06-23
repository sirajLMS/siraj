"use client";

import { useState } from "react";
import { useCreateTeacherMutation, useTeacherOnboardingStore } from "@/frontend/stores/teacherOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import type { TeacherOnboardingFormData } from "./schemas/teacherOnboardingSchema";
import { TeacherOnboardingView } from "./TeacherOnboardingView";
import { useTeacherOnboardingLabels } from "./useTeacherOnboardingLabels";

export function TeacherOnboardingContainer() {
  const { isSubmitting, reset } = useTeacherOnboardingStore();
  const { execute } = useCreateTeacherMutation();
  const [showSuccess, setShowSuccess] = useState(false);
  const labels = useTeacherOnboardingLabels();

  const handleSubmit = async (data: TeacherOnboardingFormData) => {
    logger.info("Submitting teacher onboarding data:", data);
    try {
      await execute(data);
      setShowSuccess(true);
      reset();
    } catch (error) {
      logger.error("Failed to submit teacher onboarding form", { error });
    }
  };

  const handleDismissSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <TeacherOnboardingView
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      labels={labels}
      onSubmit={handleSubmit}
      onDismissSuccess={handleDismissSuccess}
    />
  );
}
