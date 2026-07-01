"use client";

import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useCreateTeacherOnboarding } from "@/frontend/hooks/useCreateTeacherOnboarding";
import { logger } from "@/frontend/utils/logger";
import type { TeacherOnboardingFormData } from "./schemas/teacherOnboardingSchema";
import { TeacherOnboardingView } from "./TeacherOnboardingView";
import { useTeacherOnboardingLabels } from "./useTeacherOnboardingLabels";

export function TeacherOnboardingContainer() {
  const { execute, loading } = useCreateTeacherOnboarding();
  const [showSuccess, setShowSuccess] = useState(false);
  const labels = useTeacherOnboardingLabels();

  const handleSubmit = async (data: TeacherOnboardingFormData) => {
    logger.info("Submitting teacher onboarding data:", data);
    try {
      await execute(data);
      setShowSuccess(true);
    } catch (error) {
      logger.error("Failed to submit teacher onboarding form", { error });
    }
  };

  const handleDismissSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <RequirePermission permissions={[AppPermission.TeachersCreate]}>
      <TeacherOnboardingView
        isSubmitting={loading}
        showSuccess={showSuccess}
        labels={labels}
        onSubmit={handleSubmit}
        onDismissSuccess={handleDismissSuccess}
      />
    </RequirePermission>
  );
}
