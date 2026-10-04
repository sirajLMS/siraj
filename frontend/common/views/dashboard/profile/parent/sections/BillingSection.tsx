"use client";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { type Control, Controller, type UseFormRegister } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { CurrencyDisplay } from "@/frontend/common/components/ui/display/currencyDisplay";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField";
import { CurrencyCode, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import {
  isLifecycleStatusKey,
  resolveLifecycleStatus,
} from "@/frontend/common/views/dashboard/profile/parent/sections/billingSection.helpers";
import {
  type ParentAdminData,
  type ParentBillingViewLabels,
  type ParentSectionLabels,
  toDisplayValue,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
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
            <TextField
              {...field}
              select
              label={t.fields.lifecycleStatus}
              value={field.value ?? ParentStatus.Regular}
              fullWidth
              size="small"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            >
              <MenuItem value={ParentStatus.Regular}>{t.status.regular}</MenuItem>
              <MenuItem value={ParentStatus.OnTrial}>{t.status.on_trial}</MenuItem>
              <MenuItem value={ParentStatus.OnLeave}>{t.status.on_leave}</MenuItem>
              <MenuItem value={ParentStatus.Suspended}>{t.status.suspended}</MenuItem>
            </TextField>
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
        <LabeledField label={t.fields.invoiceType} value={toDisplayValue(adminData.invoiceType, tc.notSet)} />
        <LabeledField label={t.fields.feeAmount} value={feeLabel} />
        <LabeledField
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
              <Link href={`/parents/${parentId}/lifecycle`} style={{ textDecoration: "none" }}>
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}>
                  {t.actions.manageLifecycle}
                </Typography>
              </Link>
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
