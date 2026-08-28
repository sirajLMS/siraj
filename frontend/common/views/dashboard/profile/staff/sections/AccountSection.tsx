"use client";

import { KeyOutlined } from "@mui/icons-material";
import { IconButton, MenuItem, Stack, TextField } from "@mui/material";
import { useState } from "react";
import type { Control, UseFormRegister } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField";
import { AccountStatus, type CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import { CoreIdentitySection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreIdentitySection";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type {
  StaffProfileData,
  StaffSectionLabelsBundle,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import type { ProfileScope } from "@/shared/constants/profile.enum";
import { Translation, useAppTranslation } from "@/shared/locale";

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly labels: StaffSectionLabelsBundle;
      readonly scope?: ProfileScope;
      readonly staffData: StaffProfileData;
      readonly isAdminScope: boolean;
      readonly displayCurrency: CurrencyCode | null | undefined;
      readonly targetUserId: string;
    }
  | {
      readonly mode: "edit";
      readonly labels: StaffSectionLabelsBundle;
      readonly scope?: ProfileScope;
      readonly staffData: StaffProfileData;
      readonly isAdminScope: boolean;
      readonly register: UseFormRegister<StaffAdminEditFormData>;
      readonly control: Control<StaffAdminEditFormData>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = props.labels.staff;
  const { baseLabels } = props.labels;
  const tBase = useAppTranslation(Translation.Profile.Base);
  const { canView, canEdit, canAdminResetPassword } = useProfileFieldAccess({ scope: props.scope });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const { resetPassword, loading: resetLoading } = useAdminResetPassword(
    tBase.adminResetPassword.success,
    tBase.adminResetPassword.error
  );

  if (props.mode === "edit") {
    return (
      <Stack spacing={2}>
        <CoreIdentitySection
          mode="edit"
          scope={props.scope}
          name={props.staffData.name}
          sectionTitle={t.sections.account}
          nameLabel={t.fields.fullName}
          emailLabel={t.fields.primaryEmail}
          currencyLabel={t.fields.displayCurrency}
          baseLabels={baseLabels}
          register={props.register}
          control={props.control}
        />
        {props.isAdminScope && canEdit("staff_role") ? (
          <SectionPanel title={t.sections.role}>
            <TextField label={t.fields.status} fullWidth size="small" select {...props.register("status")}>
              <MenuItem value={AccountStatus.Activated}>{t.fields.statusActive}</MenuItem>
              <MenuItem value={AccountStatus.Deactivated}>{t.fields.statusInactive}</MenuItem>
            </TextField>
          </SectionPanel>
        ) : null}
      </Stack>
    );
  }

  const statusLabel =
    props.staffData.status === AccountStatus.Activated ? t.fields.statusActive : t.fields.statusInactive;
  const roleStatusContent =
    props.isAdminScope && canView("staff_role") ? (
      <LabeledField
        label={t.fields.status}
        value={
          <StatusBadge
            category="staffAccount"
            status={(props.staffData.status ?? AccountStatus.Activated).toLowerCase()}
            label={statusLabel}
            size="small"
          />
        }
      />
    ) : null;

  const canResetPassword = canAdminResetPassword();
  const targetUserId = props.targetUserId;
  const hasValidTarget = targetUserId.length > 0;
  const staffName = props.staffData.name ?? "";
  const staffEmail = props.staffData.email ?? "";

  const handleResetConfirm = async (password: string, sendNotificationEmail: boolean) => {
    if (!hasValidTarget) return;
    const success = await resetPassword(targetUserId, password, sendNotificationEmail);
    if (success) {
      setResetPasswordOpen(false);
    }
  };

  const resetPasswordField =
    canResetPassword && hasValidTarget ? (
      <LabeledField
        label={tBase.adminResetPassword.title}
        value={
          <IconButton
            aria-label={tBase.adminResetPassword.title}
            onClick={() => setResetPasswordOpen(true)}
            sx={theme => ({ color: theme.palette.primary.main })}
          >
            <KeyOutlined />
          </IconButton>
        }
      />
    ) : null;

  return (
    <Stack>
      <CoreIdentitySection
        mode="view"
        scope={props.scope}
        name={staffName}
        email={staffEmail}
        avatarUrl={props.staffData.avatarUrl}
        displayCurrency={props.displayCurrency}
        sectionTitle={t.sections.account}
        nameLabel={t.fields.fullName}
        emailLabel={t.fields.primaryEmail}
        currencyLabel={t.fields.displayCurrency}
        baseLabels={baseLabels}
        additionalViewContent={
          <Stack spacing={1}>
            {roleStatusContent}
            {resetPasswordField}
          </Stack>
        }
      />
      {canResetPassword && hasValidTarget ? (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          userName={staffName}
          userEmail={staffEmail}
          isLoading={resetLoading}
          sendEmail={sendEmail}
          setSendEmail={setSendEmail}
          onConfirm={handleResetConfirm}
        />
      ) : null}
    </Stack>
  );
}
