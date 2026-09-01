import type { ParentOnboardingViewModel } from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";

// Mobile tier presentation prop types (sub-components defined in
// `frontend/mobile/views/dashboard/admin/parents/onboarding/parentOnboarding.mobile.tsx`).
type ParentOnboardingFieldAssistances = Pick<
  ParentOnboardingViewModel,
  "register" | "control" | "errors" | "onUploadAvatar"
>;

type MeetingConfigLabels = {
  readonly sectionTitle: string;
  readonly optionalHint: string;
  readonly fields: {
    readonly meetingProvider: string;
    readonly meetingUrl: string;
    readonly meetingLabel: string;
  };
  readonly placeholders: {
    readonly meetingUrl: string;
    readonly meetingLabel: string;
  };
};

export type MeetingConfigAlertProps = {
  readonly meetingConfigWarning: ParentOnboardingViewModel["meetingConfigWarning"];
  readonly meetingSetupHref: ParentOnboardingViewModel["meetingSetupHref"];
  readonly failureMessage: string;
  readonly setupLinkLabel: string;
  readonly onClearWarning: () => void;
  readonly onVisitSetup: () => void;
};

export type OnboardingFormSectionsProps = ParentOnboardingFieldAssistances & {
  readonly meetingConfigLabels: MeetingConfigLabels;
};

export type SubmitActionSectionProps = {
  readonly isSubmitting: boolean;
  readonly processingLabel: string;
  readonly signupLabel: string;
  readonly privacyNote: string;
};
