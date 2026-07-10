"use client";

import { InputAdornment, Stack, TextField } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/lib/buildFxDisplayMessages";
import { type CurrencyOption, getCurrencyByCode, getCurrencySymbol } from "@/frontend/lib/currency";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { InfoField } from "@/frontend/views/dashboard/profile/teacher/sections/InfoField";
import type { TeacherViewData } from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherAdminEditFormData } from "@/frontend/views/dashboard/profile/teacher/teacherProfileFormTypes";

type CompensationSectionProps =
  | {
      readonly mode: "view";
      readonly teacherData: TeacherViewData;
      readonly subjectUserId?: string;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
      readonly control: Control<TeacherAdminEditFormData>;
    };

function CompensationEditSection({
  register,
  control,
}: {
  readonly register: UseFormRegister<TeacherAdminEditFormData>;
  readonly control: Control<TeacherAdminEditFormData>;
}) {
  const t = useTranslations("profile.teacher");
  const rateCurrency = useWatch({ control, name: "rateCurrency" });
  const currencySymbol = getCurrencySymbol(rateCurrency ?? CurrencyCode.Usd);

  return (
    <SectionPanel title={t("sections.compensation")}>
      <Stack spacing={2}>
        <TextField
          label={t("fields.hourlyRate")}
          fullWidth
          size="small"
          {...register("hourlyRate")}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
            },
          }}
        />
        <Controller
          name="rateCurrency"
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

export function CompensationSection(props: CompensationSectionProps) {
  const t = useTranslations("profile.teacher");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  if (props.mode === "edit") {
    return <CompensationEditSection register={props.register} control={props.control} />;
  }

  const lockedAmount = props.teacherData.hourlyRate ?? "0";
  const lockedCurrency = props.teacherData.rateCurrency ?? CurrencyCode.Usd;
  const displayAmount = props.teacherData.displayAmount;
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
    buildFxDisplayMessages(t, tErrors)
  );

  return (
    <SectionPanel title={t("sections.compensation")}>
      {props.subjectUserId ? <DisplayCurrencyHint mode="subject" subjectUserId={props.subjectUserId} /> : null}
      <Stack spacing={2}>
        <InfoField label={t("fields.hourlyRate")} value={salaryLabel} />
      </Stack>
    </SectionPanel>
  );
}
