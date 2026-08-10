"use client";

import { MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { AccountStatus, type ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { Translation, useAppTranslation } from "@/shared/locale";

type SupervisorAdminSectionProps = {
  readonly labels: { readonly baseLabels: { readonly actions: { readonly manageLifecycle: string } } };
} & (
  | {
      readonly mode: "view";
      readonly profile: {
        readonly userId: string;
        readonly name: string;
        readonly email: string | null;
        readonly status: string | null;
      };
    }
  | {
      readonly mode: "edit";
      readonly profile: {
        readonly userId: string;
        readonly name: string;
        readonly email: string | null;
        readonly status: string | null;
      };
    }
);

function getAccountStatusColor(status: string | null): "activated" | "deactivated" {
  switch (status) {
    case AccountStatus.Activated:
      return "activated";
    case AccountStatus.Deactivated:
      return "deactivated";
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

export function SupervisorAdminSection(props: SupervisorAdminSectionProps) {
  const { profile } = props;
  const t = useAppTranslation(Translation.Dashboard.SupervisorPortalProfile);
  const { baseLabels } = props.labels;
  const { canEditStatus, canAdminResetPassword } = useProfileFieldAccess({
    scope: undefined as ProfileScope | undefined,
  });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  if (props.mode === "edit") {
    const canEditStatusField = canEditStatus();
    return (
      <Stack spacing={2}>
        {canEditStatusField ? (
          <TextField label={t.fields.status} fullWidth size="small" select defaultValue={profile.status}>
            <MenuItem value={AccountStatus.Activated}>{t.adminResetPassword.statusActivated}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{t.adminResetPassword.statusDeactivated}</MenuItem>
          </TextField>
        ) : null}
      </Stack>
    );
  }

  // View mode
  const canResetPassword = canAdminResetPassword();
  const targetUserId = profile.userId;

  const statusLabel =
    profile.status === "ACTIVATED"
      ? t.adminResetPassword.statusActivated
      : profile.status === "DEACTIVATED"
        ? t.adminResetPassword.statusDeactivated
        : (profile.status ?? t.notSet);

  return (
    <Stack>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Tooltip title={baseLabels.actions.manageLifecycle}>
            <InfoField
              label={t.fields.status}
              value={
                <Stack spacing={0.5} direction="row" sx={{ alignItems: "center" }}>
                  <StatusBadge
                    category="staffAccount"
                    status={getAccountStatusColor(profile.status)}
                    label={statusLabel}
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
              }
            />
          </Tooltip>
        </Stack>
      </Stack>
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
