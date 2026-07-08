"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import type { ParentAdminEditFormData } from "../parentProfileFormTypes";
import { InfoField } from "./InfoField";
import { type ParentViewData, toDisplayValue } from "./parentProfileTypes";

type SocialSectionProps =
  | {
      readonly mode: "view";
      readonly parentData: ParentViewData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
    };

export function SocialSection(props: SocialSectionProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.social")}>
        <Stack spacing={2}>
          <TextField label={t("fields.facebook")} fullWidth size="small" {...props.register("facebook")} />
          <TextField label={t("fields.whatsapp")} fullWidth size="small" {...props.register("whatsapp")} />
          <TextField label={t("fields.twitter")} fullWidth size="small" {...props.register("twitter")} />
          <TextField label={t("fields.skype")} fullWidth size="small" {...props.register("skype")} />
          <TextField
            label={t("fields.defaultZoomLink")}
            fullWidth
            size="small"
            {...props.register("defaultZoomLink")}
          />
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.social")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.facebook")} value={toDisplayValue(props.parentData.facebook, tc("notSet"))} />
        <InfoField label={t("fields.whatsapp")} value={toDisplayValue(props.parentData.whatsapp, tc("notSet"))} />
        <InfoField label={t("fields.twitter")} value={toDisplayValue(props.parentData.twitter, tc("notSet"))} />
        <InfoField label={t("fields.skype")} value={toDisplayValue(props.parentData.skype, tc("notSet"))} />
        <InfoField
          label={t("fields.defaultZoomLink")}
          value={toDisplayValue(props.parentData.defaultZoomLink, tc("notSet"))}
        />
      </Stack>
    </SectionPanel>
  );
}
