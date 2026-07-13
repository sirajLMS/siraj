"use client";

import { MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { CurrencyDisplay } from "@/frontend/components/ui/display/currencyDisplay/CurrencyDisplay";
import { TimezoneDisplay } from "@/frontend/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import { CurrencyCode, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import type { ParentAdminEditFormData } from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";
import { InfoField } from "@/frontend/views/dashboard/profile/parent/sections/InfoField";
import {
  type ParentAdminData,
  toDisplayValue,
} from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";
import { CurrencyControllerField } from "@/frontend/views/dashboard/profile/shared/CurrencyControllerField";
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

function BillingEditSection({
  register,
  control,
}: {
  readonly register: UseFormRegister<ParentAdminEditFormData>;
  readonly control: Control<ParentAdminEditFormData>;
}) {
  const t = useTranslations("profile.parent");

  return (
    <SectionPanel title={t("sections.billing")}>
      <Stack spacing={2.5}>
        <Controller
          name="lifecycleStatus"
          control={control}
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
        <TextField label={t("fields.invoiceType")} fullWidth size="small" {...register("invoiceType")} />
        <TextField label={t("fields.feeAmount")} fullWidth size="small" {...register("feeAmount")} />
        <CurrencyControllerField control={control} name="currency" label={t("fields.currency")} />
        <Controller
          name="timezone"
          control={control}
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

function BillingViewSection({
  adminData,
  parentId,
}: {
  readonly adminData: ParentAdminData;
  readonly parentId?: string | null;
}) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const lockedAmount = adminData.feeAmount ?? "0";
  const lockedCurrency = adminData.currency ?? CurrencyCode.Usd;
  const displayAmount = adminData.displayAmount;
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

  const lifecycleStatus = resolveLifecycleStatus(adminData);

  return (
    <SectionPanel title={t("sections.billing")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.invoiceType")} value={toDisplayValue(adminData.invoiceType, tc("notSet"))} />
        <InfoField label={t("fields.feeAmount")} value={feeLabel} />
        <InfoField
          label={t("fields.currency")}
          value={<CurrencyDisplay code={adminData.currency} fallback={tc("notSet")} />}
        />
        <InfoField
          label={t("fields.timezone")}
          value={<TimezoneDisplay timezone={adminData.timezone} fallback={tc("notSet")} />}
        />
        <Stack spacing={0.5}>
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
            {t("fields.lifecycleStatus")}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge category="studentAccount" status={lifecycleStatus} label={t(`status.${lifecycleStatus}`)} />
            {parentId ? (
              <Typography
                component={Link}
                href={`/parents/${parentId}/lifecycle`}
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

export function BillingSection(props: BillingSectionProps) {
  if (props.mode === "edit") {
    return <BillingEditSection register={props.register} control={props.control} />;
  }

  return <BillingViewSection adminData={props.adminData} parentId={props.parentId} />;
}
