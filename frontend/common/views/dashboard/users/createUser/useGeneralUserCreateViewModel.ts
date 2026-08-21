"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import { useOnboardingSubmit } from "@/frontend/common/components/onboarding/hooks/useOnboardingSubmit";
import { AccountStatus, type GeneralUserCreateInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { useCreateGeneralUser } from "@/frontend/common/hooks/useCreateGeneralUser";
import {
  type GeneralUserCreateFormData,
  generalUserCreateSchemaFactory,
} from "@/frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { CreateUserLabels } from "@/shared/locale/types/dashboard/users/createUser";

/**
 * GeneralUserCreate ViewModel.
 *
 * Contains ALL business logic for the general user creation form:
 * - Form management with Zod validation (generalUserCreateSchemaFactory)
 * - Create general user mutation (useCreateGeneralUser)
 * - Post-create navigation to `/users`
 * - Success snackbar auto-dismiss
 */
export interface UseGeneralUserCreateViewModel {
  readonly form: UseFormReturn<GeneralUserCreateFormData>;
  readonly register: UseFormRegister<GeneralUserCreateFormData>;
  readonly control: Control<GeneralUserCreateFormData>;
  readonly errors: FieldErrors<GeneralUserCreateFormData>;
  readonly handleSubmit: UseFormHandleSubmit<GeneralUserCreateFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly submitError: string | null;
  readonly labels: CreateUserLabels;
  readonly onSubmit: (data: GeneralUserCreateFormData) => Promise<void>;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

export type UseGeneralUserCreateViewModelProps = Record<string, never>;

const USERS_PATH = "/users";

const SUCCESS_AUTO_DISMISS_MS = 3000;

const DEFAULT_FORM_VALUES: GeneralUserCreateFormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  groupSlug: "",
  status: AccountStatus.Activated,
};

function buildCreateInput(formData: GeneralUserCreateFormData): GeneralUserCreateInput {
  return {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    phone: formData.phone ?? null,
    groupSlug: formData.groupSlug,
    status: formData.status,
  };
}

export function useGeneralUserCreateViewModel(): UseGeneralUserCreateViewModel {
  const router = useRouter();
  const labels = useAppTranslation(Translation.Dashboard.UsersCreateUser);

  const schema = generalUserCreateSchemaFactory(labels);

  const form = useForm<GeneralUserCreateFormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const { execute, loading } = useCreateGeneralUser();

  const { showSuccess, submitError, onSubmit, onDismissSuccess, onDismissError, isSubmitting } = useOnboardingSubmit<
    GeneralUserCreateFormData,
    void
  >({
    execute: formData => execute(buildCreateInput(formData)),
    onSuccess: () => {
      router.push(USERS_PATH);
      return undefined;
    },
    onError: error => (error instanceof Error ? error.message : "operationFailed"),
    successAutoDismissMs: SUCCESS_AUTO_DISMISS_MS,
  });

  return {
    form,
    register: form.register,
    control: form.control,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit,
    isSubmitting: loading || isSubmitting,
    showSuccess,
    submitError,
    labels,
    onSubmit,
    onDismissSuccess,
    onDismissError,
  };
}
