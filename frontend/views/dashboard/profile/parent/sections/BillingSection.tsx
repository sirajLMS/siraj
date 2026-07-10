"use client";

import { MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { CurrencyDisplay } from "@/frontend/components/ui/display/currencyDisplay/CurrencyDisplay";
import { TimezoneDisplay } from "@/frontend/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import { CurrencyCode, ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/lib/buildFxDisplayMessages";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/lib/currency";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import type { ParentAdminEditFormData } from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";
import { InfoField } from "@/frontend/views/dashboard/profile/parent/sections/InfoField";
import {
  type ParentAdminData,
  toDisplayValue,
} from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";
import { Link } from "@/shared/i18n/routing";

type BillingSectionProps =
  | {
      readonly mode: "view";
      readonly adminData: ParentAdminData;
      readonly parentId?: string | null;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
      readonly control: Control<ParentAdminEditFormData>;
    };

function resolveLifecycleStatus(adminData: ParentAdminData): string {
  const raw =
    "lifecycleStatus" in adminData && adminData.lifecycleStatus
      ? adminData.lifecycleStatus
      : "status" in adminData
        ? adminData.status
        : "REGULAR";
  return String(raw ?? "REGULAR").toLowerCase();
}

export function BillingSection(props: BillingSectionProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.billing")}>
        <Stack spacing={2.5}>
          <Controller
            name="lifecycleStatus"
            control={props.control}
            render={({ field, fieldState }) => (
              <Stack spacing={0.5}>
                <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
                  {t("fields.lifecycleStatus")}
                </Typography>
                <Select
                  {...field}
                  value={field.value ?? ParentStatus.Regular}
                  fullWidth
                  size="small"
                  error={Boolean(fieldState.error)}
                >
                  <MenuItem value={ParentStatus.Regular}>{t("status.regular")}</MenuItem>
                  <MenuItem value={ParentStatus.OnTrial}>{t("status.on_trial")}</MenuItem>
                  <MenuItem value={ParentStatus.OnLeave}>{t("status.on_leave")}</MenuItem>
                  <MenuItem value={ParentStatus.Suspended}>{t("status.suspended")}</MenuItem>
                </Select>
              </Stack>
            )}
          />
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

  const lockedAmount = props.adminData.feeAmount ?? "0";
  const lockedCurrency = props.adminData.currency ?? CurrencyCode.Usd;
  const displayAmount = props.adminData.displayAmount;
  const feeLabel = formatCurrencyForDisplay(
    lockedAmount,
    lockedCurrency,
    displayAmount
      ? {
          amount: displayAmount.amount,
          currency: displayAmount.currency ?? lockedCurrency,
          stale: displayAmount.stale ?? true,
        }
      : null,
    locale,
    buildFxDisplayMessages(t, tErrors)
  );

  const lifecycleStatus = resolveLifecycleStatus(props.adminData);

  return (
    <SectionPanel title={t("sections.billing")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.invoiceType")} value={toDisplayValue(props.adminData.invoiceType, tc("notSet"))} />
        <InfoField label={t("fields.feeAmount")} value={feeLabel} />
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
            {t("fields.lifecycleStatus")}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge category="studentAccount" status={lifecycleStatus} label={t(`status.${lifecycleStatus}`)} />
            {props.parentId ? (
              <Typography
                component={Link}
                href={`/parents/${props.parentId}/lifecycle`}
                variant="labelMd"
                sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}
              >
                {t("actions.manageLifecycle")}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
