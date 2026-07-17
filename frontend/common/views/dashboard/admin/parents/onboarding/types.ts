export type {
  ParentOnboardingInput,
  ParentOnboardingResult,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
export { InvoiceType, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type { ParentOnboardingFormData } from "@/frontend/common/types/shared.types";

import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import type { ParentOnboardingFormData } from "@/frontend/common/types/shared.types";

export type ParentOnboardingViewProps = {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ParentOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly onSubmit: (data: ParentOnboardingFormData) => void | Promise<void>;
};
