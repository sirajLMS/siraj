"use client";

import CakeOutlined from "@mui/icons-material/CakeOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import WcOutlined from "@mui/icons-material/WcOutlined";
import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { CountryDisplay } from "@/frontend/common/components/ui/display";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import {
  formatGender,
  isCountryCode,
} from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.helpers";
import type { usePersonalFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.hooks";
import type { ProfilePersonalViewProps } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.types";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";

export function ProfilePersonalSectionView({
  props,
  access,
  baseLabels,
}: {
  readonly props: ProfilePersonalViewProps;
  readonly access: ReturnType<typeof usePersonalFieldAccess>;
  readonly baseLabels: ProfileSharedBaseLabels;
}) {
  const { canViewField } = access;
  const labels = props.fieldLabels;

  const genderDisplay = formatGender(props.gender, labels);

  return (
    <SectionPanel title={props.sectionTitle}>
      <Stack spacing={1}>
        {canViewField("nationality") ? (
          <ProfileFieldRow
            icon={PersonOutlined}
            label={labels.nationality}
            value={
              props.nationality ? (
                <CountryDisplay
                  code={isCountryCode(props.nationality) ? props.nationality : null}
                  fallback={baseLabels.notSet}
                />
              ) : (
                baseLabels.notSet
              )
            }
          />
        ) : null}
        {canViewField("address") ? (
          <ProfileFieldRow icon={HomeOutlined} label={labels.address} value={props.address ?? baseLabels.notSet} />
        ) : null}
        {canViewField("dateOfBirth") ? (
          <ProfileFieldRow
            icon={CakeOutlined}
            label={labels.dateOfBirth}
            value={props.dateOfBirth ?? baseLabels.notSet}
          />
        ) : null}
        {canViewField("gender") ? (
          <ProfileFieldRow icon={WcOutlined} label={labels.gender} value={genderDisplay || baseLabels.notSet} />
        ) : null}
        {canViewField("qualifications") ? (
          <ProfileFieldRow
            icon={SchoolOutlined}
            label={labels.qualifications}
            value={props.qualifications ?? baseLabels.notSet}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
