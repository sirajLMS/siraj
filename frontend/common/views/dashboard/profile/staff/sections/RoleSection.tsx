"use client";

import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { InfoField } from "@/frontend/common/views/dashboard/profile/parent/sections/InfoField";
import {
  type StaffProfileData,
  type StaffRoleSectionLabels,
  toDisplayValue,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";

export function RoleSection({
  staffData,
  labels,
}: {
  readonly staffData: StaffProfileData;
  readonly labels: StaffRoleSectionLabels;
}) {
  const { staff: t, base: tc } = labels;

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
