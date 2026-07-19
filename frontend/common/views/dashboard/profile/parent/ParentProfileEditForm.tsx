"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormErrorSnackbar, FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { ParentStatus, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
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
import { useAppTranslation } from "@/shared/locale";

export type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";

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
  readonly onSubmit: (values: ParentAdminEditFormData) => Promise<void>;
}) {
  const t = useAppTranslation().profileTranslations.base;
  const pt = useAppTranslation().profileTranslations.parent;
  const scope = isAdminScope ? ProfileScope.Other : ProfileScope.Own;
  const { canEdit } = useProfileFieldAccess({ scope });
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: targetUserId });
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const schema = isAdminScope ? parentAdminEditSchema : parentOwnEditSchema;
  const form = useForm<ParentAdminEditFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    form.reset({
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
    });
  }, [form, parentData]);

  const onValidSubmit = async (values: ParentAdminEditFormData) => {
    try {
      await onSubmit(values);
      setSuccessOpen(true);
    } catch {
      setErrorOpen(true);
    }
  };

  return (
    <Box component="form" onSubmit={form.handleSubmit(onValidSubmit)}>
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
        <Box
          sx={{
            display: "grid",
            gap: 3,
            minWidth: 0,
            width: "100%",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          {canEdit("core_identity") ? (
            <AccountSection
              mode="edit"
              scope={scope}
              parentData={{ name: parentData.name ?? null, email: parentData.email ?? null }}
              register={form.register}
              control={form.control}
            />
          ) : null}
          {canEdit("core_contact") ? <ContactSection mode="edit" scope={scope} control={form.control} /> : null}
          {canEdit("parent_social") ? (
            <SocialSection mode="edit" register={form.register} control={form.control} />
          ) : null}

          {isAdminScope ? (
            <>
              {canEdit("parent_identity") ? (
                <IdentitySection mode="edit" register={form.register} control={form.control} />
              ) : null}
              <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} />
              {canEdit("parent_billing") ? (
                <BillingSection mode="edit" register={form.register} control={form.control} />
              ) : null}
            </>
          ) : null}
        </Box>

        <PrimaryPageAction type="submit" disabled={isSaving}>
          {isSaving ? t.shell.loading : t.actions.save}
        </PrimaryPageAction>
      </Stack>
      <FormSuccessSnackbar open={successOpen} message={t.actions.saveSuccess} onClose={() => setSuccessOpen(false)} />
      <FormErrorSnackbar open={errorOpen} message={t.actions.saveError} onClose={() => setErrorOpen(false)} />
    </Box>
  );
}
