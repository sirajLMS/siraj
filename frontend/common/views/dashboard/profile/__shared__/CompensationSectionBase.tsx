"use client";

import { InputAdornment, Stack, TextField } from "@mui/material";
import { type Control, type FieldPath, type FieldValues, type UseFormRegister, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { getCurrencySymbol } from "@/frontend/common/lib/currency";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
import { InfoField } from "@/frontend/common/views/dashboard/profile/shared/sections/InfoField";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { ProfileLabels, ProfileStaffLabels, ProfileTeacherLabels } from "@/shared/locale/types/profile";

export interface CompensationViewData {
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: CurrencyCode | null;
  readonly displayAmount?: {
    readonly amount?: string | null;
    readonly currency?: CurrencyCode | null;
    readonly stale?: boolean | null;
  } | null;
}

type CompensationTranslations = ProfileTeacherLabels | ProfileStaffLabels;

/**
 * Type guard: narrows a string to a `FieldPath<TFormValues>` for react-hook-form.
 * `FieldPath<T>` is a deep path type that TypeScript cannot verify from an arbitrary
 * string, so a type guard is used instead of an unsafe `as` assertion.
 */
function isFieldPath<TFormValues extends FieldValues>(value: string): value is FieldPath<TFormValues> {
  return typeof value === "string";
}

/**
 * Wraps a form field name for use with react-hook-form's `useWatch` / `register` / `Controller`.
 * Uses the `isFieldPath` type guard to avoid unsafe type assertions.
 */
function fieldPath<TFormValues extends FieldValues>(name: string): FieldPath<TFormValues> {
  if (!isFieldPath<TFormValues>(name)) {
    throw new Error(`Invalid field path: ${name}`);
  }
  return name;
}

export function CompensationEditFields<TFormValues extends FieldValues>({
  register,
  control,
  translations,
}: {
  readonly register: UseFormRegister<TFormValues>;
  readonly control: Control<TFormValues>;
  readonly translations: CompensationTranslations;
}) {
  const t = translations;
  const rateCurrency = useWatch({ control, name: fieldPath<TFormValues>("rateCurrency") });
  const currencySymbol = getCurrencySymbol(rateCurrency ?? CurrencyCode.Usd);

  const rateCurrencyName = fieldPath<TFormValues>("rateCurrency");

  return (
    <SectionPanel title={t.sections.compensation}>
      <Stack spacing={2}>
        <TextField
          label={t.fields.hourlyRate}
          fullWidth
          size="small"
          {...register(fieldPath<TFormValues>("hourlyRate"))}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
            },
          }}
        />
        <CurrencyControllerField control={control} name={rateCurrencyName} label={t.fields.currency} />
      </Stack>
    </SectionPanel>
  );
}

export function CompensationViewSection({
  profileData,
  subjectUserId,
  translations,
  baseLabels,
  errorLabels,
}: {
  readonly profileData: CompensationViewData;
  readonly subjectUserId?: string;
  readonly translations: CompensationTranslations;
  readonly baseLabels?: Pick<ProfileLabels, "convertedAmount" | "convertedTotalApprox">;
  readonly errorLabels?: ErrorsLabels;
}) {
  const t = translations;
  const fallbackBase = useAppTranslation(Translation.Profile.Base);
  const fallbackErrors = useAppTranslation(Translation.Errors);
  const resolvedBaseLabels = baseLabels ?? fallbackBase;
  const resolvedErrorLabels = errorLabels ?? fallbackErrors;
  const locale = useAppLocale();

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
    buildFxDisplayMessages(
      {
        convertedAmount: resolvedBaseLabels.convertedAmount,
      },
      resolvedErrorLabels,
      {
        convertedTotalApprox: resolvedBaseLabels.convertedTotalApprox,
      }
    )
  );

  return (
    <SectionPanel title={t.sections.compensation}>
      {subjectUserId ? <DisplayCurrencyHint mode="subject" subjectUserId={subjectUserId} /> : null}
      <Stack spacing={2}>
        <InfoField label={t.fields.hourlyRate} value={salaryLabel} />
      </Stack>
    </SectionPanel>
  );
}
