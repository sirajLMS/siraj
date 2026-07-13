"use client";

import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionPanel } from "@/frontend/common/components/ui";
import { InfoField } from "@/frontend/common/views/dashboard/profile/parent/sections/InfoField";
import {
  type StaffProfileData,
  toDisplayValue,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";

export function RoleSection({ staffData }: { readonly staffData: StaffProfileData }) {
  const t = useTranslations("profile.staff");
  const tc = useTranslations("profile");

  return (
    <SectionPanel title={t("sections.role")}>
      <Stack spacing={1.5}>
        <InfoField
          label={t("fields.roleName")}
          value={toDisplayValue(staffData.roleName ?? staffData.roleSlug, tc("notSet"))}
        />
      </Stack>
    </SectionPanel>
  );
}
