"use client";

import { KeyOutlined } from "@mui/icons-material";
import { IconButton, MenuItem, Stack, TextField } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAccountResetFlow } from "@/frontend/common/views/dashboard/profile/__shared__";
import type { AccountSectionProps } from "@/frontend/common/views/dashboard/profile/parent/sections/accountSection.helpers";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import { CoreIdentitySection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreIdentitySection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { ProfileParentLabels } from "@/shared/locale/types/profile";

function resolveAccountStatusLabel(accountStatus: string | null | undefined, t: ProfileParentLabels): string {
  const normalized = (accountStatus ?? AccountStatus.Activated).toLowerCase();
  if (normalized === "activated" || normalized === "deactivated") {
    return t.accountStatus[normalized];
  }
  return t.accountStatus.activated;
}

type AccountSectionEditProps = Extract<AccountSectionProps, { readonly mode: "edit" }>;

export function AccountSectionEdit(props: AccountSectionEditProps) {
  const t = props.labels.parent;
  const { baseLabels } = props.labels;
  const { canEditStatus } = useProfileFieldAccess({ scope: props.scope });
  const canEditStatusField = canEditStatus();

  return (
    <CoreIdentitySection
      mode="edit"
      scope={props.scope}
      name={props.parentData.name}
      sectionTitle={t.sections.account}
      nameLabel={t.fields.fullName}
      emailLabel={t.fields.primaryEmail}
      currencyLabel={t.fields.displayCurrency}
      baseLabels={baseLabels}
      register={props.register}
      control={props.control}
      additionalEditContent={
        canEditStatusField ? (
          <TextField
            label={t.fields.accountStatus}
            fullWidth
            size="small"
            select
            {...props.register("lifecycleStatus")}
          >
            <MenuItem value={AccountStatus.Activated}>{t.accountStatus.activated}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{t.accountStatus.deactivated}</MenuItem>
          </TextField>
        ) : null
      }
    />
  );
}

type AccountSectionViewProps = Extract<AccountSectionProps, { readonly mode: "view" }>;

export function AccountSectionView(props: AccountSectionViewProps) {
  const t = props.labels.parent;
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

  const accountStatusRaw = props.adminData && "accountStatus" in props.adminData ? props.adminData.accountStatus : null;
  const accountStatus = accountStatusRaw ?? null;
  const accountStatusContent =
    canView("parent_account") && accountStatus ? (
      <LabeledField
        label={t.fields.accountStatus}
        value={
          <StatusBadge
            category="staffAccount"
            status={accountStatus.toLowerCase()}
            label={resolveAccountStatusLabel(accountStatus, t)}
            size="small"
          />
        }
      />
    ) : null;

  const canResetPassword = canAdminResetPassword();
  const targetUserId = props.adminData?.userId;
  const parentName = props.parentData.name ?? "";
  const parentEmail = props.parentData.email ?? "";

  const handleResetConfirm = async (password: string, sendNotificationEmail: boolean) => {
    if (!targetUserId) return;
    const success = await resetPassword(targetUserId, password, sendNotificationEmail);
    if (success) {
      setResetPasswordOpen(false);
    }
  };

  return (
    <>
      <CoreIdentitySection
        mode="view"
        scope={props.scope}
        name={parentName}
        email={parentEmail}
        avatarUrl={props.avatarUrl}
        displayCurrency={props.displayCurrency}
        sectionTitle={t.sections.account}
        nameLabel={t.fields.fullName}
        emailLabel={t.fields.primaryEmail}
        currencyLabel={t.fields.displayCurrency}
        baseLabels={baseLabels}
        additionalViewContent={
          <Stack spacing={1}>
            {accountStatusContent}
            {canResetPassword && targetUserId && (
              <LabeledField
                label={tBase.adminResetPassword.title}
                value={
                  <IconButton
                    onClick={() => setResetPasswordOpen(true)}
                    sx={theme => ({ color: theme.palette.primary.main })}
                    aria-label={tBase.adminResetPassword.title}
                  >
                    <KeyOutlined />
                  </IconButton>
                }
              />
            )}
          </Stack>
        }
      />
      {canResetPassword && targetUserId && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          userName={parentName}
          userEmail={parentEmail}
          isLoading={resetLoading}
          sendEmail={sendEmail}
          setSendEmail={setSendEmail}
          onConfirm={handleResetConfirm}
        />
      )}
    </>
  );
}
