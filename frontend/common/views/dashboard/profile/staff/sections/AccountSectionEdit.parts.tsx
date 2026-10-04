"use client";

import { MenuItem, Stack, TextField } from "@mui/material";
import type { Control, UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { CoreIdentitySection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreIdentitySection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type {
  StaffProfileData,
  StaffSectionLabelsBundle,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import type { ProfileScope } from "@/shared/constants/profile.enum";

export interface AccountSectionEditProps {
  readonly labels: StaffSectionLabelsBundle;
  readonly scope?: ProfileScope;
  readonly staffData: StaffProfileData;
  readonly isAdminScope: boolean;
  readonly register: UseFormRegister<StaffAdminEditFormData>;
  readonly control: Control<StaffAdminEditFormData>;
}

export function AccountSectionEdit(props: AccountSectionEditProps) {
  const t = props.labels.staff;
  const { baseLabels } = props.labels;
  const { canEdit } = useProfileFieldAccess({ scope: props.scope });

  return (
    <Stack spacing={2}>
      <CoreIdentitySection
        mode="edit"
        scope={props.scope}
        name={props.staffData.name}
        sectionTitle={t.sections.account}
        nameLabel={t.fields.fullName}
        emailLabel={t.fields.primaryEmail}
        currencyLabel={t.fields.displayCurrency}
        baseLabels={baseLabels}
        register={props.register}
        control={props.control}
      />
      {props.isAdminScope && canEdit("staff_role") ? (
        <SectionPanel title={t.sections.role}>
          <TextField label={t.fields.status} fullWidth size="small" select {...props.register("status")}>
            <MenuItem value={AccountStatus.Activated}>{t.fields.statusActive}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{t.fields.statusInactive}</MenuItem>
          </TextField>
        </SectionPanel>
      ) : null}
    </Stack>
  );
}
