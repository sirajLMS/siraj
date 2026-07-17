export type { ManagerOnboardingResult } from "@/frontend/common/graphql/generated/gql/graphql-types";
export { ManagerAccountType } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";

import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";

export type ManagerOnboardingViewProps = {
  readonly register: UseFormRegister<ManagerOnboardingFormData>;
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ManagerOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onSubmit: (data: ManagerOnboardingFormData) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissSuccess: () => void;
};
