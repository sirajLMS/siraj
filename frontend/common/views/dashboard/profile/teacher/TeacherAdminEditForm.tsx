"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { ProfileEditFormShell } from "@/frontend/common/views/dashboard/profile/components/__shared__/profileEditFormShell";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { TeacherProfileViewLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { TeacherAdminEditFormBody } from "@/frontend/common/views/dashboard/profile/teacher/TeacherAdminEditFormBody";
import {
  type TeacherAdminEditFormData,
  type TeacherEditData,
  teacherAdminEditSchemaFactory,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import { ProfileScope } from "@/shared/constants/profile.enum";

/** Convert a prefill national ID object into the form's value shape. */
function toFormNationalId(
  nationalId: { readonly countryCode?: string | null; readonly number?: string | null } | null | undefined
): TeacherAdminEditFormData["nationalId"] {
  const number = nationalId?.number?.trim();
  if (!number) {
    return undefined;
  }
  return { countryCode: nationalId?.countryCode ?? null, number };
}

function buildDefaultFormValues(data?: TeacherEditData | null): TeacherAdminEditFormData {
  return {
    name: data?.name ?? "",
    email: data?.email ?? "",
    avatarUrl: data?.avatarUrl ?? null,
    phone: data?.phone ?? "",
    nationalId: toFormNationalId(data?.nationalId),
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
        <TeacherAdminEditFormBody
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
