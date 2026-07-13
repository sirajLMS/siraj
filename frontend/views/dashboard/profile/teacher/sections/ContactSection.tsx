"use client";

import { Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { PhoneFormField, SectionPanel } from "@/frontend/components/ui";
import { PhoneDisplay } from "@/frontend/components/ui/display/phoneDisplay/PhoneDisplay";
import { TimezoneDisplay } from "@/frontend/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { TimezoneSelect } from "@/frontend/components/ui/input/timezoneSelect/TimezoneSelect";
import { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { ProfileRestrictedSection } from "@/frontend/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";
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
  readonly scope?: ProfileScope;
  readonly teacherData: TeacherViewData;
  readonly isAdminScope: boolean;
};

type ContactSectionOwnEditProps = {
  readonly mode: "edit";
  readonly scope?: ProfileScope;
  readonly isAdminScope: false;
  readonly register: UseFormRegister<TeacherOwnEditFormData>;
  readonly control: Control<TeacherOwnEditFormData>;
};

type ContactSectionAdminEditProps = {
  readonly mode: "edit";
  readonly scope?: ProfileScope;
  readonly isAdminScope: true;
  readonly register: UseFormRegister<TeacherAdminEditFormData>;
  readonly control: Control<TeacherAdminEditFormData>;
};

type ContactSectionProps = ContactSectionViewProps | ContactSectionOwnEditProps | ContactSectionAdminEditProps;

function TeacherIdentityFieldsView({
  timezone,
  address,
  scope,
}: {
  readonly timezone: string | null | undefined;
  readonly address: string | null | undefined;
  readonly scope: ProfileScope;
}) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");
  const { canView, showField } = useProfileFieldAccess({ scope });

  if (!canView("teacher_identity")) {
    return null;
  }

  const showTimezone = showField(timezone, "teacher_identity");
  const showAddress = showField(address, "teacher_identity");

  if (!showTimezone && !showAddress) {
    return <ProfileRestrictedSection title={t("sections.contact")} />;
  }

  return (
    <>
      {showTimezone ? (
        <InfoField
          label={t("fields.timezone")}
          value={<TimezoneDisplay timezone={timezone} fallback={tc("notSet")} />}
        />
      ) : null}
      {showAddress ? <InfoField label={t("fields.address")} value={address || tc("notSet")} /> : null}
    </>
  );
}

function TeacherIdentityFieldsEdit({
  register,
  control,
  scope,
}: {
  readonly register: UseFormRegister<TeacherAdminEditFormData>;
  readonly control: Control<TeacherAdminEditFormData>;
  readonly scope?: ProfileScope;
}) {
  const t = useTranslations("profile.teacher");
  const { canView, canEdit } = useProfileFieldAccess({ scope });

  if (!canView("teacher_identity")) {
    return null;
  }

  const identityEditable = canEdit("teacher_identity");

  return (
    <>
      <TextField
        label={t("fields.address")}
        fullWidth
        size="small"
        multiline
        rows={2}
        disabled={!identityEditable}
        {...register("address")}
      />
      <Controller
        name="timezone"
        control={control}
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
            disabled={!identityEditable}
          />
        )}
      />
    </>
  );
}

export function ContactSection(props: ContactSectionProps) {
  const t = useTranslations("profile.teacher");
  const tc = useTranslations("profile");
  const scope = props.scope ?? (props.mode === "view" && props.isAdminScope ? ProfileScope.Other : ProfileScope.Own);
  const { canView, showField } = useProfileFieldAccess({ scope });

  const contactTitle = t("sections.contact");

  if (props.mode === "edit") {
    if (!canView("core_contact") && (!props.isAdminScope || !canView("teacher_identity"))) {
      return null;
    }

    return (
      <SectionPanel title={contactTitle}>
        <Stack spacing={2}>
          {canView("core_contact") ? (
            <PhoneFormField name="phone" control={props.control} label={t("fields.phone")} />
          ) : null}
          {props.isAdminScope ? (
            <TeacherIdentityFieldsEdit register={props.register} control={props.control} scope={scope} />
          ) : null}
        </Stack>
      </SectionPanel>
    );
  }

  const adminData = isTeacherAdminData(props.teacherData) ? props.teacherData : null;
  const showPhone = canView("core_contact") && showField(props.teacherData.phone, "core_contact");
  const showOwnTimezone =
    !props.isAdminScope &&
    canView("teacher_professional") &&
    showField(props.teacherData.timezone, "teacher_professional");
  const showIdentity = props.isAdminScope && adminData != null && canView("teacher_identity");

  if (!showPhone && !showOwnTimezone && !showIdentity) {
    return <ProfileRestrictedSection title={contactTitle} />;
  }

  return (
    <SectionPanel title={contactTitle}>
      <Stack spacing={2}>
        {showPhone ? (
          <InfoField
            label={t("fields.phone")}
            value={<PhoneDisplay phone={props.teacherData.phone} fallback={tc("notSet")} />}
          />
        ) : null}
        {showOwnTimezone ? (
          <InfoField
            label={t("fields.timezone")}
            value={<TimezoneDisplay timezone={props.teacherData.timezone} fallback={tc("notSet")} />}
          />
        ) : null}
        {showIdentity && adminData ? (
          <TeacherIdentityFieldsView timezone={adminData.timezone} address={adminData.address} scope={scope} />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
