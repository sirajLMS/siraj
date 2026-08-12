"use client";

import { MenuItem, Stack, TextField } from "@mui/material";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type {
  ParentAdminData,
  ParentSectionLabelsBundle,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { AdminStatusSection } from "@/frontend/common/views/dashboard/profile/shared/AdminStatusSection";
import { InfoField } from "@/frontend/common/views/dashboard/profile/shared/sections/InfoField";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";

type AdminOnlySectionProps = {
  readonly labels: Pick<ParentSectionLabelsBundle, "parent"> & { readonly baseLabels: ProfileSharedBaseLabels };
} & (
  | {
      readonly mode: "view";
      readonly adminData: ParentAdminData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
    }
);

export function AdminOnlySection(props: AdminOnlySectionProps) {
  const t = props.labels.parent;

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t.sections.adminOnly}>
        <Stack spacing={2}>
          <TextField
            label={t.fields.accountStatus}
            fullWidth
            size="small"
            select
            {...props.register("lifecycleStatus")}
          >
            <MenuItem value={AccountStatus.Activated}>{t.accountStatus.activated}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{t.accountStatus.deactivated}</MenuItem>
          </TextField>
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <AdminStatusSection
      labels={{
        sectionTitle: t.sections.adminOnly,
        accountStatusLabel: t.fields.accountStatus,
        activatedLabel: t.accountStatus.activated,
        deactivatedLabel: t.accountStatus.deactivated,
        baseLabels: props.labels.baseLabels,
      }}
      adminData={props.adminData}
      InfoField={InfoField}
    />
  );
}
