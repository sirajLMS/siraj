"use client";

import { KeyOutlined } from "@mui/icons-material";
import { IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  AdminResetPasswordSection,
  type AdminResetPasswordSectionRef,
} from "@/frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students/status";

type StudentAdminSectionProps = {
  readonly labels: { readonly baseLabels: { readonly actions: { readonly manageLifecycle: string } } };
  readonly resetPasswordRef?: React.RefObject<AdminResetPasswordSectionRef | null>;
} & (
  | {
      readonly mode: "view";
      readonly studentData: StudentProfileRow;
    }
  | {
      readonly mode: "edit";
      readonly studentData: StudentProfileRow;
    }
);

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
    <Stack spacing={0.25}>
      <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>{label}</Typography>
      {value}
    </Stack>
  );
}

export function StudentAdminSection(props: StudentAdminSectionProps) {
  const { studentData, resetPasswordRef } = props;
  const t = useAppTranslation(Translation.Dashboard.StudentPortalProfile);
  const tStatus = useAppTranslation(Translation.Dashboard.StudentStatus);
  const tBase = useAppTranslation(Translation.Profile.Base);
  const { canEditStatus, canAdminResetPassword } = useProfileFieldAccess({ scope: undefined });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const { resetPassword, loading: resetLoading } = useAdminResetPassword(
    tBase.adminResetPassword.success,
    tBase.adminResetPassword.error
  );

  const targetUserId = studentData.parentUserId ?? studentData.id;
  const studentName = studentData.name;
  const studentEmail = studentData.email ?? "";

  const handleResetConfirm = async (password: string, sendNotificationEmail: boolean) => {
    if (!targetUserId) return;
    const success = await resetPassword(targetUserId, password, sendNotificationEmail);
    if (success) {
      setResetPasswordOpen(false);
    }
  };

  if (props.mode === "edit") {
    const canEditStatusField = canEditStatus();
    const canResetPassword = canAdminResetPassword();
    return (
      <Stack spacing={2}>
        {canEditStatusField ? (
          <TextField label={t.accountStatus} fullWidth size="small" select defaultValue={studentData.status}>
            <MenuItem value={StudentStatus.Regular}>{tStatus.statusOptions.REGULAR}</MenuItem>
            <MenuItem value={StudentStatus.Suspended}>{tStatus.statusOptions.SUSPENDED}</MenuItem>
            <MenuItem value={StudentStatus.OnLeave}>{tStatus.statusOptions.ON_LEAVE}</MenuItem>
            <MenuItem value={StudentStatus.OnTrial}>{tStatus.statusOptions.ON_TRIAL}</MenuItem>
            <MenuItem value={StudentStatus.Deactivated}>{tStatus.statusOptions.DEACTIVATED}</MenuItem>
          </TextField>
        ) : null}
        {canResetPassword && targetUserId && (
          <AdminResetPasswordSection
            ref={resetPasswordRef}
            targetUserId={targetUserId}
            userName={studentName}
            userEmail={studentEmail}
          />
        )}
      </Stack>
    );
  }

  const canResetPassword = canAdminResetPassword();

  return (
    <Stack>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <InfoField
            label={t.accountStatus}
            value={
              <Stack spacing={0.5} direction="row" sx={{ alignItems: "center" }}>
                <StatusBadge
                  category="studentAccount"
                  status={getStudentStatusColor(studentData.status)}
                  label={getStudentStatusLabel(studentData.status, tStatus)}
                />
                {canResetPassword && targetUserId && (
                  <Tooltip title={tBase.adminResetPassword.title}>
                    <IconButton
                      onClick={() => setResetPasswordOpen(true)}
                      sx={theme => ({ color: theme.palette.primary.main })}
                    >
                      <KeyOutlined />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            }
          />
        </Stack>
      </Stack>
      {canResetPassword && targetUserId && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          userName={studentName}
          userEmail={studentEmail}
          isLoading={resetLoading}
          sendEmail={sendEmail}
          setSendEmail={setSendEmail}
          onConfirm={handleResetConfirm}
        />
      )}
    </Stack>
  );
}
