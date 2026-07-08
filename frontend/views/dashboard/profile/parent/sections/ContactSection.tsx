"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import type { ParentAdminEditFormData } from "../parentProfileFormTypes";
import { InfoField } from "./InfoField";
import { type ParentViewData, toDisplayValue } from "./parentProfileTypes";

type ContactSectionProps =
  | {
      readonly mode: "view";
      readonly parentData: ParentViewData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
    };

export function ContactSection(props: ContactSectionProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.contact")}>
        <Stack spacing={2}>
          <TextField label={t("fields.phone")} fullWidth size="small" {...props.register("phone")} />
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.contact")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.phone")} value={toDisplayValue(props.parentData.phone, tc("notSet"))} />
      </Stack>
    </SectionPanel>
  );
}
