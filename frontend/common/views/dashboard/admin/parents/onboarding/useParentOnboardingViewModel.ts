"use client";

import { useState } from "react";
import { useCreateParentOnboarding } from "@/frontend/common/hooks/useCreateParentOnboarding";
import { useParentOnboardingStore } from "@/frontend/common/stores/parentOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import type { ParentOnboardingViewProps } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import { useAppTranslation } from "@/shared/locale";

export interface ParentOnboardingViewModel {
  readonly register: ParentOnboardingViewProps["register"];
  readonly control: ParentOnboardingViewProps["control"];
  readonly errors: ParentOnboardingViewProps["errors"];
  readonly handleSubmit: ParentOnboardingViewProps["handleSubmit"];
  readonly isSubmitting: ParentOnboardingViewProps["isSubmitting"];
  readonly onSubmit: ParentOnboardingViewProps["onSubmit"];
  readonly meetingConfigWarning: boolean;
  readonly clearMeetingConfigWarning: () => void;
  readonly meetingSetupHref: string | undefined;
  readonly showSuccess: boolean;
  readonly setShowSuccess: (value: boolean) => void;
  readonly t: ReturnType<typeof useAppTranslation>["dashboardTranslations"]["parentOnboarding"];
  readonly tMeeting: ReturnType<typeof useAppTranslation>["uiTranslations"]["meetingConfig"]["manager"];
  readonly tJoin: ReturnType<typeof useAppTranslation>["uiTranslations"]["meetingConfig"]["join"];
}

export type UseParentOnboardingViewModelProps = Record<string, never>;

export function useParentOnboardingViewModel(): ParentOnboardingViewModel {
  const t = useAppTranslation().dashboardTranslations.parentOnboarding;
  const tMeeting = useAppTranslation().uiTranslations.meetingConfig.manager;
  const tJoin = useAppTranslation().uiTranslations.meetingConfig.join;
  const { execute, loading, meetingConfigWarning, clearMeetingConfigWarning } = useCreateParentOnboarding();
  const createdParent = useParentOnboardingStore(state => state.result);
  const [showSuccess, setShowSuccess] = useState(false);

  const meetingSetupHref = createdParent
    ? `${profileHrefForParent({ userId: createdParent.userId, parentId: createdParent.parentId })}?tab=meeting`
    : undefined;

  const onSubmit = async (
    formData: ParentOnboardingViewProps["onSubmit"] extends (data: infer T) => void ? T : never
  ) => {
    try {
      logger.info("Submitting parent onboarding form", { formData });
      await execute(formData);
      logger.info("Parent onboarding form submitted successfully");
      setShowSuccess(true);
    } catch (error) {
      logger.error("Failed to submit parent onboarding form", { error });
    }
  };

  return {
    register: undefined as unknown as ParentOnboardingViewProps["register"],
    control: undefined as unknown as ParentOnboardingViewProps["control"],
    errors: undefined as unknown as ParentOnboardingViewProps["errors"],
    handleSubmit: undefined as unknown as ParentOnboardingViewProps["handleSubmit"],
    isSubmitting: loading,
    onSubmit,
    meetingConfigWarning,
    clearMeetingConfigWarning,
    meetingSetupHref,
    showSuccess,
    setShowSuccess,
    t,
    tMeeting,
    tJoin,
  };
}
