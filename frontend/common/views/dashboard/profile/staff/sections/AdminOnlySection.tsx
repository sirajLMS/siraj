"use client";

import { MenuItem, Stack, TextField, Tooltip } from "@mui/material";
import { useState } from "react";
import type { Control, UseFormRegister } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import { InfoField } from "@/frontend/common/views/dashboard/profile/shared/sections/InfoField";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { StaffProfileViewLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";

type StaffAdminData = {
  readonly userId: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly status: string | null;
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
  const tc = props.labels.baseLabels;
  const { canAdminResetPassword } = useProfileFieldAccess({ scope: undefined });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t.sections.role}>
        <Stack spacing={2}>
          <TextField label={t.fields.status} fullWidth size="small" select {...props.register("status")}>
            <MenuItem value={AccountStatus.Activated}>{t.fields.statusActive}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{t.fields.statusInactive}</MenuItem>
          </TextField>
        </Stack>
      </SectionPanel>
    );
  }

  const { profile } = props;

  const canResetPassword = canAdminResetPassword();
  const targetUserId = profile.userId;

  const statusLabel = profile.status === AccountStatus.Activated ? t.fields.statusActive : t.fields.statusInactive;

  return (
    <Stack>
      <SectionPanel title={t.sections.role}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <InfoField
              label={t.fields.status}
              value={
                <Stack spacing={0.5} direction="row" sx={{ alignItems: "center" }}>
                  <StatusBadge
                    category="staffAccount"
                    status={profile.status === AccountStatus.Activated ? "activated" : "deactivated"}
                    label={statusLabel}
                  />
                  {canResetPassword && targetUserId && (
                    <Tooltip title={tc.actions.manageLifecycle}>
                      <ResetPasswordDialog
                        open={resetPasswordOpen}
                        onClose={() => setResetPasswordOpen(false)}
                        userName={profile.name ?? ""}
                        userEmail={profile.email ?? ""}
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
          userName={profile.name ?? ""}
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
