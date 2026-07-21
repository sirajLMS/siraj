export type {
  ParentOnboardingInput,
  ParentOnboardingResult,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
export { InvoiceType, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type { ParentOnboardingFormData } from "@/frontend/common/types/shared.types";

import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import type { ParentOnboardingFormData } from "@/frontend/common/types/shared.types";
import type { ParentOnboardingViewModel } from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";

export type ParentOnboardingViewProps = {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ParentOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly onSubmit: (data: ParentOnboardingFormData) => void | Promise<void>;
};

// Mobile tier presentation prop types (sub-components defined in
// `frontend/mobile/views/dashboard/admin/parents/onboarding/parentOnboarding.mobile.tsx`).
export type ParentOnboardingFieldAssistances = Pick<
  ParentOnboardingViewModel,
  "register" | "control" | "errors" | "onUploadAvatar"
>;

export type MeetingConfigLabels = {
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
