"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import type { ParentAdminEditFormData } from "../parentProfileFormTypes";
import { InfoField } from "./InfoField";
import { type ParentAdminData, toDisplayValue } from "./parentProfileTypes";

type IdentitySectionProps =
  | {
      readonly mode: "view";
      readonly adminData: ParentAdminData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
    };

export function IdentitySection(props: IdentitySectionProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.identity")}>
        <Stack spacing={2}>
          <TextField label={t("fields.nationality")} fullWidth size="small" {...props.register("nationality")} />
          <TextField label={t("fields.address")} fullWidth size="small" {...props.register("address")} />
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.identity")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.nationality")} value={toDisplayValue(props.adminData.nationality, tc("notSet"))} />
        <InfoField label={t("fields.address")} value={toDisplayValue(props.adminData.address, tc("notSet"))} />
      </Stack>
    </SectionPanel>
  );
}
