"use client";

import { Stack, TextField } from "@mui/material";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { AccountStatusSelect } from "@/frontend/common/views/dashboard/profile/shared/AccountStatusSelect";
import { AdminStatusSection } from "@/frontend/common/views/dashboard/profile/shared/AdminStatusSection";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
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
          <AccountStatusSelect
            name="status"
            label={t.fields.status}
            options={[
              { value: AccountStatus.Activated, label: t.status.activated },
              { value: AccountStatus.Deactivated, label: t.status.deactivated },
            ]}
            register={props.register}
          />
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
      extraViewFields={
        <LabeledField label={t.fields.nationalId} value={toDisplayValue(adminData.nationalId, tc.notSet)} />
      }
    />
  );
}
