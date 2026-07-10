import type { ElementType, ReactNode } from "react";
import { AppLanguage, Gender } from "@/frontend/graphql/generated/gql/graphql-types";
import type { StudentQuotaFormData } from "@/frontend/views/dashboard/students/quota/schemas/studentQuotaSchema";

export interface StudentProfileData extends StudentQuotaFormData {
  readonly id: string;
  readonly profileImage: string;
  readonly lastEditedBy: string;
  readonly lastEditedTime: string;
  readonly primaryTeacherId: string | null;
}

export interface SectionHeaderProps {
  readonly title: string;
  readonly desktopIcon: ElementType;
  readonly mobileIcon: ElementType;
}

export interface QuotaFormFieldProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly extraLabel?: ReactNode;
  readonly helperText?: ReactNode;
}

export interface MobileProfileHeaderProps {
  readonly studentData: StudentProfileData;
  readonly onEditAvatar: () => void;
}

export interface FormActionsProps {
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly studentData: StudentProfileData;
  readonly onCancel: () => void;
}

export interface StudentQuotaViewProps {
  readonly studentData: StudentProfileData | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly embedded?: boolean;
  readonly onSave: (data: StudentQuotaFormData) => Promise<void>;
  readonly onCancel: () => void;
  readonly onEditAvatar?: () => void;
}

export interface LanguageOption {
  readonly value: AppLanguage;
  readonly labelKey: string;
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: AppLanguage.Ar, labelKey: "arabic" },
  { value: AppLanguage.En, labelKey: "english" },
] as const;

export const GENDER_OPTIONS: readonly { readonly value: Gender; readonly labelKey: string }[] = [
  { value: Gender.Male, labelKey: "male" },
  { value: Gender.Female, labelKey: "female" },
] as const;
