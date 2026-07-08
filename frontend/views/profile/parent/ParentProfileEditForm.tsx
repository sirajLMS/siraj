"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/components/ui";
import {
  type ParentAdminEditFormData,
  type ParentEditData,
  parentAdminEditSchema,
  parentOwnEditSchema,
} from "./parentProfileFormTypes";
import { AccountSection } from "./sections/AccountSection";
import { BillingSection } from "./sections/BillingSection";
import { ContactSection } from "./sections/ContactSection";
import { IdentitySection } from "./sections/IdentitySection";
import { SocialSection } from "./sections/SocialSection";

export type { ParentAdminEditFormData, ParentOwnEditFormData } from "./parentProfileFormTypes";

export function ParentProfileEditForm({
  parentData,
  avatarUrl,
  isAdminScope,
  isSaving,
  onSubmit,
}: {
  readonly parentData: ParentEditData;
  readonly avatarUrl?: string | null;
  readonly isAdminScope: boolean;
  readonly isSaving: boolean;
  readonly onSubmit: (values: ParentAdminEditFormData) => Promise<void>;
}) {
  const tc = useTranslations("profile");
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
      skype: "",
      defaultZoomLink: "",
      nationality: "",
      address: "",
      invoiceType: "",
      feeAmount: "",
      paymentMethod: "",
      currency: "",
      timezone: "",
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
      skype: parentData.skype ?? "",
      defaultZoomLink: parentData.defaultZoomLink ?? "",
      nationality: parentData.nationality ?? "",
      address: parentData.address ?? "",
      invoiceType: parentData.invoiceType ?? "",
      feeAmount: parentData.feeAmount ?? "",
      paymentMethod: parentData.paymentMethod ?? "",
      currency: parentData.currency ?? "",
      timezone: parentData.timezone ?? "",
    });
  }, [form, parentData]);

  const onValidSubmit = async (values: ParentAdminEditFormData) => {
    await onSubmit(values);
  };

  return (
    <Box component="form" onSubmit={form.handleSubmit(onValidSubmit)}>
      <Stack spacing={3}>
        <AccountSection
          mode="edit"
          parentData={{ name: parentData.name ?? null, email: parentData.email ?? null }}
          avatarUrl={avatarUrl}
          register={form.register}
        />
        <ContactSection mode="edit" register={form.register} />
        <SocialSection mode="edit" register={form.register} />

        {isAdminScope ? (
          <>
            <IdentitySection mode="edit" register={form.register} />
            <BillingSection mode="edit" register={form.register} />
          </>
        ) : null}

        <PrimaryPageAction type="submit" disabled={isSaving}>
          {isSaving ? tc("shell.loading") : tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
