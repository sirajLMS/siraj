"use client";

import { Alert, Box, Button } from "@mui/material";
import { useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useCreateTeacherOnboarding } from "@/frontend/common/hooks/useCreateTeacherOnboarding";
import { useTeacherOnboardingStore } from "@/frontend/common/stores/teacherOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { TeacherOnboardingView } from "@/frontend/common/views/dashboard/teachers/onboarding/TeacherOnboardingView";
import { useTeacherOnboardingLabels } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingLabels";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale/client";

export function TeacherOnboardingContainer() {
  const { execute, loading, meetingConfigWarning, clearMeetingConfigWarning } = useCreateTeacherOnboarding();
  const createdTeacher = useTeacherOnboardingStore(state => state.result);
  const [showSuccess, setShowSuccess] = useState(false);
  const labels = useTeacherOnboardingLabels();
  const tMeeting = useAppTranslation("ui.meetingConfig.manager");
  const tJoin = useAppTranslation("ui.meetingConfig.join");
  const router = useRouter();

  const meetingSetupHref = createdTeacher
    ? `${profileHrefForTeacher({ userId: createdTeacher.userId, teacherId: createdTeacher.id })}?tab=meeting`
    : undefined;

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
      {meetingConfigWarning ? (
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
          <Alert
            severity="warning"
            onClose={() => clearMeetingConfigWarning()}
            action={
              meetingSetupHref ? (
                <Button color="inherit" size="small" onClick={() => router.push(meetingSetupHref)}>
                  {tJoin.setupLink}
                </Button>
              ) : undefined
            }
          >
            {tMeeting.postCreateFailure}
          </Alert>
        </Box>
      ) : null}
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
