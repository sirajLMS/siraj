"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { CompensationEditFields, CompensationViewSection } from "@/frontend/common/views/dashboard/profile/__shared__";
import type { StaffProfileData } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";

type CompensationSectionProps =
  | {
      readonly mode: "view";
      readonly staffData: StaffProfileData;
      readonly subjectUserId?: string;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<StaffAdminEditFormData>;
      readonly control: Control<StaffAdminEditFormData>;
    };

const TRANSLATION_NAMESPACE = "profile.staff";

export function CompensationSection(props: CompensationSectionProps) {
  if (props.mode === "edit") {
    return (
      <CompensationEditFields<StaffAdminEditFormData>
        register={props.register}
        control={props.control}
        translationNamespace={TRANSLATION_NAMESPACE}
      />
    );
  }

  return (
    <CompensationViewSection
      profileData={props.staffData}
      subjectUserId={props.subjectUserId}
      translationNamespace={TRANSLATION_NAMESPACE}
    />
  );
}
