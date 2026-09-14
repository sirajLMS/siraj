"use client";

import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { AdminSectionShared } from "@/frontend/common/views/dashboard/profile/components/__shared__/adminSectionShared";
import {
  getStudentStatusColor,
  getStudentStatusLabel,
  toAccountStatusDefaultValue,
} from "@/frontend/common/views/dashboard/profile/shared/studentStatusHelpers";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

type AdminOnlySectionProps = {
  readonly labels: {
    readonly baseLabels: ProfileSharedBaseLabels;
  };
} & (
  | {
      readonly mode: "view";
      readonly profile: StudentProfileRow;
    }
  | {
      readonly mode: "edit";
      readonly profile: StudentProfileRow;
    }
);

export function AdminOnlySection(props: AdminOnlySectionProps) {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalProfile);
  const tStatus = useAppTranslation(Translation.Dashboard.StudentStatus);
  const tBase = useAppTranslation(Translation.Profile.Base);
  const { canEditStatus } = useProfileFieldAccess({ scope: undefined });

  const { profile } = props;
  const targetUserId = profile.parentUserId ?? profile.id;

  return (
    <AdminSectionShared
      mode={props.mode}
      sectionTitle={t.accountStatus}
      accountStatusLabel={t.accountStatus}
      resetPasswordSuccess={tBase.adminResetPassword.success}
      resetPasswordError={tBase.adminResetPassword.error}
      statusBadgeCategory="studentAccount"
      statusColor={getStudentStatusColor(profile.status)}
      statusLabel={getStudentStatusLabel(profile.status, tStatus)}
      editStatusOptions={[
        { value: AccountStatus.Activated, label: tBase.adminResetPassword.statusActivated },
        { value: AccountStatus.Deactivated, label: tBase.adminResetPassword.statusDeactivated },
      ]}
      editStatusDefaultValue={toAccountStatusDefaultValue(profile.status)}
      canEditStatus={canEditStatus()}
      targetUserId={targetUserId}
      userName={profile.name}
      userEmail={profile.email ?? ""}
    />
  );
}
