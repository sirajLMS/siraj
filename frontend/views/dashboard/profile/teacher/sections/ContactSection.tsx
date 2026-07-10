"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { PhoneFormField, SectionPanel } from "@/frontend/components/ui";
import { PhoneDisplay } from "@/frontend/components/ui/display/phoneDisplay/PhoneDisplay";
import { TimezoneDisplay } from "@/frontend/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import { InfoField } from "@/frontend/views/dashboard/profile/teacher/sections/InfoField";
import {
  isTeacherAdminData,
  type TeacherViewData,
} from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type {
  TeacherAdminEditFormData,
  TeacherOwnEditFormData,
} from "@/frontend/views/dashboard/profile/teacher/teacherProfileFormTypes";

type ContactSectionViewProps = {
  readonly mode: "view";
  readonly teacherData: TeacherViewData;
  readonly isAdminScope: boolean;
};

type ContactSectionOwnEditProps = {
  readonly mode: "edit";
  readonly isAdminScope: false;
  readonly register: UseFormRegister<TeacherOwnEditFormData>;
  readonly control: Control<TeacherOwnEditFormData>;
};

type ContactSectionAdminEditProps = {
  readonly mode: "edit";
  readonly isAdminScope: true;
  readonly register: UseFormRegister<TeacherAdminEditFormData>;
  readonly control: Control<TeacherAdminEditFormData>;
};

type ContactSectionProps = ContactSectionViewProps | ContactSectionOwnEditProps | ContactSectionAdminEditProps;

export function ContactSection(props: ContactSectionProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.contact")}>
        <Stack spacing={2}>
          <PhoneFormField name="phone" control={props.control} label={t("fields.phone")} />
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
              <Controller
                name="timezone"
                control={props.control}
                render={({ field, fieldState }) => (
                  <TimezoneSelect
                    value={field.value ? toGraphqlIanaTimezone(field.value) : null}
                    onChangeAction={value => {
                      field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
                    }}
                    onBlurAction={field.onBlur}
                    label={t("fields.timezone")}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
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
        <InfoField
          label={t("fields.phone")}
          value={<PhoneDisplay phone={props.teacherData.phone} fallback={tc("notSet")} />}
        />
        <InfoField
          label={t("fields.timezone")}
          value={<TimezoneDisplay timezone={props.teacherData.timezone} fallback={tc("notSet")} />}
        />
        {props.isAdminScope && adminData ? (
          <InfoField label={t("fields.address")} value={adminData.address || tc("notSet")} />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
