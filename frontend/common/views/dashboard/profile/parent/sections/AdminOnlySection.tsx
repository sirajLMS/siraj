"use client";

import { Stack } from "@mui/material";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type {
  ParentAdminData,
  ParentSectionLabelsBundle,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { AccountStatusSelect } from "@/frontend/common/views/dashboard/profile/shared/AccountStatusSelect";
import { AdminStatusSection } from "@/frontend/common/views/dashboard/profile/shared/AdminStatusSection";
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
          <AccountStatusSelect
            name="lifecycleStatus"
            label={t.fields.accountStatus}
            options={[
              { value: AccountStatus.Activated, label: t.accountStatus.activated },
              { value: AccountStatus.Deactivated, label: t.accountStatus.deactivated },
            ]}
            register={props.register}
          />
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
    />
  );
}
