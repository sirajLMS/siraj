"use client";

import { MenuItem, Stack, TextField, Tooltip } from "@mui/material";
import { useState } from "react";
import { SectionPanel } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
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

export function AdminOnlySection(props: AdminOnlySectionProps) {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalProfile);
  const tStatus = useAppTranslation(Translation.Dashboard.StudentStatus);
  const { baseLabels } = props.labels;
  const { canAdminResetPassword, canEditStatus } = useProfileFieldAccess({ scope: undefined });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  if (props.mode === "edit") {
    const canEditStatusField = canEditStatus();
    return (
      <SectionPanel title={t.accountStatus}>
        <Stack spacing={2}>
          {canEditStatusField ? (
            <TextField label={t.accountStatus} fullWidth size="small" select defaultValue={props.profile.status}>
              <MenuItem value={StudentStatus.Regular}>{tStatus.statusOptions.REGULAR}</MenuItem>
              <MenuItem value={StudentStatus.Suspended}>{tStatus.statusOptions.SUSPENDED}</MenuItem>
              <MenuItem value={StudentStatus.OnLeave}>{tStatus.statusOptions.ON_LEAVE}</MenuItem>
              <MenuItem value={StudentStatus.OnTrial}>{tStatus.statusOptions.ON_TRIAL}</MenuItem>
              <MenuItem value={StudentStatus.Deactivated}>{tStatus.statusOptions.DEACTIVATED}</MenuItem>
            </TextField>
          ) : null}
        </Stack>
      </SectionPanel>
    );
  }

  const { profile } = props;
  const canResetPassword = canAdminResetPassword();
  const targetUserId = profile.parentUserId ?? profile.id;

  return (
    <Stack>
      <SectionPanel title={t.accountStatus}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Tooltip title={baseLabels.actions.manageLifecycle}>
              <Stack spacing={0.5} direction="row" sx={{ alignItems: "center" }}>
                <StatusBadge
                  category="studentAccount"
                  status={getStudentStatusColor(profile.status)}
                  label={getStudentStatusLabel(profile.status, tStatus)}
                />
                {canResetPassword && targetUserId && (
                  <Tooltip title={baseLabels.actions.manageLifecycle}>
                    <ResetPasswordDialog
                      open={resetPasswordOpen}
                      onClose={() => setResetPasswordOpen(false)}
                      userName={profile.name}
                      userEmail={profile.email ?? ""}
                      isLoading={false}
                      sendEmail={sendEmail}
                      setSendEmail={setSendEmail}
                      onConfirm={() => setResetPasswordOpen(false)}
                    />
                  </Tooltip>
                )}
              </Stack>
            </Tooltip>
          </Stack>
        </Stack>
      </SectionPanel>
      {canResetPassword && targetUserId && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          userName={profile.name}
          userEmail={profile.email ?? ""}
          isLoading={false}
          sendEmail={sendEmail}
          setSendEmail={setSendEmail}
          onConfirm={() => setResetPasswordOpen(false)}
        />
      )}
    </Stack>
  );
}
