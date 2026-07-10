"use client";

import { Box, Grid, Input, MenuItem, Select } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui/container/SectionPanel";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { PaymentMethodTypeFields } from "@/frontend/components/ui/input/paymentMethodTypeFields";
import { PaymentMethodTypeSelector } from "@/frontend/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import { CurrencyCode, PaymentDirection, PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode, getCurrencySymbol } from "@/frontend/lib/currency";
import type { PaymentMethodCatalogOption } from "@/frontend/lib/payment-method";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import { usePaymentMethodCatalogs } from "@/frontend/views/dashboard/profile/shared/payment-methods/usePaymentMethodCatalogs";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { InvoiceType } from "@/frontend/views/dashboard/admin/parents/onboarding/types";

interface SectionProps {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
}

interface InvoiceFieldsProps {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
}

function InvoiceFields({ register, control, errors }: InvoiceFieldsProps) {
  const t = useTranslations("dashboard.parentOnboarding");
  const currency = useWatch({ control, name: "currency" });
  const currencySymbol = getCurrencySymbol((currency as CurrencyCode | undefined) ?? CurrencyCode.Usd);
  return (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <FieldWrapper
          label={t("fields.invoiceType")}
          required
          error={errors.invoiceType ? t(`validation.${errors.invoiceType.message}`) : undefined}
        >
          <Select
            {...register("invoiceType")}
            error={!!errors.invoiceType}
            fullWidth
            variant="standard"
            sx={standardInputSx}
            defaultValue=""
          >
            <MenuItem value="">{t("placeholders.invoiceType")}</MenuItem>
            <MenuItem value={InvoiceType.PerClasses}>{t("options.invoiceType.perClass")}</MenuItem>
            <MenuItem value={InvoiceType.Monthly}>{t("options.invoiceType.monthly")}</MenuItem>
          </Select>
        </FieldWrapper>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FieldWrapper
          label={t("fields.feeAmount")}
          required
          error={errors.feeAmount ? t(`validation.${errors.feeAmount.message}`) : undefined}
        >
          <Input
            {...register("feeAmount")}
            placeholder={t("placeholders.feeAmount")}
            error={!!errors.feeAmount}
            fullWidth
            type="number"
            sx={standardInputSx}
            startAdornment={
              <Box
                component="span"
                sx={theme => ({
                  mr: 1,
                  fontWeight: "bold",
                  color: theme.palette.primary.main,
                  opacity: 0.6,
                })}
              >
                {currencySymbol}
              </Box>
            }
          />
        </FieldWrapper>
      </Grid>
    </>
  );
}

function PaymentFields({ control, errors }: Pick<SectionProps, "control" | "errors">) {
  const t = useTranslations("dashboard.parentOnboarding");
  const { setValue } = useFormContext<ParentOnboardingFormData>();
  const methodType = useWatch({ control, name: "payinMethod.type" }) ?? PaymentMethodType.BankTransfer;
  const { walletOptions, paymentLinkOptions, onlineAccountOptions } = usePaymentMethodCatalogs(
    PaymentDirection.Payin
  );
  const [selectedWallet, setSelectedWallet] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentMethodCatalogOption | null>(null);
  const [selectedOnlineAccount, setSelectedOnlineAccount] = useState<PaymentMethodCatalogOption | null>(null);

  return (
    <>
      <Grid size={{ xs: 12 }}>
        <Controller
          name="payinMethod.type"
          control={control}
          render={({ field }) => (
            <PaymentMethodTypeSelector
              type={field.value}
              setTypeAction={value => {
                if (value) field.onChange(value);
              }}
              required
              fullWidth
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <PaymentMethodTypeFields
          type={methodType}
          control={control}
          detailsPrefix="payinMethod.details"
          walletOptions={walletOptions}
          paymentLinkOptions={paymentLinkOptions}
          onlineAccountOptions={onlineAccountOptions}
          selectedWallet={selectedWallet}
          selectedPaymentLink={selectedPaymentLink}
          selectedOnlineAccount={selectedOnlineAccount}
          onWalletChangeAction={option => {
            setSelectedWallet(option);
            setValue("payinMethod.details.walletId", option.id);
          }}
          onPaymentLinkChangeAction={option => {
            setSelectedPaymentLink(option);
            setValue("payinMethod.details.paymentLinkId", option.id);
          }}
          onOnlineAccountChangeAction={option => {
            setSelectedOnlineAccount(option);
            setValue("payinMethod.details.onlineAccountId", option.id);
          }}
        />
        {errors.payinMethod?.type?.message ? (
          <Box sx={{ color: "error.main", typography: "bodySm", mt: 1 }}>
            {t(`validation.${errors.payinMethod.type.message}`)}
          </Box>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="currency"
          control={control}
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
                required
                error={!!errors.currency}
                helperText={errors.currency ? t(`validation.${errors.currency.message}`) : undefined}
                fullWidth
              />
            );
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="timezone"
          control={control}
          render={({ field }) => (
            <TimezoneSelect
              value={field.value ? toGraphqlIanaTimezone(field.value) : null}
              onChangeAction={value => {
                field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
              }}
              onBlurAction={field.onBlur}
              label={t("fields.timezone")}
              required
              error={!!errors.timezone}
              helperText={errors.timezone ? t(`validation.${errors.timezone.message}`) : undefined}
              fullWidth
            />
          )}
        />
      </Grid>
    </>
  );
}

export function FeesContractSection({ register, control, errors }: SectionProps) {
  const t = useTranslations("dashboard.parentOnboarding");

  return (
    <SectionPanel title={t("sections.feesContract")}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <InvoiceFields register={register} control={control} errors={errors} />
        <PaymentFields control={control} errors={errors} />
      </Grid>
    </SectionPanel>
  );
}
