"use client";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { StaffProfileData } from "@/frontend/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/views/dashboard/profile/staff/staffProfileFormTypes";

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly staffData: StaffProfileData;
      readonly isAdminScope: boolean;
    }
  | {
      readonly mode: "edit";
      readonly staffData: StaffProfileData;
      readonly isAdminScope: boolean;
      readonly register: UseFormRegister<StaffAdminEditFormData>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = useTranslations("profile.staff");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.account")}>
        <Stack spacing={2}>
          <TextField label={t("fields.fullName")} fullWidth size="small" {...props.register("name")} />
          <TextField
            label={t("fields.primaryEmail")}
            fullWidth
            size="small"
            type="email"
            {...props.register("email")}
          />
          {props.isAdminScope ? (
            <TextField label={t("fields.status")} fullWidth size="small" select {...props.register("status")}>
              <MenuItem value={AccountStatus.Activated}>{t("fields.statusActive")}</MenuItem>
              <MenuItem value={AccountStatus.Deactivated}>{t("fields.statusInactive")}</MenuItem>
            </TextField>
          ) : null}
        </Stack>
      </SectionPanel>
    );
  }

  if (!props.isAdminScope) {
    return null;
  }

  const statusLabel =
    props.staffData.status === AccountStatus.Activated ? t("fields.statusActive") : t("fields.statusInactive");

  return (
    <SectionPanel title={t("sections.account")}>
      <Stack spacing={1.5}>
        <Stack spacing={0.25}>
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
            {t("fields.status")}
          </Typography>
          <StatusBadge
            category="staffAccount"
            status={(props.staffData.status ?? AccountStatus.Activated).toLowerCase()}
            label={statusLabel}
            size="small"
          />
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
