"use client";

import { Box, Grid, Input, MenuItem, Select } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui/container/SectionPanel";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/lib/currency";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import type { ParentOnboardingFormData } from "@/frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { InvoiceType, PaymentMethod } from "@/frontend/views/dashboard/admin/parents/onboarding/types";

interface SectionProps {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
}

interface InvoiceFieldsProps {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
}

function InvoiceFields({ register, errors }: InvoiceFieldsProps) {
  const t = useTranslations("dashboard.parentOnboarding");
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
                $
              </Box>
            }
          />
        </FieldWrapper>
      </Grid>
    </>
  );
}

function PaymentFields({ register, control, errors }: SectionProps) {
  const t = useTranslations("dashboard.parentOnboarding");
  return (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <FieldWrapper
          label={t("fields.paymentMethod")}
          required
          error={errors.paymentMethod ? t(`validation.${errors.paymentMethod.message}`) : undefined}
        >
          <Select
            {...register("paymentMethod")}
            error={!!errors.paymentMethod}
            fullWidth
            variant="standard"
            sx={standardInputSx}
            defaultValue=""
          >
            <MenuItem value="">{t("placeholders.paymentMethod")}</MenuItem>
            <MenuItem value={PaymentMethod.BankAccount}>{t("options.paymentMethod.bankTransfer")}</MenuItem>
            <MenuItem value={PaymentMethod.Paypal}>{t("options.paymentMethod.paypal")}</MenuItem>
          </Select>
        </FieldWrapper>
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
        <InvoiceFields register={register} errors={errors} />
        <PaymentFields register={register} control={control} errors={errors} />
      </Grid>
    </SectionPanel>
  );
}
