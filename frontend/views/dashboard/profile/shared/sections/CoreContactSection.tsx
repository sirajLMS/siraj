"use client";

import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { ProfileFieldRow } from "@/frontend/views/dashboard/profile/shared/ProfileFieldRow";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";

type CoreContactFormFields = {
  phone: string;
};

type CoreContactSectionProps =
  | {
      readonly mode: "view";
      readonly phone: string | null | undefined;
      readonly sectionTitle: string;
      readonly phoneLabel: string;
    }
  | {
      readonly mode: "edit";
      readonly sectionTitle: string;
      readonly phoneLabel: string;
      readonly register: UseFormRegister<CoreContactFormFields>;
    };

export function CoreContactSection(props: CoreContactSectionProps) {
  const tc = useTranslations("profile");
  const { canView, showField } = useProfileFieldAccess();

  if (!canView("core_contact")) {
    return null;
  }

  if (props.mode === "edit") {
    return (
      <SectionPanel title={props.sectionTitle}>
        <TextField label={props.phoneLabel} fullWidth size="small" {...props.register("phone")} />
      </SectionPanel>
    );
  }

  if (!showField(props.phone, "core_contact")) {
    return null;
  }

  return (
    <SectionPanel title={props.sectionTitle}>
      <Stack spacing={1}>
        <ProfileFieldRow icon={PhoneOutlined} label={props.phoneLabel} value={props.phone ?? tc("notSet")} />
      </Stack>
    </SectionPanel>
  );
}
