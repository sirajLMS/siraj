"use client";

import { KeyOutlined } from "@mui/icons-material";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { useState } from "react";
import { SectionPanel } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { Translation, useAppTranslation } from "@/shared/locale";

type InfoFieldComponent = React.FC<{ readonly label: string; readonly value: React.ReactNode }>;

interface AdminStatusSectionProps {
  readonly labels: {
    readonly sectionTitle: string;
    readonly accountStatusLabel: string;
    readonly activatedLabel: string;
    readonly deactivatedLabel: string;
    readonly baseLabels: ProfileSharedBaseLabels;
  };
  readonly adminData: {
    readonly userId: string | null;
    readonly name: string | null;
    readonly email: string | null;
    readonly accountStatus: AccountStatus | null;
  };
  readonly InfoField: InfoFieldComponent;
  readonly extraViewFields?: React.ReactNode;
}

export function AdminStatusSection({ labels, adminData, InfoField, extraViewFields }: AdminStatusSectionProps) {
  const tBase = useAppTranslation(Translation.Profile.Base);
  const { canAdminResetPassword } = useProfileFieldAccess({ scope: undefined });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const { resetPassword, loading: resetLoading } = useAdminResetPassword(
    tBase.adminResetPassword.success,
    tBase.adminResetPassword.error
  );

  const canResetPassword = canAdminResetPassword();
  const targetUserId = adminData.userId;
  const userName = adminData.name ?? "";
  const userEmail = adminData.email ?? "";

  const handleResetConfirm = async (password: string, sendNotificationEmail: boolean) => {
    if (!targetUserId) return;
    const success = await resetPassword(targetUserId, password, sendNotificationEmail);
    if (success) {
      setResetPasswordOpen(false);
    }
  };

  return (
    <Stack>
      <SectionPanel title={labels.sectionTitle}>
        <Stack spacing={2}>
          {extraViewFields}
          <Stack spacing={0.5}>
            <InfoField
              label={labels.accountStatusLabel}
              value={
                <Stack spacing={0.5} direction="row" sx={{ alignItems: "center" }}>
                  <StatusBadge
                    category="staffAccount"
                    status={adminData.accountStatus === AccountStatus.Activated ? "activated" : "deactivated"}
                    label={
                      adminData.accountStatus === AccountStatus.Activated
                        ? labels.activatedLabel
                        : labels.deactivatedLabel
                    }
                  />
                  {canResetPassword && targetUserId && (
                    <Tooltip title={tBase.adminResetPassword.title}>
                      <IconButton
                        aria-label={tBase.adminResetPassword.title}
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
      </SectionPanel>
      {canResetPassword && targetUserId && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          userName={userName}
          userEmail={userEmail}
          isLoading={resetLoading}
          sendEmail={sendEmail}
          setSendEmail={setSendEmail}
          onConfirm={handleResetConfirm}
        />
      )}
    </Stack>
  );
}
