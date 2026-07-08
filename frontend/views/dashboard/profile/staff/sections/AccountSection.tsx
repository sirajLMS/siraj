"use client";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel, StatusBadge, UserAvatar } from "@/frontend/components/ui";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { InfoField } from "../../parent/sections/InfoField";
import type { StaffAdminEditFormData } from "../staffProfileFormTypes";
import { type StaffProfileData, toDisplayValue } from "./staffProfileTypes";

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly staffData: StaffProfileData;
      readonly avatarUrl?: string | null;
      readonly isAdminScope: boolean;
    }
  | {
      readonly mode: "edit";
      readonly staffData: StaffProfileData;
      readonly avatarUrl?: string | null;
      readonly isAdminScope: boolean;
      readonly register: UseFormRegister<StaffAdminEditFormData>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = useTranslations("profile.staff");
  const tc = useTranslations("profile");

  const statusLabel =
    props.mode === "view" && props.isAdminScope && props.staffData.status
      ? props.staffData.status === AccountStatus.Activated
        ? t("fields.statusActive")
        : t("fields.statusInactive")
      : "";

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.account")}>
        <Stack spacing={2}>
          <UserAvatar src={props.avatarUrl} label={props.staffData.name ?? t("fields.fullName")} size={64} />
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

  return (
    <SectionPanel title={t("sections.account")}>
      <Stack spacing={2}>
        <UserAvatar src={props.avatarUrl} label={props.staffData.name ?? t("fields.fullName")} size={64} />
        <InfoField label={t("fields.fullName")} value={toDisplayValue(props.staffData.name, tc("notSet"))} />
        <InfoField label={t("fields.primaryEmail")} value={toDisplayValue(props.staffData.email, tc("notSet"))} />
        {props.isAdminScope ? (
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
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
