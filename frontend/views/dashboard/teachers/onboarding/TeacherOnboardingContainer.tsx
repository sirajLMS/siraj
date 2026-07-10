"use client";

import { Alert, Snackbar } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useCreateTeacherOnboarding } from "@/frontend/hooks/useCreateTeacherOnboarding";
import { logger } from "@/frontend/utils/logger";
import type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { TeacherOnboardingView } from "@/frontend/views/dashboard/teachers/onboarding/TeacherOnboardingView";
import { useTeacherOnboardingLabels } from "@/frontend/views/dashboard/teachers/onboarding/useTeacherOnboardingLabels";

export function TeacherOnboardingContainer() {
  const { execute, loading, meetingConfigWarning, clearMeetingConfigWarning } = useCreateTeacherOnboarding();
  const [showSuccess, setShowSuccess] = useState(false);
  const labels = useTeacherOnboardingLabels();
  const tMeeting = useTranslations("ui.meetingConfig.manager");

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
      <Snackbar
        open={meetingConfigWarning}
        autoHideDuration={8000}
        onClose={() => clearMeetingConfigWarning()}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => clearMeetingConfigWarning()}>
          {tMeeting("postCreateFailure")}
        </Alert>
      </Snackbar>
    </RequirePermission>
  );
}
