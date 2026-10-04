"use client";

import { KeyOutlined } from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField";
import { AccountStatus, type CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAccountResetFlow } from "@/frontend/common/views/dashboard/profile/__shared__";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import { CoreIdentitySection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreIdentitySection";
import type {
  StaffProfileData,
  StaffSectionLabelsBundle,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { ProfileScope } from "@/shared/constants/profile.enum";

export interface AccountSectionViewProps {
  readonly labels: StaffSectionLabelsBundle;
  readonly scope?: ProfileScope;
  readonly staffData: StaffProfileData;
  readonly isAdminScope: boolean;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly targetUserId: string;
}

export function AccountSectionView(props: AccountSectionViewProps) {
  const t = props.labels.staff;
  const { baseLabels } = props.labels;
  const {
    tBase,
    canView,
    canAdminResetPassword,
    resetPasswordOpen,
    setResetPasswordOpen,
    sendEmail,
    setSendEmail,
    resetPassword,
    resetLoading,
  } = useAccountResetFlow(props.scope);

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
  const hasValidTarget = props.targetUserId.length > 0;
  const staffName = props.staffData.name ?? "";
  const staffEmail = props.staffData.email ?? "";

  const handleResetConfirm = async (password: string, sendNotificationEmail: boolean) => {
    if (!hasValidTarget) return;
    const success = await resetPassword(props.targetUserId, password, sendNotificationEmail);
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
    <>
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
    </>
  );
}
