"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { CompensationEditFields, CompensationViewSection } from "@/frontend/common/views/dashboard/profile/__shared__";
import type {
  TeacherProfileViewLabels,
  TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherAdminEditFormData } from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";

type CompensationSectionProps = {
  readonly labels: Pick<TeacherProfileViewLabels, "teacher" | "base" | "errors">;
} & (
  | {
      readonly mode: "view";
      readonly teacherData: TeacherViewData;
      readonly subjectUserId?: string;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
      readonly control: Control<TeacherAdminEditFormData>;
    }
);

export function CompensationSection(props: CompensationSectionProps) {
  const { labels } = props;
  if (props.mode === "edit") {
    return (
      <CompensationEditFields<TeacherAdminEditFormData>
        register={props.register}
        control={props.control}
        translations={labels.teacher}
      />
    );
  }

  return (
    <CompensationViewSection
      profileData={props.teacherData}
      subjectUserId={props.subjectUserId}
      translations={labels.teacher}
      baseLabels={labels.base}
      errorLabels={labels.errors}
    />
  );
}
