import type { Control, FieldValues, UseFormRegister } from "react-hook-form";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { ProfileScope } from "@/shared/constants/profile.enum";

export type CoreContactFormFields = {
  phone?: string;
  timezone?: string;
};

type CoreContactViewProps = {
  readonly mode: "view";
  readonly scope?: ProfileScope;
  readonly phone: string | null | undefined;
  readonly timezone?: IanaTimezone | null;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly timezoneLabel?: string;
  readonly baseLabels?: ProfileSharedBaseLabels;
};

export type CoreContactEditWithRegisterProps = {
  readonly mode: "edit";
  readonly scope?: ProfileScope;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly timezoneLabel?: string;
  readonly baseLabels?: ProfileSharedBaseLabels;
  readonly register: UseFormRegister<CoreContactFormFields>;
};

export type CoreContactEditWithControlProps<
  T extends CoreContactFormFields & FieldValues = CoreContactFormFields & FieldValues,
> = {
  readonly mode: "edit";
  readonly scope?: ProfileScope;
  readonly sectionTitle: string;
  readonly phoneLabel: string;
  readonly timezoneLabel?: string;
  readonly baseLabels?: ProfileSharedBaseLabels;
  readonly control: Control<T>;
};

export type CoreContactSectionProps<
  T extends CoreContactFormFields & FieldValues = CoreContactFormFields & FieldValues,
> = CoreContactViewProps | CoreContactEditWithRegisterProps | CoreContactEditWithControlProps<T>;
