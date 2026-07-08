"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import type { TeacherAdminEditFormData } from "../teacherProfileFormTypes";
import { InfoField } from "./InfoField";
import { isTeacherAdminData, type TeacherViewData, toDisplayValue } from "./teacherProfileTypes";

type ContactSectionProps =
  | {
      readonly mode: "view";
      readonly teacherData: TeacherViewData;
      readonly isAdminScope: boolean;
    }
  | {
      readonly mode: "edit";
      readonly isAdminScope: boolean;
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
    };

export function ContactSection(props: ContactSectionProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.contact")}>
        <Stack spacing={2}>
          <TextField label={t("fields.phone")} fullWidth size="small" {...props.register("phone")} />
          {props.isAdminScope ? (
            <>
              <TextField
                label={t("fields.address")}
                fullWidth
                size="small"
                multiline
                rows={2}
                {...props.register("address")}
              />
              <TextField label={t("fields.timezone")} fullWidth size="small" {...props.register("timezone")} />
            </>
          ) : null}
        </Stack>
      </SectionPanel>
    );
  }

  const adminData = isTeacherAdminData(props.teacherData) ? props.teacherData : null;

  return (
    <SectionPanel title={t("sections.contact")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.phone")} value={toDisplayValue(props.teacherData.phone, tc("notSet"))} />
        <InfoField label={t("fields.timezone")} value={toDisplayValue(props.teacherData.timezone, tc("notSet"))} />
        {props.isAdminScope && adminData ? (
          <InfoField label={t("fields.address")} value={toDisplayValue(adminData.address, tc("notSet"))} />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
