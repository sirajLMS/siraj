"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { CompensationEditFields, CompensationViewSection } from "@/frontend/common/views/dashboard/profile/__shared__";
import type { StaffProfileData } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import { useAppTranslation } from "@/shared/locale/client";

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

export function CompensationSection(props: CompensationSectionProps) {
  const translations = useAppTranslation().profileTranslations.staff;
  if (props.mode === "edit") {
    return (
      <CompensationEditFields<StaffAdminEditFormData>
        register={props.register}
        control={props.control}
        translations={translations}
      />
    );
  }

  return (
    <CompensationViewSection
      profileData={props.staffData}
      subjectUserId={props.subjectUserId}
      translations={translations}
    />
  );
}
