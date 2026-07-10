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
} from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";
import { AccountSection } from "@/frontend/views/dashboard/profile/parent/sections/AccountSection";
import { BillingSection } from "@/frontend/views/dashboard/profile/parent/sections/BillingSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/parent/sections/ContactSection";
import { IdentitySection } from "@/frontend/views/dashboard/profile/parent/sections/IdentitySection";
import { SocialSection } from "@/frontend/views/dashboard/profile/parent/sections/SocialSection";

export type { ParentAdminEditFormData } from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";

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
          <AccountSection
            mode="edit"
            parentData={{ name: parentData.name ?? null, email: parentData.email ?? null }}
            avatarUrl={avatarUrl}
            register={form.register}
          />
          <ContactSection mode="edit" control={form.control} />
          <SocialSection mode="edit" register={form.register} control={form.control} />

          {isAdminScope ? (
            <>
              <IdentitySection mode="edit" register={form.register} control={form.control} />
              <BillingSection mode="edit" register={form.register} control={form.control} />
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
