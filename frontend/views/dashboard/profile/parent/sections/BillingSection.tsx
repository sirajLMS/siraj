"use client";

import { Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { CurrencyDisplay } from "@/frontend/components/ui/display/currencyDisplay/CurrencyDisplay";
import { TimezoneDisplay } from "@/frontend/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/lib/currency";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import type { ParentAdminEditFormData } from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";
import { InfoField } from "@/frontend/views/dashboard/profile/parent/sections/InfoField";
import {
  type ParentAdminData,
  toDisplayValue,
} from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";

type BillingSectionProps =
  | {
      readonly mode: "view";
      readonly adminData: ParentAdminData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
      readonly control: Control<ParentAdminEditFormData>;
    };

export function BillingSection(props: BillingSectionProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.billing")}>
        <Stack spacing={2.5}>
          <TextField label={t("fields.invoiceType")} fullWidth size="small" {...props.register("invoiceType")} />
          <TextField label={t("fields.feeAmount")} fullWidth size="small" {...props.register("feeAmount")} />
          <Controller
            name="currency"
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
                  label={t("fields.currency")}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              );
            }}
          />
          <Controller
            name="timezone"
            control={props.control}
            render={({ field, fieldState }) => (
              <TimezoneSelect
                value={field.value ? toGraphqlIanaTimezone(field.value) : null}
                onChangeAction={value => {
                  field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
                }}
                onBlurAction={field.onBlur}
                label={t("fields.timezone")}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.billing")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.invoiceType")} value={toDisplayValue(props.adminData.invoiceType, tc("notSet"))} />
        <InfoField label={t("fields.feeAmount")} value={toDisplayValue(props.adminData.feeAmount, tc("notSet"))} />
        <InfoField
          label={t("fields.currency")}
          value={<CurrencyDisplay code={props.adminData.currency} fallback={tc("notSet")} />}
        />
        <InfoField
          label={t("fields.timezone")}
          value={<TimezoneDisplay timezone={props.adminData.timezone} fallback={tc("notSet")} />}
        />
        <Stack spacing={0.5}>
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
            {t("fields.status")}
          </Typography>
          <StatusBadge
            category="studentAccount"
            status={(props.adminData.status ?? "REGULAR").toLowerCase()}
            label={t(`status.${(props.adminData.status ?? "REGULAR").toLowerCase()}`)}
          />
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
