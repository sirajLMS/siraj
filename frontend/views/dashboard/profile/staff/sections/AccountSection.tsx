"use client";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { CurrencyDisplay } from "@/frontend/components/ui/display/currencyDisplay/CurrencyDisplay";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { AccountStatus, type CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/lib/currency";
import { InfoField } from "@/frontend/views/dashboard/profile/parent/sections/InfoField";
import type { StaffProfileData } from "@/frontend/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffAdminEditFormData } from "@/frontend/views/dashboard/profile/staff/staffProfileFormTypes";

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly staffData: StaffProfileData;
      readonly isAdminScope: boolean;
      readonly displayCurrency: CurrencyCode | null | undefined;
    }
  | {
      readonly mode: "edit";
      readonly staffData: StaffProfileData;
      readonly isAdminScope: boolean;
      readonly register: UseFormRegister<StaffAdminEditFormData>;
      readonly control: Control<StaffAdminEditFormData>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = useTranslations("profile.staff");
  const tc = useTranslations("profile");

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
          <Controller
            name="displayCurrency"
            control={props.control}
            render={({ field, fieldState }) => {
              const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
              return (
                <CurrencySelect
                  currency={option}
                  setCurrencyAction={selected => {
                    field.onChange(selected.code);
                  }}
                  onBlurAction={field.onBlur}
                  label={t("fields.displayCurrency")}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              );
            }}
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

  const statusLabel =
    props.staffData.status === AccountStatus.Activated ? t("fields.statusActive") : t("fields.statusInactive");

  return (
    <SectionPanel title={t("sections.account")}>
      <Stack spacing={1.5}>
        <InfoField
          label={t("fields.displayCurrency")}
          value={<CurrencyDisplay code={props.displayCurrency} fallback={tc("notSet")} />}
        />
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
