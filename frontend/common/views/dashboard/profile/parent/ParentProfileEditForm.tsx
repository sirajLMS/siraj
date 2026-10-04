"use client";

import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { type UseAvatarUploadResult, useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { ProfileEditFormShell } from "@/frontend/common/views/dashboard/profile/components/__shared__/profileEditFormShell";
import { ChangePasswordSection } from "@/frontend/common/views/dashboard/profile/core/components/ChangePasswordSection";
import {
  type ParentEditFormSubmit,
  useParentEditForm,
} from "@/frontend/common/views/dashboard/profile/parent/ParentProfileEditForm.helpers";
import { ParentEditFormSections } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileEditForm.parts";
import type { ParentEditData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import { useParentProfileEditFormViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileEditFormViewModel";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { ProfileScope } from "@/shared/constants/profile.enum";

type AvatarUploader = Pick<UseAvatarUploadResult, "onUploadAvatar">;

export function ParentProfileEditForm({
  parentData,
  targetUserId,
  isAdminScope,
  isSaving,
  onSubmit,
}: {
  readonly parentData: ParentEditData;
  readonly targetUserId: string;
  readonly isAdminScope: boolean;
  readonly isSaving: boolean;
  readonly onSubmit: ParentEditFormSubmit;
}) {
  const { labels } = useParentProfileEditFormViewModel();
  const { base: t, parent: pt } = labels;
  const scope = isAdminScope ? ProfileScope.OTHER : ProfileScope.OWN;
  const { canEdit, canAdminResetPassword } = useProfileFieldAccess({ scope });
  const { onUploadAvatar }: AvatarUploader = useAvatarUpload({ storageOwnerKey: targetUserId });
  const form = useParentEditForm(parentData, isAdminScope, pt.validation.invalidTimezone);
  const canResetPassword = isAdminScope && canAdminResetPassword();

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
            label={pt.fields.avatar}
            title={t.editAvatarTitle}
            onUploadAvatar={onUploadAvatar}
          />
        ) : null
      }
      sections={
        <ParentEditFormSections
          parentData={parentData}
          targetUserId={targetUserId}
          scopeContext={{ scope, isAdminScope, canEdit }}
          register={form.register}
          control={form.control}
          labels={labels}
        />
      }
      submitLabels={{ save: t.actions.save, loading: t.shell.loading }}
      snackbarLabels={{ saveSuccess: t.actions.saveSuccess, saveError: t.actions.saveError }}
      resetPasswordLabels={{ success: t.adminResetPassword.success, error: t.adminResetPassword.error }}
      resetPasswordSection={
        canResetPassword ? { userName: parentData.name ?? "", userEmail: parentData.email ?? "" } : undefined
      }
      changePasswordSection={isAdminScope ? null : <ChangePasswordSection />}
    />
  );
}
