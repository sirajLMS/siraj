"use client";

import { MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import type { Control, UseFormRegister } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { AccountStatus, type CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { InfoField } from "@/frontend/common/views/dashboard/profile/components/__shared__/infoFieldShared";
import { ResetPasswordDialog } from "@/frontend/common/views/dashboard/profile/shared/ResetPasswordDialog";
import { CoreIdentitySection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreIdentitySection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type {
  StaffProfileData,
  StaffSectionLabelsBundle,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import type { ProfileScope } from "@/shared/constants/profile.enum";

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

function StaffRoleStatusView({
  status,
  statusLabel,
  statusFieldLabel,
}: {
  readonly status: string;
  readonly statusLabel: string;
  readonly statusFieldLabel: string;
}) {
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
        {statusFieldLabel}
      </Typography>
      <StatusBadge category="staffAccount" status={status} label={statusLabel} size="small" />
    </Stack>
  );
}

export function AccountSection(props: AccountSectionProps) {
  const t = props.labels.staff;
  const { baseLabels } = props.labels;
  const { canView, canEdit, canAdminResetPassword } = useProfileFieldAccess({ scope: props.scope });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

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
      <StaffRoleStatusView
        status={(props.staffData.status ?? AccountStatus.Activated).toLowerCase()}
        statusLabel={statusLabel}
        statusFieldLabel={t.fields.status}
      />
    ) : null;

  const canResetPassword = canAdminResetPassword();
  const targetUserId = props.targetUserId;
  const staffName = props.staffData.name ?? "";
  const staffEmail = props.staffData.email ?? "";

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
            {canResetPassword && targetUserId && (
              <Tooltip title={baseLabels.actions.manageLifecycle}>
                <InfoField
                  label={baseLabels.actions.manageLifecycle}
                  value={
                    <ResetPasswordDialog
                      open={resetPasswordOpen}
                      onClose={() => setResetPasswordOpen(false)}
                      userName={staffName}
                      userEmail={staffEmail}
                      isLoading={false}
                      sendEmail={sendEmail}
                      setSendEmail={setSendEmail}
                      onConfirm={() => setResetPasswordOpen(false)}
                    />
                  }
                />
              </Tooltip>
            )}
          </Stack>
        }
      />
      {canResetPassword && targetUserId && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          userName={staffName}
          userEmail={staffEmail}
          isLoading={false}
          sendEmail={sendEmail}
          setSendEmail={setSendEmail}
          onConfirm={() => setResetPasswordOpen(false)}
        />
      )}
    </Stack>
  );
}
