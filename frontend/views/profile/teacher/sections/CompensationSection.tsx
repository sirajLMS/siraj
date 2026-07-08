"use client";

import { MenuItem, Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherAdminEditFormData } from "../teacherProfileFormTypes";
import { InfoField } from "./InfoField";
import type { TeacherViewData } from "./teacherProfileTypes";

type CompensationSectionProps =
  | {
      readonly mode: "view";
      readonly teacherData: TeacherViewData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
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

export function CompensationSection(props: CompensationSectionProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.compensation")}>
        <Stack spacing={2}>
          <TextField label={t("fields.hourlyRate")} fullWidth size="small" {...props.register("hourlyRate")} />
          <TextField label={t("fields.currency")} fullWidth size="small" {...props.register("rateCurrency")} />
          <TextField
            label={t("fields.paymentMethod")}
            fullWidth
            size="small"
            select
            {...props.register("paymentMethod")}
          >
            <MenuItem value={PaymentMethod.Paypal}>PayPal</MenuItem>
            <MenuItem value={PaymentMethod.BankAccount}>Bank Account</MenuItem>
          </TextField>
        </Stack>
      </SectionPanel>
    );
  }

  const salaryLabel = t("baseSalary", {
    amount: props.teacherData.hourlyRate ?? "0",
    currency: props.teacherData.rateCurrency ?? "USD",
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
