"use client";

import { Stack, Typography } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import type { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { StaffSectionLabelsBundle } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";

type StaffExtensionProfileSectionProps = {
  readonly scope?: ProfileScope;
  readonly labels: StaffSectionLabelsBundle;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: string | null;
};

export function StaffExtensionProfileSection({
  scope,
  labels,
  hourlyRate,
  rateCurrency,
}: Readonly<StaffExtensionProfileSectionProps>) {
  const { canViewField } = useProfileFieldAccess({ scope });
  const st = labels.staff;

  if (!canViewField("staff_role")) {
    return null;
  }

  return (
    <SectionPanel title={st.sections.compensation}>
      <Stack spacing={2}>
        <Stack sx={{ gap: 0.25 }}>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {st.fields.hourlyRate}
          </Typography>
          <Typography variant="bodyLg">
            {hourlyRate ?? labels.baseLabels.notSet} {rateCurrency ?? ""}
          </Typography>
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
