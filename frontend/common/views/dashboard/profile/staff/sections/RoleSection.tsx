"use client";

import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { InfoField } from "@/frontend/common/views/dashboard/profile/parent/sections/InfoField";
import {
  type StaffProfileData,
  toDisplayValue,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import { useAppTranslation } from "@/shared/locale/client";

export function RoleSection({ staffData }: { readonly staffData: StaffProfileData }) {
  const t = useAppTranslation("profile").staff;
  const tc = useAppTranslation("profile");

  return (
    <SectionPanel title={t.sections.role}>
      <Stack spacing={1.5}>
        <InfoField
          label={t.fields.roleName}
          value={toDisplayValue(staffData.roleName ?? staffData.roleSlug, tc.notSet)}
        />
      </Stack>
    </SectionPanel>
  );
}
