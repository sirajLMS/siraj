"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { type Control, type UseFormRegister, useForm } from "react-hook-form";
import { FormErrorSnackbar, FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { ParentStatus, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type UseAvatarUploadResult, useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import {
  type ParentAdminEditFormData,
  type ParentEditData,
  parentAdminEditSchema,
  parentOwnEditSchema,
} from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/parent/sections/AccountSection";
import { BillingSection } from "@/frontend/common/views/dashboard/profile/parent/sections/BillingSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/parent/sections/ContactSection";
import { IdentitySection } from "@/frontend/common/views/dashboard/profile/parent/sections/IdentitySection";
import { SocialSection } from "@/frontend/common/views/dashboard/profile/parent/sections/SocialSection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";
import { useAppTranslation } from "@/shared/locale";

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

function useParentSubmitFeedback(onSubmit: ParentEditFormSubmit) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const onValidSubmit = async (values: ParentAdminEditFormData) => {
    try {
      await onSubmit(values);
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
};

import { ChangePasswordSection } from "@/frontend/common/views/dashboard/profile/core/components/ChangePasswordSection";

function ParentEditFormSections({
  parentData,
  targetUserId,
  scopeContext,
  register,
  control,
}: ParentEditFormSectionsProps) {
  const { scope, isAdminScope, canEdit } = scopeContext;

  return (
    <Box sx={SECTION_GRID_SX}>
      {canEdit("core_identity") ? (
        <AccountSection
          mode="edit"
          scope={scope}
          parentData={{ name: parentData.name ?? null, email: parentData.email ?? null }}
          register={register}
          control={control}
        />
      ) : null}
      {canEdit("core_contact") ? <ContactSection mode="edit" scope={scope} control={control} /> : null}
      {canEdit("parent_social") ? <SocialSection mode="edit" register={register} control={control} /> : null}
      {canEdit("parent_identity") ? <IdentitySection mode="edit" register={register} control={control} /> : null}

      {isAdminScope ? (
        <>
          <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} />
          {canEdit("parent_billing") ? <BillingSection mode="edit" register={register} control={control} /> : null}
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
  const t = useAppTranslation().profileTranslations.base;
  const pt = useAppTranslation().profileTranslations.parent;
  const scope = isAdminScope ? ProfileScope.Other : ProfileScope.Own;
  const { canEdit } = useProfileFieldAccess({ scope });
  const { onUploadAvatar }: AvatarUploader = useAvatarUpload({ storageOwnerKey: targetUserId });
  const form = useParentEditForm(parentData, isAdminScope);
  const feedback = useParentSubmitFeedback(onSubmit);

  const scopeContext: ScopeContext = { scope, isAdminScope, canEdit };

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
          />
          <PrimaryPageAction type="submit" disabled={isSaving}>
            {isSaving ? t.shell.loading : t.actions.save}
          </PrimaryPageAction>
        </Stack>
      </Box>
      {!isAdminScope ? <ChangePasswordSection /> : null}
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
