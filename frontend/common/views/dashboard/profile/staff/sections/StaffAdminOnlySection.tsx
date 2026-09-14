"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { AdminSectionShared } from "@/frontend/common/views/dashboard/profile/components/__shared__/adminSectionShared";
import { AccountStatusSelect } from "@/frontend/common/views/dashboard/profile/shared/AccountStatusSelect";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { StaffProfileViewLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

type StaffAdminData = {
  readonly userId: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly status: AccountStatus | null;
};

type AdminOnlySectionProps = {
  readonly labels: Pick<StaffProfileViewLabels, "staff"> & { readonly baseLabels: ProfileSharedBaseLabels };
} & (
  | {
      readonly mode: "view";
      readonly profile: StaffAdminData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<StaffAdminEditFormData>;
      readonly control: Control<StaffAdminEditFormData>;
    }
);

export function AdminOnlySection(props: AdminOnlySectionProps) {
  const t = props.labels.staff;
  const tBase = useAppTranslation(Translation.Profile.Base);

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t.sections.role}>
        <AccountStatusSelect
          name="status"
          label={t.fields.status}
          options={[
            { value: AccountStatus.Activated, label: t.fields.statusActive },
            { value: AccountStatus.Deactivated, label: t.fields.statusInactive },
          ]}
          register={props.register}
        />
      </SectionPanel>
    );
  }

  const { profile } = props;
  const statusLabel = profile.status === AccountStatus.Activated ? t.fields.statusActive : t.fields.statusInactive;

  return (
    <AdminSectionShared
      mode="view"
      sectionTitle={t.sections.role}
      accountStatusLabel={t.fields.status}
      resetPasswordSuccess={tBase.adminResetPassword.success}
      resetPasswordError={tBase.adminResetPassword.error}
      statusBadgeCategory="staffAccount"
      statusColor={profile.status === AccountStatus.Activated ? "activated" : "deactivated"}
      statusLabel={statusLabel}
      editStatusOptions={[
        { value: AccountStatus.Activated, label: t.fields.statusActive },
        { value: AccountStatus.Deactivated, label: t.fields.statusInactive },
      ]}
      editStatusDefaultValue={profile.status ?? AccountStatus.Activated}
      canEditStatus={false}
      targetUserId={profile.userId}
      userName={profile.name ?? ""}
      userEmail={profile.email ?? ""}
    />
  );
}
