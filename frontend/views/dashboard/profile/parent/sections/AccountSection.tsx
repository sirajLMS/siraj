"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel, StatusBadge, UserAvatar } from "@/frontend/components/ui";
import { CurrencyDisplay } from "@/frontend/components/ui/display/currencyDisplay/CurrencyDisplay";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { AccountStatus, type CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/lib/currency";
import { InfoField } from "@/frontend/views/dashboard/profile/parent/sections/InfoField";
import {
  type ParentAdminData,
  type ParentViewData,
  toDisplayValue,
} from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";

type ParentAccountFormFields = {
  name: string;
  email: string;
  displayCurrency?: CurrencyCode | null;
};

type AccountParentData = Pick<ParentViewData, "name" | "email">;

function resolveAccountStatusLabel(
  accountStatus: string | null | undefined,
  t: ReturnType<typeof useTranslations<"profile.parent">>
): string {
  const normalized = (accountStatus ?? AccountStatus.Activated).toLowerCase();
  return t(`accountStatus.${normalized as "activated" | "deactivated"}`);
}

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly parentData: AccountParentData;
      readonly avatarUrl?: string | null;
      readonly displayCurrency: CurrencyCode | null | undefined;
      readonly adminData?: ParentAdminData | null;
    }
  | {
      readonly mode: "edit";
      readonly parentData: AccountParentData;
      readonly avatarUrl?: string | null;
      readonly register: UseFormRegister<ParentAccountFormFields>;
      readonly control: Control<ParentAccountFormFields>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.account")}>
        <Stack spacing={2}>
          <UserAvatar src={props.avatarUrl} label={props.parentData.name ?? t("fields.fullName")} size={64} />
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

  const accountStatusRaw = props.adminData && "accountStatus" in props.adminData ? props.adminData.accountStatus : null;
  const accountStatus = accountStatusRaw ? String(accountStatusRaw) : null;

  return (
    <SectionPanel title={t("sections.account")}>
      <Stack spacing={2}>
        <UserAvatar src={props.avatarUrl} label={props.parentData.name ?? t("fields.fullName")} size={64} />
        <InfoField label={t("fields.fullName")} value={toDisplayValue(props.parentData.name, tc("notSet"))} />
        <InfoField label={t("fields.primaryEmail")} value={toDisplayValue(props.parentData.email, tc("notSet"))} />
        <InfoField
          label={t("fields.displayCurrency")}
          value={<CurrencyDisplay code={props.displayCurrency} fallback={tc("notSet")} />}
        />
        {accountStatus ? (
          <InfoField
            label={t("fields.accountStatus")}
            value={
              <StatusBadge
                category="staffAccount"
                status={accountStatus.toLowerCase()}
                label={resolveAccountStatusLabel(accountStatus, t)}
                size="small"
              />
            }
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
