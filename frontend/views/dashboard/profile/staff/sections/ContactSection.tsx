"use client";

import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { PhoneFormField, SectionPanel } from "@/frontend/components/ui";
import { PhoneDisplay } from "@/frontend/components/ui/display";
import { InfoField } from "../../parent/sections/InfoField";
import type { StaffAdminEditFormData } from "../staffProfileFormTypes";
import type { StaffProfileData } from "./staffProfileTypes";

type ContactSectionProps =
  | {
      readonly mode: "view";
      readonly staffData: StaffProfileData;
    }
  | {
      readonly mode: "edit";
      readonly control: Control<StaffAdminEditFormData>;
    };

export function ContactSection(props: ContactSectionProps) {
  const t = useTranslations("profile.staff");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.contact")}>
        <Stack spacing={2}>
          <PhoneFormField name="phone" control={props.control} label={t("fields.phone")} />
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.contact")}>
      <Stack spacing={1.5}>
        <InfoField
          label={t("fields.phone")}
          value={<PhoneDisplay phone={props.staffData.phone} fallback={tc("notSet")} />}
        />
      </Stack>
    </SectionPanel>
  );
}
