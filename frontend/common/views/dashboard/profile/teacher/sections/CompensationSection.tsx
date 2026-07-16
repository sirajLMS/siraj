"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { CompensationEditFields, CompensationViewSection } from "@/frontend/common/views/dashboard/profile/__shared__";
import type { TeacherViewData } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherAdminEditFormData } from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import { useAppTranslation } from "@/shared/locale";

type CompensationSectionProps =
  | {
      readonly mode: "view";
      readonly teacherData: TeacherViewData;
      readonly subjectUserId?: string;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
      readonly control: Control<TeacherAdminEditFormData>;
    };

export function CompensationSection(props: CompensationSectionProps) {
  const translations = useAppTranslation().profileTranslations.teacher;
  if (props.mode === "edit") {
    return (
      <CompensationEditFields<TeacherAdminEditFormData>
        register={props.register}
        control={props.control}
        translations={translations}
      />
    );
  }

  return (
    <CompensationViewSection
      profileData={props.teacherData}
      subjectUserId={props.subjectUserId}
      translations={translations}
    />
  );
}
