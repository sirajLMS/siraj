"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { ProfileEditFormShell } from "@/frontend/common/views/dashboard/profile/components/__shared__/profileEditFormShell";
import { TeacherExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/ContactSection";
import {
  toTeacherPersonalFieldLabels,
  toTeacherSectionLabels,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils";
import type { TeacherProfileViewLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import {
  type TeacherAdminEditFormData,
  type TeacherEditData,
  teacherAdminEditSchemaFactory,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import { ProfileScope } from "@/shared/constants/profile.enum";

type FieldScope = ReturnType<typeof useProfileFieldAccess>["canEdit"];

function buildDefaultFormValues(data?: TeacherEditData | null): TeacherAdminEditFormData {
  return {
    name: data?.name ?? "",
    email: data?.email ?? "",
    avatarUrl: data?.avatarUrl ?? null,
    phone: data?.phone ?? "",
    nationalId: data?.nationalId ?? "",
    nationality: data?.nationality ?? "",
    dateOfBirth: data?.dateOfBirth ?? "",
    gender: data?.gender ?? null,
    address: data?.address ?? "",
    qualifications: data?.qualifications ?? "",
    timezone: data?.timezone ?? "",
    hourlyRate: data?.hourlyRate ?? "",
    rateCurrency: data?.rateCurrency ?? undefined,
    status: data?.status ?? AccountStatus.Activated,
    displayCurrency: data?.displayCurrency ?? null,
  };
}

function useTeacherEditForm(teacherData: TeacherEditData, labels: { readonly invalidTimezone: string }) {
  const form = useForm<TeacherAdminEditFormData>({
    resolver: zodResolver(teacherAdminEditSchemaFactory(labels)),
    defaultValues: buildDefaultFormValues(),
  });

  useEffect(() => {
    form.reset(buildDefaultFormValues(teacherData));
  }, [form, teacherData]);

  return form;
}

interface SectionsProps {
  readonly labels: TeacherProfileViewLabels;
  readonly teacherData: TeacherEditData;
  readonly targetUserId: string;
  readonly scope: ProfileScope;
  readonly canEdit: FieldScope;
  readonly form: UseFormReturn<TeacherAdminEditFormData>;
}

function TeacherFormSections({ labels, teacherData, targetUserId, scope, canEdit, form }: SectionsProps) {
  const sectionLabels = toTeacherSectionLabels(labels);
  const personalFieldLabels = toTeacherPersonalFieldLabels(labels);

  return (
    <>
      {canEdit("core_identity") ? (
        <AccountSection
          labels={sectionLabels}
          mode="edit"
          scope={scope}
          teacherData={{ name: teacherData.name ?? null, email: teacherData.email ?? null }}
          register={form.register}
          control={form.control}
        />
      ) : null}
      {canEdit("core_contact") || canEdit("teacher_identity") ? (
        <ContactSection
          labels={sectionLabels}
          scope={scope}
          isAdminScope
          register={form.register}
          control={form.control}
        />
      ) : null}
      <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} />
      {canEdit("teacher_professional") ? (
        <CompensationSection labels={labels} mode="edit" register={form.register} control={form.control} />
      ) : null}
      {canEdit("teacher_identity") || canEdit("teacher_professional") ? (
        <TeacherExtensionProfileSection
          mode="edit"
          scope={scope}
          labels={{
            teacher: labels.teacher,
            personalFieldLabels,
            baseLabels: sectionLabels.baseLabels,
          }}
          sectionTitle={labels.teacher.sections.identity}
          register={form.register}
          control={form.control}
        />
      ) : null}
      {canEdit("teacher_identity") ? (
        <AdminOnlySection labels={sectionLabels} mode="edit" register={form.register} />
      ) : null}
    </>
  );
}

export function TeacherAdminEditForm({
  labels,
  teacherData,
  targetUserId,
  isSaving,
  onSubmit,
}: {
  readonly labels: TeacherProfileViewLabels;
  readonly teacherData: TeacherEditData;
  readonly targetUserId: string;
  readonly isSaving: boolean;
  readonly onSubmit: (values: TeacherAdminEditFormData) => Promise<void>;
}) {
  const t = labels.teacher;
  const base = labels.base;
  const scope = ProfileScope.OTHER;
  const { canEdit, canAdminResetPassword } = useProfileFieldAccess({ scope });
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: targetUserId });
  const form = useTeacherEditForm(teacherData, { invalidTimezone: t.validation.invalidTimezone });
  const canResetPassword = canAdminResetPassword();

  return (
    <ProfileEditFormShell
      form={form}
      targetUserId={targetUserId}
      isSaving={isSaving}
      onSubmitValid={onSubmit}
      avatar={
        canEdit("core_identity") ? (
          <AvatarImageField
            control={form.control}
            name="avatarUrl"
            label={t.fields.avatar}
            title={base.editAvatarTitle}
            onUploadAvatar={onUploadAvatar}
          />
        ) : null
      }
      sections={
        <TeacherFormSections
          labels={labels}
          teacherData={teacherData}
          targetUserId={targetUserId}
          scope={scope}
          canEdit={canEdit}
          form={form}
        />
      }
      submitLabels={{ save: t.actions.save, loading: t.shell.loading }}
      snackbarLabels={{ saveSuccess: base.actions.saveSuccess, saveError: base.actions.saveError }}
      resetPasswordLabels={{ success: base.adminResetPassword.success, error: base.adminResetPassword.error }}
      resetPasswordSection={
        canResetPassword ? { userName: teacherData.name ?? "", userEmail: teacherData.email ?? "" } : undefined
      }
    />
  );
}
