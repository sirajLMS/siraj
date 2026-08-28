"use client";

import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField";
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
        <LabeledField
          label={t.fields.roleName}
          value={toDisplayValue(staffData.roleName ?? staffData.roleSlug, tc.notSet)}
        />
      </Stack>
    </SectionPanel>
  );
}
