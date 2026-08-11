"use client";

import { KeyOutlined } from "@mui/icons-material";
import { IconButton, MenuItem, Stack, TextField, Tooltip } from "@mui/material";
import { useState } from "react";
import { SectionPanel } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import {
  AdminResetPasswordSection,
  type AdminResetPasswordSectionRef,
} from "@/frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { Translation, useAppTranslation } from "@/shared/locale";

type StatusBadgeCategory = "studentAccount" | "staffAccount";

type StatusColor = "activated" | "deactivated" | "suspended" | "on_leave" | "on_trial";

type InfoFieldComponent = React.FC<{ readonly label: string; readonly value: React.ReactNode }>;

interface StatusOption {
  readonly value: string;
  readonly label: string;
}

interface AdminSectionSharedProps {
  readonly mode: "view" | "edit";
  readonly sectionTitle: string;
  readonly accountStatusLabel: string;
  readonly resetPasswordSuccess: string;
  readonly resetPasswordError: string;
  readonly InfoField: InfoFieldComponent;
  readonly statusBadgeCategory: StatusBadgeCategory;
  readonly statusColor: StatusColor;
  readonly statusLabel: string;
  readonly editStatusOptions: readonly StatusOption[];
  readonly editStatusDefaultValue: string;
  readonly canEditStatus: boolean;
  readonly targetUserId: string | null;
  readonly userName: string;
  readonly userEmail: string;
  readonly extraViewFields?: React.ReactNode;
  readonly extraEditFields?: React.ReactNode;
  readonly renderEditResetPassword?: React.ReactNode;
  readonly resetPasswordRef?: React.RefObject<AdminResetPasswordSectionRef | null>;
}

function ResetPasswordIconButton({
  tooltip,
  onClick,
  disabled,
}: {
  readonly tooltip: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
}) {
  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          onClick={onClick}
          disabled={disabled}
          aria-label={tooltip}
          sx={theme => ({ color: theme.palette.primary.main })}
        >
          <KeyOutlined />
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function AdminSectionShared(props: Readonly<AdminSectionSharedProps>) {
  const tBase = useAppTranslation(Translation.Profile.Base);
  const { canAdminResetPassword } = useProfileFieldAccess({ scope: undefined });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const { resetPassword, loading: resetLoading } = useAdminResetPassword(
    props.resetPasswordSuccess,
    props.resetPasswordError
  );

  const canResetPassword = canAdminResetPassword();
  const hasValidTarget = props.targetUserId !== null && props.targetUserId !== "";

  const handleResetConfirm = async (password: string, sendNotificationEmail: boolean) => {
    if (!props.targetUserId) return;
    const success = await resetPassword(props.targetUserId, password, sendNotificationEmail);
    if (success) {
      setResetPasswordOpen(false);
    }
  };

  if (props.mode === "edit") {
    return (
      <SectionPanel title={props.sectionTitle}>
        <Stack spacing={2}>
          {props.canEditStatus ? (
            <TextField
              label={props.accountStatusLabel}
              fullWidth
              size="small"
              select
              defaultValue={props.editStatusDefaultValue}
            >
              {props.editStatusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          {props.extraEditFields}
          {props.renderEditResetPassword}
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <Stack>
      <SectionPanel title={props.sectionTitle}>
        <Stack spacing={2}>
          {props.extraViewFields}
          <Stack spacing={0.5}>
            <props.InfoField
              label={props.accountStatusLabel}
              value={
                <Stack spacing={0.5} direction="row" sx={{ alignItems: "center" }}>
                  <StatusBadge
                    category={props.statusBadgeCategory}
                    status={props.statusColor}
                    label={props.statusLabel}
                  />
                  {canResetPassword && hasValidTarget && (
                    <ResetPasswordIconButton
                      tooltip={tBase.adminResetPassword.title}
                      onClick={() => setResetPasswordOpen(true)}
                      disabled={false}
                    />
                  )}
                </Stack>
              }
            />
          </Stack>
        </Stack>
      </SectionPanel>
      {canResetPassword && hasValidTarget && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          userName={props.userName}
          userEmail={props.userEmail}
          isLoading={resetLoading}
          sendEmail={sendEmail}
          setSendEmail={setSendEmail}
          onConfirm={handleResetConfirm}
        />
      )}
    </Stack>
  );
}

export function EditResetPasswordSlot({
  targetUserId,
  userName,
  userEmail,
  ref,
}: {
  readonly targetUserId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly ref?: React.RefObject<AdminResetPasswordSectionRef | null>;
}) {
  return <AdminResetPasswordSection ref={ref} targetUserId={targetUserId} userName={userName} userEmail={userEmail} />;
}
