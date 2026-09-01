import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { MeetingProviderFormData } from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";
import type { MeetingProvidersLabels } from "@/shared/locale/types/dashboard/meeting-providers/main";

type MeetingProviderFormMode = "create" | "edit";

export type UseMeetingProviderFormViewModelProps = {
  readonly mode: MeetingProviderFormMode;
  readonly providerId?: string | null;
};

export type MeetingProviderFormViewProps = {
  readonly mode: MeetingProviderFormMode;
  readonly t: MeetingProvidersLabels;
  readonly control: Control<MeetingProviderFormData>;
  readonly errors: FieldErrors<MeetingProviderFormData>;
  readonly register: UseFormRegister<MeetingProviderFormData>;
  readonly setValue: UseFormSetValue<MeetingProviderFormData>;
  readonly watch: UseFormWatch<MeetingProviderFormData>;
  readonly handleSubmit: UseFormHandleSubmit<MeetingProviderFormData>;
  readonly isSaving: boolean;
  readonly isLoadingProvider: boolean;
  readonly errorMsg: string | null;
  readonly isUrlExampleValid: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
};
