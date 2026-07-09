"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel, UserAvatar } from "@/frontend/components/ui";
import { InfoField } from "@/frontend/views/dashboard/profile/teacher/sections/InfoField";
import {
  type TeacherViewData,
  toDisplayValue,
} from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherAdminEditFormData } from "@/frontend/views/dashboard/profile/teacher/teacherProfileFormTypes";

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly teacherData: Pick<TeacherViewData, "name" | "email">;
      readonly avatarUrl?: string | null;
    }
  | {
      readonly mode: "edit";
      readonly teacherData: Pick<TeacherViewData, "name" | "email">;
      readonly avatarUrl?: string | null;
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.account")}>
        <Stack spacing={2}>
          <UserAvatar src={props.avatarUrl} label={props.teacherData.name ?? t("fields.fullName")} size={64} />
          <TextField label={t("fields.fullName")} fullWidth size="small" {...props.register("name")} />
          <TextField
            label={t("fields.primaryEmail")}
            fullWidth
            size="small"
            type="email"
            {...props.register("email")}
          />
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.account")}>
      <Stack spacing={2}>
        <UserAvatar src={props.avatarUrl} label={props.teacherData.name ?? t("fields.fullName")} size={64} />
        <InfoField label={t("fields.fullName")} value={toDisplayValue(props.teacherData.name, tc("notSet"))} />
        <InfoField label={t("fields.primaryEmail")} value={toDisplayValue(props.teacherData.email, tc("notSet"))} />
      </Stack>
    </SectionPanel>
  );
}
