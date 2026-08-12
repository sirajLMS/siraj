"use client";

import { Stack, Typography } from "@mui/material";
import type * as React from "react";
import { AdminSectionShared } from "@/frontend/common/views/dashboard/profile/components/__shared__/adminSectionShared";
import {
  getStudentStatusColor,
  getStudentStatusLabel,
  STUDENT_STATUS_OPTIONS,
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

function InfoField({ label, value }: { readonly label: string; readonly value: React.ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>{label}</Typography>
      {value}
    </Stack>
  );
}

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
      InfoField={InfoField}
      statusBadgeCategory="studentAccount"
      statusColor={getStudentStatusColor(profile.status)}
      statusLabel={getStudentStatusLabel(profile.status, tStatus)}
      editStatusOptions={STUDENT_STATUS_OPTIONS.map(status => ({
        value: status,
        label: tStatus.statusOptions[status],
      }))}
      editStatusDefaultValue={profile.status}
      canEditStatus={canEditStatus()}
      targetUserId={targetUserId}
      userName={profile.name}
      userEmail={profile.email ?? ""}
    />
  );
}
