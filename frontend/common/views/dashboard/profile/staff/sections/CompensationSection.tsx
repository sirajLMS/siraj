"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { CompensationEditFields, CompensationViewSection } from "@/frontend/common/views/dashboard/profile/__shared__";
import type {
  StaffProfileData,
  StaffSectionLabels,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { ProfileLabels } from "@/shared/locale/types/profile";

type CompensationSectionLabels = {
  readonly staff: StaffSectionLabels;
  readonly baseLabels: Pick<ProfileLabels, "convertedAmount" | "convertedTotalApprox">;
  readonly errorLabels: ErrorsLabels;
};

type CompensationSectionProps =
  | {
      readonly mode: "view";
      readonly labels: CompensationSectionLabels;
      readonly staffData: StaffProfileData;
      readonly subjectUserId?: string;
    }
  | {
      readonly mode: "edit";
      readonly labels: Pick<CompensationSectionLabels, "staff">;
      readonly register: UseFormRegister<StaffAdminEditFormData>;
      readonly control: Control<StaffAdminEditFormData>;
    };

export function CompensationSection(props: CompensationSectionProps) {
  const translations = props.labels.staff;
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
      baseLabels={props.labels.baseLabels}
      errorLabels={props.labels.errorLabels}
    />
  );
}
