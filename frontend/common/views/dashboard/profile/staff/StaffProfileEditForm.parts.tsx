"use client";

import type { ReactNode } from "react";
import type { useForm } from "react-hook-form";
import type { CompensationViewLabels } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm.helpers";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/staff/sections/CompensationSection";
import type {
  StaffProfileData,
  StaffProfileViewLabels,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";

export function CompensationSectionRenderer({
  showCompensationEditSection,
  showCompensationViewSection,
  compensationViewLabels,
  st,
  form,
  staffData,
}: {
  readonly showCompensationEditSection: boolean;
  readonly showCompensationViewSection: boolean;
  readonly compensationViewLabels: CompensationViewLabels;
  readonly st: StaffProfileViewLabels["staff"];
  readonly form: ReturnType<typeof useForm<StaffAdminEditFormData>>;
  readonly staffData: StaffProfileData;
}): ReactNode {
  if (showCompensationEditSection) {
    return <CompensationSection mode="edit" labels={{ staff: st }} register={form.register} control={form.control} />;
  }
  if (showCompensationViewSection) {
    return (
      <CompensationSection
        mode="view"
        labels={compensationViewLabels}
        staffData={staffData}
        subjectUserId={staffData.id ?? undefined}
      />
    );
  }
  return null;
}
