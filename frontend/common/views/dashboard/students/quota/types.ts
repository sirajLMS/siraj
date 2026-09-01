import type { ElementType } from "react";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";

export interface StudentProfileData extends StudentQuotaFormData {
  readonly id: string;
  readonly profileImage: string;
  readonly lastEditedTime: string;
  readonly primaryTeacherId: string | null;
}

export interface SectionHeaderProps {
  readonly title: string;
  readonly desktopIcon: ElementType;
  readonly mobileIcon: ElementType;
}

export interface MobileProfileHeaderProps {
  readonly studentData: StudentProfileData;
  readonly onEditAvatar?: () => void;
  readonly showAvatarEdit?: boolean;
}

export interface FormActionsProps {
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly studentData: StudentProfileData;
  readonly onCancel: () => void;
  readonly readOnly?: boolean;
  readonly showCancel?: boolean;
}

export const GENDER_OPTIONS: readonly { readonly value: Gender; readonly labelKey: string }[] = [
  { value: Gender.Male, labelKey: "male" },
  { value: Gender.Female, labelKey: "female" },
] as const;
