"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { ParentStatus, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import {
  type ParentAdminEditFormData,
  type ParentEditData,
  parentAdminEditSchema,
  parentOwnEditSchema,
} from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";
import { AccountSection } from "@/frontend/views/dashboard/profile/parent/sections/AccountSection";
import { BillingSection } from "@/frontend/views/dashboard/profile/parent/sections/BillingSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/parent/sections/ContactSection";
import { IdentitySection } from "@/frontend/views/dashboard/profile/parent/sections/IdentitySection";
import { SocialSection } from "@/frontend/views/dashboard/profile/parent/sections/SocialSection";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";

export type { ParentAdminEditFormData } from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";

export function ParentProfileEditForm({
  parentData,
  avatarUrl,
  isAdminScope,
  targetUserId,
  isSaving,
  onSubmit,
}: {
  readonly parentData: ParentEditData;
  readonly avatarUrl?: string | null;
  readonly isAdminScope: boolean;
  readonly targetUserId?: string;
  readonly isSaving: boolean;
  readonly onSubmit: (values: ParentAdminEditFormData) => Promise<void>;
}) {
  const tc = useTranslations("profile");
  const scope = isAdminScope ? ProfileScope.Other : ProfileScope.Own;
  const { canEdit } = useProfileFieldAccess({ scope });
  const schema = isAdminScope ? parentAdminEditSchema : parentOwnEditSchema;
  const form = useForm<ParentAdminEditFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
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
    await onSubmit(values);
  };

  return (
    <Box component="form" onSubmit={form.handleSubmit(onValidSubmit)}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          {canEdit("core_identity") ? (
            <AccountSection
              mode="edit"
              scope={scope}
              parentData={{ name: parentData.name ?? null, email: parentData.email ?? null }}
              avatarUrl={avatarUrl}
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
              {targetUserId ? <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} /> : null}
              {canEdit("parent_billing") ? (
                <BillingSection mode="edit" register={form.register} control={form.control} />
              ) : null}
            </>
          ) : null}
        </Box>

        <PrimaryPageAction type="submit" disabled={isSaving}>
          {isSaving ? tc("shell.loading") : tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
