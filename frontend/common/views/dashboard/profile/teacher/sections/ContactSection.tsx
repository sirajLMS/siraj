"use client";

import { Stack, TextField } from "@mui/material";
import type { ReactElement } from "react";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { PhoneFormField, SectionPanel } from "@/frontend/common/components/ui";
import { PhoneDisplay } from "@/frontend/common/components/ui/display/phoneDisplay/PhoneDisplay";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { InfoField } from "@/frontend/common/views/dashboard/profile/teacher/sections/InfoField";
import {
  isTeacherAdminData,
  type TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type {
  TeacherAdminEditFormData,
  TeacherOwnEditFormData,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import { useAppTranslation } from "@/shared/locale/client";

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
  const t = useAppTranslation().profileTranslations.teacher;
  const tc = useAppTranslation().profileTranslations.base;
  const { canView, showField } = useProfileFieldAccess({ scope });

  if (!canView("teacher_identity")) {
    return null;
  }

  const showTimezone = showField(timezone, "teacher_identity");
  const showAddress = showField(address, "teacher_identity");

  if (!showTimezone && !showAddress) {
    return <ProfileRestrictedSection title={t.sections.contact} />;
  }

  return (
    <>
      {showTimezone ? (
        <InfoField label={t.fields.timezone} value={<TimezoneDisplay timezone={timezone} fallback={tc.notSet} />} />
      ) : null}
      {showAddress ? <InfoField label={t.fields.address} value={address || tc.notSet} /> : null}
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
  const t = useAppTranslation().profileTranslations.teacher;
  const { canView, canEdit } = useProfileFieldAccess({ scope });

  if (!canView("teacher_identity")) {
    return null;
  }

  const identityEditable = canEdit("teacher_identity");

  return (
    <>
      <TextField
        label={t.fields.address}
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
            label={t.fields.timezone}
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

function ContactSectionEdit(props: ContactSectionOwnEditProps | ContactSectionAdminEditProps): ReactElement | null {
  const t = useAppTranslation().profileTranslations.teacher;
  const scope = props.scope ?? ProfileScope.Own;
  const { canView } = useProfileFieldAccess({ scope });

  if (!canView("core_contact") && (!props.isAdminScope || !canView("teacher_identity"))) {
    return null;
  }

  return (
    <SectionPanel title={t.sections.contact}>
      <Stack spacing={2}>
        {canView("core_contact") ? (
          <PhoneFormField name="phone" control={props.control} label={t.fields.phone} />
        ) : null}
        {props.isAdminScope ? (
          <TeacherIdentityFieldsEdit register={props.register} control={props.control} scope={scope} />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}

function ContactSectionView(props: ContactSectionViewProps): ReactElement {
  const t = useAppTranslation().profileTranslations.teacher;
  const tc = useAppTranslation().profileTranslations.base;
  const scope = props.scope ?? (props.isAdminScope ? ProfileScope.Other : ProfileScope.Own);
  const { canView, showField } = useProfileFieldAccess({ scope });

  const adminData = isTeacherAdminData(props.teacherData) ? props.teacherData : null;
  const showPhone = canView("core_contact") && showField(props.teacherData.phone, "core_contact");
  const showOwnTimezone =
    !props.isAdminScope &&
    canView("teacher_professional") &&
    showField(props.teacherData.timezone, "teacher_professional");
  const showIdentity = props.isAdminScope && adminData != null && canView("teacher_identity");

  if (!showPhone && !showOwnTimezone && !showIdentity) {
    return <ProfileRestrictedSection title={t.sections.contact} />;
  }

  return (
    <SectionPanel title={t.sections.contact}>
      <Stack spacing={2}>
        {showPhone ? (
          <InfoField
            label={t.fields.phone}
            value={<PhoneDisplay phone={props.teacherData.phone} fallback={tc.notSet} />}
          />
        ) : null}
        {showOwnTimezone ? (
          <InfoField
            label={t.fields.timezone}
            value={<TimezoneDisplay timezone={props.teacherData.timezone} fallback={tc.notSet} />}
          />
        ) : null}
        {showIdentity && adminData ? (
          <TeacherIdentityFieldsView timezone={adminData.timezone} address={adminData.address} scope={scope} />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}

export function ContactSection(props: ContactSectionProps): ReactElement | null {
  if (props.mode === "edit") {
    return <ContactSectionEdit {...props} />;
  }
  return <ContactSectionView {...props} />;
}
