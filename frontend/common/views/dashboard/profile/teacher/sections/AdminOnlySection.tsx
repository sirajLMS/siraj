"use client";

import { MenuItem, Stack, TextField, Tooltip } from "@mui/material";
import { useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { InfoField } from "@/frontend/common/views/dashboard/profile/teacher/sections/InfoField";
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
  const { canAdminResetPassword } = useProfileFieldAccess({ scope: undefined });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t.sections.adminOnly}>
        <Stack spacing={2}>
          <TextField label={t.fields.nationalId} fullWidth size="small" {...props.register("nationalId")} />
          <TextField label={t.fields.status} fullWidth size="small" select {...props.register("status")}>
            <MenuItem value={AccountStatus.Activated}>{t.status.activated}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{t.status.deactivated}</MenuItem>
          </TextField>
        </Stack>
      </SectionPanel>
    );
  }

  const { adminData } = props;

  const canResetPassword = canAdminResetPassword();
  const targetUserId = adminData.userId;

  return (
    <Stack>
      <SectionPanel title={t.sections.adminOnly}>
        <Stack spacing={2}>
          <InfoField label={t.fields.nationalId} value={toDisplayValue(adminData.nationalId, tc.notSet)} />
          <Stack spacing={0.5}>
            <InfoField
              label={t.fields.status}
              value={
                <Stack spacing={0.5} direction="row" sx={{ alignItems: "center" }}>
                  <StatusBadge
                    category="staffAccount"
                    status={adminData.status === AccountStatus.Activated ? "activated" : "deactivated"}
                    label={adminData.status === AccountStatus.Activated ? t.status.activated : t.status.deactivated}
                  />
                  {canResetPassword && targetUserId && (
                    <Tooltip title={tc.actions.manageLifecycle}>
                      <ResetPasswordDialog
                        open={resetPasswordOpen}
                        onClose={() => setResetPasswordOpen(false)}
                        userName={adminData.name ?? ""}
                        userEmail={adminData.email ?? ""}
                        isLoading={false}
                        sendEmail={sendEmail}
                        setSendEmail={setSendEmail}
                        onConfirm={() => setResetPasswordOpen(false)}
                      />
                    </Tooltip>
                  )}
                </Stack>
              }
            />
          </Stack>
        </Stack>
      </SectionPanel>
      {canResetPassword && targetUserId && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          userName={adminData.name ?? ""}
          userEmail={adminData.email ?? ""}
          isLoading={false}
          sendEmail={sendEmail}
          setSendEmail={setSendEmail}
          onConfirm={() => setResetPasswordOpen(false)}
        />
      )}
    </Stack>
  );
}
