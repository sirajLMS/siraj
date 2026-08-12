"use client";

import { KeyOutlined } from "@mui/icons-material";
import { IconButton, MenuItem, Stack, TextField } from "@mui/material";
import { useState } from "react";
import type { Control, UseFormRegister } from "react-hook-form";
import { StatusBadge } from "@/frontend/common/components/ui";
import {
  AccountStatus,
  type CurrencyCode,
  type ParentStatus,
  type ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  ParentAdminData,
  ParentSectionLabelsBundle,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import { CoreIdentitySection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreIdentitySection";
import { InfoField } from "@/frontend/common/views/dashboard/profile/shared/sections/InfoField";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ProfileParentLabels } from "@/shared/locale/types/profile";

type ParentAccountFormFields = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  displayCurrency?: CurrencyCode | null;
  lifecycleStatus?: ParentStatus;
};

type AccountParentData = Pick<ParentViewData, "name" | "email"> & { accountStatus?: string | null };

function resolveAccountStatusLabel(accountStatus: string | null | undefined, t: ProfileParentLabels): string {
  const normalized = (accountStatus ?? AccountStatus.Activated).toLowerCase();
  if (normalized === "activated" || normalized === "deactivated") {
    return t.accountStatus[normalized];
  }
  return t.accountStatus.activated;
}

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly labels: ParentSectionLabelsBundle;
      readonly scope?: ProfileScope;
      readonly parentData: AccountParentData;
      readonly avatarUrl?: string | null;
      readonly displayCurrency: CurrencyCode | null | undefined;
      readonly adminData?: ParentAdminData | null;
    }
  | {
      readonly mode: "edit";
      readonly labels: ParentSectionLabelsBundle;
      readonly scope?: ProfileScope;
      readonly parentData: AccountParentData;
      readonly register: UseFormRegister<ParentAccountFormFields>;
      readonly control: Control<ParentAccountFormFields>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = props.labels.parent;
  const { baseLabels } = props.labels;
  const tBase = useAppTranslation(Translation.Profile.Base);
  const { canView, canEditStatus, canAdminResetPassword } = useProfileFieldAccess({ scope: props.scope });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const { resetPassword, loading: resetLoading } = useAdminResetPassword(
    tBase.adminResetPassword.success,
    tBase.adminResetPassword.error
  );

  if (props.mode === "edit") {
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
            <Stack spacing={2}>
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
            </Stack>
          ) : null
        }
      />
    );
  }

  const accountStatusRaw = props.adminData && "accountStatus" in props.adminData ? props.adminData.accountStatus : null;
  const accountStatus = accountStatusRaw ?? null;
  const accountStatusContent =
    canView("parent_account") && accountStatus ? (
      <InfoField
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
    <Stack>
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
              <InfoField
                label={tBase.adminResetPassword.title}
                value={
                  <IconButton
                    onClick={() => setResetPasswordOpen(true)}
                    sx={theme => ({ color: theme.palette.primary.main })}
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
    </Stack>
  );
}
