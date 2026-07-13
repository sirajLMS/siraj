"use client";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { AccountStatus, type CurrencyCode, type ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CoreIdentitySection } from "@/frontend/views/dashboard/profile/shared/sections/CoreIdentitySection";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";
import type { StaffProfileData } from "@/frontend/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/views/dashboard/profile/staff/staffProfileFormTypes";

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly scope?: ProfileScope;
      readonly staffData: StaffProfileData;
      readonly isAdminScope: boolean;
      readonly displayCurrency: CurrencyCode | null | undefined;
    }
  | {
      readonly mode: "edit";
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
  const t = useTranslations("profile.staff");
  const { canView, canEdit } = useProfileFieldAccess({ scope: props.scope });

  if (props.mode === "edit") {
    return (
      <Stack spacing={2}>
        <CoreIdentitySection
          mode="edit"
          scope={props.scope}
          name={props.staffData.name}
          sectionTitle={t("sections.account")}
          nameLabel={t("fields.fullName")}
          emailLabel={t("fields.primaryEmail")}
          currencyLabel={t("fields.displayCurrency")}
          register={props.register}
          control={props.control}
        />
        {props.isAdminScope && canEdit("staff_role") ? (
          <SectionPanel title={t("sections.role")}>
            <TextField label={t("fields.status")} fullWidth size="small" select {...props.register("status")}>
              <MenuItem value={AccountStatus.Activated}>{t("fields.statusActive")}</MenuItem>
              <MenuItem value={AccountStatus.Deactivated}>{t("fields.statusInactive")}</MenuItem>
            </TextField>
          </SectionPanel>
        ) : null}
      </Stack>
    );
  }

  const statusLabel =
    props.staffData.status === AccountStatus.Activated ? t("fields.statusActive") : t("fields.statusInactive");
  const roleStatusContent =
    props.isAdminScope && canView("staff_role") ? (
      <StaffRoleStatusView
        status={(props.staffData.status ?? AccountStatus.Activated).toLowerCase()}
        statusLabel={statusLabel}
        statusFieldLabel={t("fields.status")}
      />
    ) : null;

  return (
    <CoreIdentitySection
      mode="view"
      scope={props.scope}
      name={props.staffData.name}
      email={props.staffData.email}
      displayCurrency={props.displayCurrency}
      sectionTitle={t("sections.account")}
      nameLabel={t("fields.fullName")}
      emailLabel={t("fields.primaryEmail")}
      currencyLabel={t("fields.displayCurrency")}
      additionalViewContent={roleStatusContent ?? undefined}
    />
  );
}
