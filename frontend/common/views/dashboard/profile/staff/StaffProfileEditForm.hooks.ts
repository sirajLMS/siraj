"use client";

import { useEffect } from "react";
import type { useForm } from "react-hook-form";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StaffProfileData } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";

export function useFormResetEffect(
  form: ReturnType<typeof useForm<StaffAdminEditFormData>>,
  staffData: StaffProfileData,
  avatarUrl: string | null | undefined,
  displayCurrency: StaffAdminEditFormData["displayCurrency"],
  profileTimezone: string | null | undefined
) {
  useEffect(() => {
    form.reset({
      name: staffData.name ?? "",
      email: staffData.email ?? "",
      avatarUrl: avatarUrl ?? staffData.avatarUrl ?? null,
      phone: staffData.phone ?? "",
      timezone: profileTimezone ?? "",
      status: staffData.status ?? AccountStatus.Activated,
      displayCurrency: displayCurrency ?? null,
      hourlyRate: staffData.hourlyRate ?? "",
      rateCurrency: staffData.rateCurrency ?? null,
    });
  }, [avatarUrl, displayCurrency, form, profileTimezone, staffData]);
}
