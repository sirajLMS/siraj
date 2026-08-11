"use client";

import { MenuItem, Stack, TextField } from "@mui/material";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AdminStatusSection } from "@/frontend/common/views/dashboard/profile/shared/AdminStatusSection";
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
    <AdminStatusSection
      labels={{
        sectionTitle: t.sections.adminOnly,
        accountStatusLabel: t.fields.status,
        activatedLabel: t.status.activated,
        deactivatedLabel: t.status.deactivated,
        baseLabels: tc,
      }}
      adminData={{
        userId: adminData.userId,
        name: adminData.name,
        email: adminData.email,
        accountStatus: adminData.status,
      }}
      InfoField={InfoField}
      extraViewFields={
        <InfoField label={t.fields.nationalId} value={toDisplayValue(adminData.nationalId, tc.notSet)} />
      }
    />
  );
}
