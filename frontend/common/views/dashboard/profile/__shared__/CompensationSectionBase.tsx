"use client";

import { InputAdornment, Stack, TextField } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import type { Control, FieldPath, FieldValues, UseFormRegister } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { type CurrencyOption, getCurrencyByCode, getCurrencySymbol } from "@/frontend/common/lib/currency";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { InfoField } from "@/frontend/common/views/dashboard/profile/teacher/sections/InfoField";

export interface CompensationViewData {
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: CurrencyCode | null;
  readonly displayAmount?: {
    readonly amount?: string | null;
    readonly currency?: CurrencyCode | null;
    readonly stale?: boolean | null;
  } | null;
}

export function CompensationEditFields<TFormValues extends FieldValues>({
  register,
  control,
  translationNamespace,
}: {
  readonly register: UseFormRegister<TFormValues>;
  readonly control: Control<TFormValues>;
  readonly translationNamespace: string;
}) {
  const t = useTranslations(translationNamespace);
  const rateCurrency = useWatch({ control, name: "rateCurrency" as FieldPath<TFormValues> });
  const currencySymbol = getCurrencySymbol(rateCurrency ?? CurrencyCode.Usd);

  const rateCurrencyName = "rateCurrency" as FieldPath<TFormValues>;

  return (
    <SectionPanel title={t("sections.compensation")}>
      <Stack spacing={2}>
        <TextField
          label={t("fields.hourlyRate")}
          fullWidth
          size="small"
          {...register("hourlyRate" as FieldPath<TFormValues>)}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
            },
          }}
        />
        <Controller
          name={rateCurrencyName}
          control={control}
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
      </Stack>
    </SectionPanel>
  );
}

export function CompensationViewSection({
  profileData,
  subjectUserId,
  translationNamespace,
}: {
  readonly profileData: CompensationViewData;
  readonly subjectUserId?: string;
  readonly translationNamespace: string;
}) {
  const t = useTranslations(translationNamespace);
  const tProfile = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const lockedAmount = profileData.hourlyRate ?? "0";
  const lockedCurrency = profileData.rateCurrency ?? CurrencyCode.Usd;
  const displayAmount = profileData.displayAmount;
  const salaryLabel = formatCurrencyForDisplay(
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
    buildFxDisplayMessages(tProfile, tErrors)
  );

  return (
    <SectionPanel title={t("sections.compensation")}>
      {subjectUserId ? <DisplayCurrencyHint mode="subject" subjectUserId={subjectUserId} /> : null}
      <Stack spacing={2}>
        <InfoField label={t("fields.hourlyRate")} value={salaryLabel} />
      </Stack>
    </SectionPanel>
  );
}
