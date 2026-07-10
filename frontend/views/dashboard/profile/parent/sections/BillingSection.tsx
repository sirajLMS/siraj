"use client";

import { Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { TimezoneDisplay } from "@/frontend/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
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
          <TextField label={t("fields.paymentMethod")} fullWidth size="small" {...props.register("paymentMethod")} />
          <Controller
            name="currency"
            control={props.control}
            render={({ field }) => {
              const option: CurrencyOption | null = field.value
                ? (getCurrencyByCode(field.value as CurrencyCode) ?? null)
                : null;
              return (
                <CurrencySelect
                  currency={option}
                  setCurrencyAction={selected => {
                    field.onChange(selected.code as string);
                  }}
                  onBlurAction={field.onBlur}
                  label={t("fields.currency")}
                  fullWidth
                />
              );
            }}
          />
          <Controller
            name="timezone"
            control={props.control}
            render={({ field }) => (
              <TimezoneSelect
                value={field.value ? toGraphqlIanaTimezone(field.value) : null}
                onChangeAction={value => {
                  field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
                }}
                onBlurAction={field.onBlur}
                label={t("fields.timezone")}
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
          label={t("fields.paymentMethod")}
          value={toDisplayValue(props.adminData.paymentMethod, tc("notSet"))}
        />
        <InfoField label={t("fields.currency")} value={toDisplayValue(props.adminData.currency, tc("notSet"))} />
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
