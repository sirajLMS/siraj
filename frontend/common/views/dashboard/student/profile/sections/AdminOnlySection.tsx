"use client";

import { Stack, Typography } from "@mui/material";
import type * as React from "react";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AdminSectionShared } from "@/frontend/common/views/dashboard/profile/components/__shared__/adminSectionShared";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students/status";

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

const STUDENT_STATUS_OPTIONS = [
  StudentStatus.Regular,
  StudentStatus.Suspended,
  StudentStatus.OnLeave,
  StudentStatus.OnTrial,
  StudentStatus.Deactivated,
] as const;

function getStudentStatusLabel(status: string | null, tStatus: StudentStatusLabels): string {
  const statusLabels: Record<string, string> = {
    [StudentStatus.Regular]: tStatus.statusOptions.REGULAR,
    [StudentStatus.OnLeave]: tStatus.statusOptions.ON_LEAVE,
    [StudentStatus.Suspended]: tStatus.statusOptions.SUSPENDED,
    [StudentStatus.OnTrial]: tStatus.statusOptions.ON_TRIAL,
    [StudentStatus.Deactivated]: tStatus.statusOptions.DEACTIVATED,
  };
  return status ? statusLabels[status] : "";
}

function getStudentStatusColor(
  status: string | null
): "activated" | "deactivated" | "suspended" | "on_leave" | "on_trial" {
  switch (status) {
    case StudentStatus.Regular:
      return "activated";
    case StudentStatus.Deactivated:
      return "deactivated";
    case StudentStatus.Suspended:
      return "suspended";
    case StudentStatus.OnLeave:
      return "on_leave";
    case StudentStatus.OnTrial:
      return "on_trial";
    default:
      return "activated";
  }
}

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
