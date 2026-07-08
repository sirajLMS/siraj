"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import type { TeacherAdminEditFormData } from "../teacherProfileFormTypes";
import { InfoField } from "./InfoField";
import { isTeacherAdminData, type TeacherViewData, toDisplayValue } from "./teacherProfileTypes";

type ZoomSectionProps =
  | {
      readonly mode: "view";
      readonly teacherData: TeacherViewData;
      readonly isAdminScope: boolean;
    }
  | {
      readonly mode: "edit";
      readonly isAdminScope: boolean;
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
      readonly hasZoomPassword?: boolean;
    };

export function ZoomSection(props: ZoomSectionProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.zoom")}>
        <Stack spacing={2}>
          <TextField label={t("fields.zoomLink")} fullWidth size="small" {...props.register("zoomLink")} />
          {props.isAdminScope ? (
            <>
              <TextField label={t("fields.zoomUsername")} fullWidth size="small" {...props.register("zoomUsername")} />
              <TextField
                label={t("fields.zoomPassword")}
                fullWidth
                size="small"
                type="password"
                placeholder={props.hasZoomPassword ? t("fields.zoomPasswordPlaceholder") : undefined}
                {...props.register("zoomPassword")}
              />
            </>
          ) : null}
        </Stack>
      </SectionPanel>
    );
  }

  const adminData = isTeacherAdminData(props.teacherData) ? props.teacherData : null;

  return (
    <SectionPanel title={t("sections.zoom")}>
      <Stack spacing={2}>
        <InfoField label={t("fields.zoomLink")} value={toDisplayValue(props.teacherData.zoomLink, tc("notSet"))} />
        {props.isAdminScope && adminData ? (
          <>
            <InfoField label={t("fields.zoomUsername")} value={toDisplayValue(adminData.zoomUsername, tc("notSet"))} />
            <InfoField
              label={t("fields.zoomPassword")}
              value={adminData.hasZoomPassword ? t("fields.zoomPasswordSet") : tc("notSet")}
            />
          </>
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
