"use client";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { InfoField } from "@/frontend/common/views/dashboard/profile/teacher/sections/InfoField";
import {
  type TeacherAdminData,
  type TeacherProfileViewLabels,
  toDisplayValue,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherAdminEditFormData } from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";

type AdminOnlySectionProps = {
  readonly labels: Pick<TeacherProfileViewLabels, "teacher"> & { readonly baseLabels: ProfileSharedBaseLabels };
} & (
  | {
      readonly mode: "view";
      readonly adminData: TeacherAdminData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
    }
);

export function AdminOnlySection(props: AdminOnlySectionProps) {
  const t = props.labels.teacher;
  const tc = props.labels.baseLabels;

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t.sections.adminOnly}>
        <Stack spacing={2}>
          <TextField label={t.fields.nationalId} fullWidth size="small" {...props.register("nationalId")} />
          <TextField label={t.fields.status} fullWidth size="small" select {...props.register("status")}>
            <MenuItem value={AccountStatus.Activated}>{t.status.activated}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{t.status.deactivated}</MenuItem>
          </TextField>
        </Stack>
      </SectionPanel>
    );
  }

  const { adminData } = props;

  return (
    <SectionPanel title={t.sections.adminOnly}>
      <Stack spacing={2}>
        <InfoField label={t.fields.nationalId} value={toDisplayValue(adminData.nationalId, tc.notSet)} />
        <Stack spacing={0.5}>
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
            {t.fields.status}
          </Typography>
          <StatusBadge
            category="staffAccount"
            status={adminData.status === AccountStatus.Activated ? "activated" : "deactivated"}
            label={adminData.status === AccountStatus.Activated ? t.status.activated : t.status.deactivated}
          />
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
