"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { InfoField } from "../../parent/sections/InfoField";
import type { StaffAdminEditFormData } from "../staffProfileFormTypes";
import { type StaffProfileData, toDisplayValue } from "./staffProfileTypes";

type ContactSectionProps =
  | {
      readonly mode: "view";
      readonly staffData: StaffProfileData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<StaffAdminEditFormData>;
    };

export function ContactSection(props: ContactSectionProps) {
  const t = useTranslations("profile.staff");
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
      <Stack spacing={1.5}>
        <InfoField label={t("fields.phone")} value={toDisplayValue(props.staffData.phone, tc("notSet"))} />
      </Stack>
    </SectionPanel>
  );
}
