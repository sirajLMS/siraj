"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel, UserAvatar } from "@/frontend/components/ui";
import { CurrencyDisplay } from "@/frontend/components/ui/display/currencyDisplay/CurrencyDisplay";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/lib/currency";
import { InfoField } from "@/frontend/views/dashboard/profile/teacher/sections/InfoField";
import {
  type TeacherViewData,
  toDisplayValue,
} from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";

type TeacherAccountFormFields = {
  name: string;
  email: string;
  displayCurrency?: CurrencyCode | null;
};

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly teacherData: Pick<TeacherViewData, "name" | "email">;
      readonly avatarUrl?: string | null;
      readonly displayCurrency: CurrencyCode | null | undefined;
    }
  | {
      readonly mode: "edit";
      readonly teacherData: Pick<TeacherViewData, "name" | "email">;
      readonly avatarUrl?: string | null;
      readonly register: UseFormRegister<TeacherAccountFormFields>;
      readonly control: Control<TeacherAccountFormFields>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.account")}>
        <Stack spacing={2}>
          <UserAvatar src={props.avatarUrl} label={props.teacherData.name ?? t("fields.fullName")} size={64} />
          <TextField label={t("fields.fullName")} fullWidth size="small" {...props.register("name")} />
          <TextField
            label={t("fields.primaryEmail")}
            fullWidth
            size="small"
            type="email"
            {...props.register("email")}
          />
          <Controller
            name="displayCurrency"
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
                  label={t("fields.displayCurrency")}
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

  return (
    <SectionPanel title={t("sections.account")}>
      <Stack spacing={2}>
        <UserAvatar src={props.avatarUrl} label={props.teacherData.name ?? t("fields.fullName")} size={64} />
        <InfoField label={t("fields.fullName")} value={toDisplayValue(props.teacherData.name, tc("notSet"))} />
        <InfoField label={t("fields.primaryEmail")} value={toDisplayValue(props.teacherData.email, tc("notSet"))} />
        <InfoField
          label={t("fields.displayCurrency")}
          value={<CurrencyDisplay code={props.displayCurrency} fallback={tc("notSet")} />}
        />
      </Stack>
    </SectionPanel>
  );
}
