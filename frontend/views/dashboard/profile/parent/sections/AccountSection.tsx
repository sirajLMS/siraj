"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel, UserAvatar } from "@/frontend/components/ui";
import type { ParentAdminEditFormData } from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";
import { InfoField } from "@/frontend/views/dashboard/profile/parent/sections/InfoField";
import {
  type ParentViewData,
  toDisplayValue,
} from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";

type AccountParentData = Pick<ParentViewData, "name" | "email">;

type AccountSectionProps =
  | {
      readonly mode: "view";
      readonly parentData: AccountParentData;
      readonly avatarUrl?: string | null;
    }
  | {
      readonly mode: "edit";
      readonly parentData: AccountParentData;
      readonly avatarUrl?: string | null;
      readonly register: UseFormRegister<ParentAdminEditFormData>;
    };

export function AccountSection(props: AccountSectionProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.account")}>
        <Stack spacing={2}>
          <UserAvatar src={props.avatarUrl} label={props.parentData.name ?? t("fields.fullName")} size={64} />
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
        <UserAvatar src={props.avatarUrl} label={props.parentData.name ?? t("fields.fullName")} size={64} />
        <InfoField label={t("fields.fullName")} value={toDisplayValue(props.parentData.name, tc("notSet"))} />
        <InfoField label={t("fields.primaryEmail")} value={toDisplayValue(props.parentData.email, tc("notSet"))} />
      </Stack>
    </SectionPanel>
  );
}
