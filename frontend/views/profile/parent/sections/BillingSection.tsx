"use client";

import { Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel, StatusBadge } from "@/frontend/components/ui";
import type { ParentAdminEditFormData } from "../parentProfileFormTypes";
import { InfoField } from "./InfoField";
import { type ParentAdminData, toDisplayValue } from "./parentProfileTypes";

type BillingSectionProps =
  | {
      readonly mode: "view";
      readonly adminData: ParentAdminData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
    };

export function BillingSection(props: BillingSectionProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.billing")}>
        <Stack spacing={2}>
          <TextField label={t("fields.invoiceType")} fullWidth size="small" {...props.register("invoiceType")} />
          <TextField label={t("fields.feeAmount")} fullWidth size="small" {...props.register("feeAmount")} />
          <TextField label={t("fields.paymentMethod")} fullWidth size="small" {...props.register("paymentMethod")} />
          <TextField label={t("fields.currency")} fullWidth size="small" {...props.register("currency")} />
          <TextField label={t("fields.timezone")} fullWidth size="small" {...props.register("timezone")} />
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.billing")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.invoiceType")} value={toDisplayValue(props.adminData.invoiceType, tc("notSet"))} />
        <InfoField label={t("fields.feeAmount")} value={toDisplayValue(props.adminData.feeAmount, tc("notSet"))} />
        <InfoField
          label={t("fields.paymentMethod")}
          value={toDisplayValue(props.adminData.paymentMethod, tc("notSet"))}
        />
        <InfoField label={t("fields.currency")} value={toDisplayValue(props.adminData.currency, tc("notSet"))} />
        <InfoField label={t("fields.timezone")} value={toDisplayValue(props.adminData.timezone, tc("notSet"))} />
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
            {t("fields.status")}
          </Typography>
          <StatusBadge
            category="studentAccount"
            status={props.adminData.status ?? "REGULAR"}
            label={props.adminData.status ?? tc("notSet")}
          />
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
