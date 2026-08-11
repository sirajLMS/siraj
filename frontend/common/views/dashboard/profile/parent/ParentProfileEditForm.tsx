"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { type Control, type UseFormRegister, useForm } from "react-hook-form";
import { FormErrorSnackbar, FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { ParentStatus, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type UseAvatarUploadResult, useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { ChangePasswordSection } from "@/frontend/common/views/dashboard/profile/core/components/ChangePasswordSection";
import {
  type ParentAdminEditFormData,
  type ParentEditData,
  parentAdminEditSchema,
  parentOwnEditSchema,
} from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/parent/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/parent/sections/AdminOnlySection";
import { BillingSection } from "@/frontend/common/views/dashboard/profile/parent/sections/BillingSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/parent/sections/ContactSection";
import {
  type ParentProfileViewLabels,
  toParentSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { SocialSection } from "@/frontend/common/views/dashboard/profile/parent/sections/SocialSection";
import { useParentProfileEditFormViewModel } from "@/frontend/common/views/dashboard/profile/parent/useParentProfileEditFormViewModel";
import {
  AdminResetPasswordSection,
  type AdminResetPasswordSectionRef,
} from "@/frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection";
import { ParentExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/ParentExtensionProfileSection";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

export type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";

type ParentEditFormSubmit = (values: ParentAdminEditFormData) => Promise<void>;
type AvatarUploader = Pick<UseAvatarUploadResult, "onUploadAvatar">;

type ScopeContext = {
  readonly scope: ProfileScope;
  readonly isAdminScope: boolean;
  readonly canEdit: (group: ProfileFieldGroupKey) => boolean;
};

const SECTION_GRID_SX = {
  display: "grid",
  gap: 3,
  minWidth: 0,
  width: "100%",
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    lg: "repeat(2, minmax(0, 1fr))",
  },
} as const;

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

function useParentEditForm(parentData: ParentEditData, isAdminScope: boolean) {
  const schema = isAdminScope ? parentAdminEditSchema : parentOwnEditSchema;
  const form = useForm<ParentAdminEditFormData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    form.reset(buildFormDefaults(parentData));
  }, [form, parentData]);

  return form;
}

function useParentSubmitFeedback(
  onSubmit: ParentEditFormSubmit,
  resetPasswordRef: React.RefObject<AdminResetPasswordSectionRef | null>,
  resetPassword: (userId: string, newPassword: string, sendEmail: boolean) => Promise<boolean>,
  targetUserId: string
) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const onValidSubmit = async (values: ParentAdminEditFormData) => {
    try {
      await onSubmit(values);
      const resetData = resetPasswordRef.current?.getResetPasswordData();
      if (resetData?.isValid) {
        const success = await resetPassword(targetUserId, resetData.newPassword, resetData.sendNotificationEmail);
        if (success) {
          resetPasswordRef.current?.reset();
        }
      }
      setSuccessOpen(true);
    } catch {
      setErrorOpen(true);
    }
  };

  return { successOpen, errorOpen, setSuccessOpen, setErrorOpen, onValidSubmit };
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
    <Box sx={SECTION_GRID_SX}>
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
        <ParentExtensionProfileSection mode="edit" labels={pt} scope={scope} register={register} control={control} />
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
    </Box>
  );
}

type ParentEditFormSnackbarsProps = {
  readonly successOpen: boolean;
  readonly errorOpen: boolean;
  readonly setSuccessOpen: (open: boolean) => void;
  readonly setErrorOpen: (open: boolean) => void;
  readonly labels: { readonly saveSuccess: string; readonly saveError: string };
};

function ParentEditFormSnackbars({
  successOpen,
  errorOpen,
  setSuccessOpen,
  setErrorOpen,
  labels,
}: ParentEditFormSnackbarsProps) {
  return (
    <>
      <FormSuccessSnackbar open={successOpen} message={labels.saveSuccess} onClose={() => setSuccessOpen(false)} />
      <FormErrorSnackbar open={errorOpen} message={labels.saveError} onClose={() => setErrorOpen(false)} />
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
  const scope = isAdminScope ? ProfileScope.Other : ProfileScope.Own;
  const { canEdit, canAdminResetPassword } = useProfileFieldAccess({ scope });
  const { onUploadAvatar }: AvatarUploader = useAvatarUpload({ storageOwnerKey: targetUserId });
  const form = useParentEditForm(parentData, isAdminScope);
  const resetPasswordRef = useRef<AdminResetPasswordSectionRef>(null);
  const { resetPassword } = useAdminResetPassword(t.adminResetPassword.success, t.adminResetPassword.error);
  const feedback = useParentSubmitFeedback(onSubmit, resetPasswordRef, resetPassword, targetUserId);

  const scopeContext: ScopeContext = { scope, isAdminScope, canEdit };
  const canResetPassword = isAdminScope && canAdminResetPassword();
  const parentName = parentData.name ?? "";
  const parentEmail = parentData.email ?? "";

  return (
    <Stack spacing={3}>
      <Box component="form" onSubmit={form.handleSubmit(feedback.onValidSubmit)}>
        <Stack spacing={3}>
          {canEdit("core_identity") ? (
            <AvatarImageField
              control={form.control}
              name="avatarUrl"
              label={pt.fields.avatar}
              title={t.editAvatarTitle}
              onUploadAvatar={onUploadAvatar}
            />
          ) : null}
          <ParentEditFormSections
            parentData={parentData}
            targetUserId={targetUserId}
            scopeContext={scopeContext}
            register={form.register}
            control={form.control}
            labels={labels}
          />
          {canResetPassword && (
            <AdminResetPasswordSection
              ref={resetPasswordRef}
              targetUserId={targetUserId}
              userName={parentName}
              userEmail={parentEmail}
            />
          )}
          <PrimaryPageAction type="submit" disabled={isSaving}>
            {isSaving ? t.shell.loading : t.actions.save}
          </PrimaryPageAction>
        </Stack>
      </Box>
      {isAdminScope ? null : <ChangePasswordSection />}
      <ParentEditFormSnackbars
        successOpen={feedback.successOpen}
        errorOpen={feedback.errorOpen}
        setSuccessOpen={feedback.setSuccessOpen}
        setErrorOpen={feedback.setErrorOpen}
        labels={{ saveSuccess: t.actions.saveSuccess, saveError: t.actions.saveError }}
      />
    </Stack>
  );
}
