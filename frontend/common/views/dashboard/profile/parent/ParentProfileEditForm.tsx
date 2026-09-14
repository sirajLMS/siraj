"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type Control, type UseFormRegister, useForm } from "react-hook-form";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { type UseAvatarUploadResult, useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { ProfileEditFormShell } from "@/frontend/common/views/dashboard/profile/components/__shared__/profileEditFormShell";
import { ChangePasswordSection } from "@/frontend/common/views/dashboard/profile/core/components/ChangePasswordSection";
import {
  type ParentAdminEditFormData,
  type ParentEditData,
  parentAdminEditSchemaFactory,
  parentOwnEditSchemaFactory,
} from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/parent/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/parent/sections/AdminOnlySection";
import { BillingSection } from "@/frontend/common/views/dashboard/profile/parent/sections/BillingSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/parent/sections/ContactSection";
import { IdentitySection } from "@/frontend/common/views/dashboard/profile/parent/sections/IdentitySection";
import {
  type ParentProfileViewLabels,
  toParentSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { SocialSection } from "@/frontend/common/views/dashboard/profile/parent/sections/SocialSection";
import { useParentProfileEditFormViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileEditFormViewModel";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { ProfileScope } from "@/shared/constants/profile.enum";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

type ParentEditFormSubmit = (values: ParentAdminEditFormData) => Promise<void>;
type AvatarUploader = Pick<UseAvatarUploadResult, "onUploadAvatar">;

type ScopeContext = {
  readonly scope: ProfileScope;
  readonly isAdminScope: boolean;
  readonly canEdit: (group: ProfileFieldGroupKey) => boolean;
};

const EMPTY_DEFAULTS: ParentAdminEditFormData = {
  name: "",
  email: "",
  avatarUrl: null,
  phone: "",
  facebook: "",
  whatsapp: "",
  twitter: "",
  nationality: "",
  address: "",
  invoiceType: "",
  feeAmount: "",
  currency: undefined,
  timezone: "",
  lifecycleStatus: ParentStatus.Regular,
  displayCurrency: null,
};

function buildFormDefaults(parentData: ParentEditData): ParentAdminEditFormData {
  return {
    name: parentData.name ?? "",
    email: parentData.email ?? "",
    avatarUrl: parentData.avatarUrl ?? null,
    phone: parentData.phone ?? "",
    facebook: parentData.facebook ?? "",
    whatsapp: parentData.whatsapp ?? "",
    twitter: parentData.twitter ?? "",
    nationality: parentData.nationality ?? "",
    address: parentData.address ?? "",
    invoiceType: parentData.invoiceType ?? "",
    feeAmount: parentData.feeAmount ?? "",
    currency: parentData.currency ?? undefined,
    timezone: parentData.timezone ?? "",
    lifecycleStatus: parentData.lifecycleStatus ?? ParentStatus.Regular,
    displayCurrency: parentData.displayCurrency ?? null,
  };
}

function useParentEditForm(parentData: ParentEditData, isAdminScope: boolean, invalidTimezone: string) {
  const schema = isAdminScope
    ? parentAdminEditSchemaFactory({ invalidTimezone })
    : parentOwnEditSchemaFactory({ invalidTimezone });
  const form = useForm<ParentAdminEditFormData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    form.reset(buildFormDefaults(parentData));
  }, [form, parentData]);

  return form;
}

type ParentEditFormSectionsProps = {
  readonly parentData: ParentEditData;
  readonly targetUserId: string;
  readonly scopeContext: ScopeContext;
  readonly register: UseFormRegister<ParentAdminEditFormData>;
  readonly control: Control<ParentAdminEditFormData>;
  readonly labels: ParentProfileViewLabels;
};

function ParentEditFormSections({
  parentData,
  targetUserId,
  scopeContext,
  register,
  control,
  labels,
}: ParentEditFormSectionsProps) {
  const { scope, isAdminScope, canEdit } = scopeContext;
  const sectionLabels = {
    parent: labels.parent,
    baseLabels: toParentSharedBaseLabels(labels.base),
  };
  const { parent: pt } = sectionLabels;

  return (
    <>
      {canEdit("core_identity") ? (
        <AccountSection
          mode="edit"
          labels={sectionLabels}
          scope={scope}
          parentData={{ name: parentData.name ?? null, email: parentData.email ?? null }}
          register={register}
          control={control}
        />
      ) : null}
      {canEdit("core_contact") ? (
        <ContactSection mode="edit" labels={sectionLabels} scope={scope} control={control} />
      ) : null}
      {canEdit("parent_social") ? (
        <SocialSection mode="edit" labels={pt} register={register} control={control} />
      ) : null}
      {canEdit("parent_identity") ? (
        <IdentitySection mode="edit" labels={pt} scope={scope} register={register} control={control} />
      ) : null}

      {isAdminScope ? (
        <>
          <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} />
          {canEdit("parent_billing") ? (
            <BillingSection mode="edit" labels={pt} register={register} control={control} />
          ) : null}
          {canEdit("parent_identity") ? (
            <AdminOnlySection labels={sectionLabels} mode="edit" register={register} />
          ) : null}
        </>
      ) : null}
    </>
  );
}

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
