"use client";

import { InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { CurrencyCode, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode, getCurrencySymbol } from "@/frontend/lib/currency";
import { InfoField } from "@/frontend/views/dashboard/profile/teacher/sections/InfoField";
import type { TeacherViewData } from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherAdminEditFormData } from "@/frontend/views/dashboard/profile/teacher/teacherProfileFormTypes";

type CompensationSectionProps =
  | {
      readonly mode: "view";
      readonly teacherData: TeacherViewData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
      readonly control: Control<TeacherAdminEditFormData>;
    };

function formatPaymentMethod(method: string | null | undefined, fallback: string): string {
  if (!method) {
    return fallback;
  }
  if (method === PaymentMethod.Paypal) {
    return "PayPal";
  }
  if (method === PaymentMethod.BankAccount) {
    return "Bank Account";
  }
  return method;
}

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
        <TextField label={t("fields.paymentMethod")} fullWidth size="small" select {...register("paymentMethod")}>
          <MenuItem value={PaymentMethod.Paypal}>PayPal</MenuItem>
          <MenuItem value={PaymentMethod.BankAccount}>Bank Account</MenuItem>
        </TextField>
      </Stack>
    </SectionPanel>
  );
}

export function CompensationSection(props: CompensationSectionProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return <CompensationEditSection register={props.register} control={props.control} />;
  }

  const salaryLabel = t("baseSalary", {
    amount: props.teacherData.hourlyRate ?? "0",
    currency: props.teacherData.rateCurrency ?? CurrencyCode.Usd,
  });

  return (
    <SectionPanel title={t("sections.compensation")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.hourlyRate")} value={salaryLabel} />
        <InfoField
          label={t("fields.paymentMethod")}
          value={formatPaymentMethod(props.teacherData.paymentMethod, tc("notSet"))}
        />
      </Stack>
    </SectionPanel>
  );
}
