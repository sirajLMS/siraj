"use client";

import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { PhoneFormField, SectionPanel } from "@/frontend/components/ui";
import { PhoneDisplay } from "@/frontend/components/ui/display";
import type { ParentAdminEditFormData } from "../parentProfileFormTypes";
import { InfoField } from "./InfoField";
import type { ParentViewData } from "./parentProfileTypes";

type ContactSectionProps =
  | {
      readonly mode: "view";
      readonly parentData: ParentViewData;
    }
  | {
      readonly mode: "edit";
      readonly control: Control<ParentAdminEditFormData>;
    };

export function ContactSection(props: ContactSectionProps) {
  const t = useTranslations("profile.parent");
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
      <Stack spacing={2}>
        <InfoField
          label={t("fields.phone")}
          value={<PhoneDisplay phone={props.parentData.phone} fallback={tc("notSet")} />}
        />
      </Stack>
    </SectionPanel>
  );
}
