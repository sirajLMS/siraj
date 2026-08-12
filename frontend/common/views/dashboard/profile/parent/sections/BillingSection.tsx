"use client";

import { MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { CurrencyDisplay } from "@/frontend/common/components/ui/display/currencyDisplay";
import { CurrencyCode, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import {
  type ParentAdminData,
  type ParentBillingViewLabels,
  type ParentSectionLabels,
  toDisplayValue,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
import { InfoField } from "@/frontend/common/views/dashboard/profile/shared/sections/InfoField";
import { Link } from "@/shared/i18n";

type BillingSectionProps =
  | {
      readonly mode: "view";
      readonly labels: ParentBillingViewLabels;
      readonly adminData: ParentAdminData;
      readonly parentId?: string | null;
    }
  | {
      readonly mode: "edit";
      readonly labels: ParentSectionLabels;
      readonly register: UseFormRegister<ParentAdminEditFormData>;
      readonly control: Control<ParentAdminEditFormData>;
    };

function resolveLifecycleStatus(adminData: ParentAdminData): string {
  let raw: string;
  if ("lifecycleStatus" in adminData && adminData.lifecycleStatus) {
    raw = adminData.lifecycleStatus;
  } else if ("accountStatus" in adminData && adminData.accountStatus) {
    raw = adminData.accountStatus;
  } else {
    raw = "REGULAR";
  }
  return raw.toLowerCase();
}

const LIFECYCLE_STATUS_KEYS = ["regular", "on_trial", "on_leave", "suspended", "deactivated"] as const;

function isLifecycleStatusKey(value: string): value is (typeof LIFECYCLE_STATUS_KEYS)[number] {
  return (LIFECYCLE_STATUS_KEYS as readonly string[]).includes(value);
}

function BillingEditSection({
  labels,
  register,
  control,
}: {
  readonly labels: ParentSectionLabels;
  readonly register: UseFormRegister<ParentAdminEditFormData>;
  readonly control: Control<ParentAdminEditFormData>;
}) {
  const t = labels;

  return (
    <SectionPanel title={t.sections.billing}>
      <Stack spacing={2.5}>
        <Controller
          name="lifecycleStatus"
          control={control}
          render={({ field, fieldState }) => (
            <Stack spacing={0.5}>
              <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
                {t.fields.lifecycleStatus}
              </Typography>
              <Select
                {...field}
                value={field.value ?? ParentStatus.Regular}
                fullWidth
                size="small"
                error={Boolean(fieldState.error)}
              >
                <MenuItem value={ParentStatus.Regular}>{t.status.regular}</MenuItem>
                <MenuItem value={ParentStatus.OnTrial}>{t.status.on_trial}</MenuItem>
                <MenuItem value={ParentStatus.OnLeave}>{t.status.on_leave}</MenuItem>
                <MenuItem value={ParentStatus.Suspended}>{t.status.suspended}</MenuItem>
              </Select>
            </Stack>
          )}
        />
        <TextField label={t.fields.invoiceType} fullWidth size="small" {...register("invoiceType")} />
        <TextField label={t.fields.feeAmount} fullWidth size="small" {...register("feeAmount")} />
        <CurrencyControllerField control={control} name="currency" label={t.fields.currency} />
      </Stack>
    </SectionPanel>
  );
}

function BillingViewSection({
  labels,
  adminData,
  parentId,
}: {
  readonly labels: ParentBillingViewLabels;
  readonly adminData: ParentAdminData;
  readonly parentId?: string | null;
}) {
  const { parent: t, base: tc, errors: tErrors } = labels;
  const locale = useAppLocale();

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
    buildFxDisplayMessages({ convertedAmount: t.convertedAmount }, tErrors, {
      convertedTotalApprox: tc.convertedTotalApprox,
    })
  );

  const lifecycleStatus = resolveLifecycleStatus(adminData);

  return (
    <SectionPanel title={t.sections.billing}>
      <Stack spacing={2}>
        <InfoField label={t.fields.invoiceType} value={toDisplayValue(adminData.invoiceType, tc.notSet)} />
        <InfoField label={t.fields.feeAmount} value={feeLabel} />
        <InfoField
          label={t.fields.currency}
          value={<CurrencyDisplay code={adminData.currency} fallback={tc.notSet} />}
        />
        <Stack spacing={0.5}>
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
            {t.fields.lifecycleStatus}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge
              category="studentAccount"
              status={lifecycleStatus}
              label={isLifecycleStatusKey(lifecycleStatus) ? t.status[lifecycleStatus] : t.status.regular}
            />
            {parentId ? (
              <Typography
                component={Link}
                href={`/parents/${parentId}/lifecycle`}
                variant="labelMd"
                sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}
              >
                {t.actions.manageLifecycle}
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
    return <BillingEditSection labels={props.labels} register={props.register} control={props.control} />;
  }

  return <BillingViewSection labels={props.labels} adminData={props.adminData} parentId={props.parentId} />;
}
