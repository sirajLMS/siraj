"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/components/ui";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { AccountSection } from "./sections/AccountSection";
import { ContactSection } from "./sections/ContactSection";
import type { StaffProfileData } from "./sections/staffProfileTypes";
import { type StaffAdminEditFormData, staffAdminEditSchema, staffOwnEditSchema } from "./staffProfileFormTypes";

export function StaffProfileEditForm({
  staffData,
  avatarUrl,
  isAdminScope,
  isSaving,
  onSubmit,
}: {
  readonly staffData: StaffProfileData;
  readonly avatarUrl?: string | null;
  readonly isAdminScope: boolean;
  readonly isSaving: boolean;
  readonly onSubmit: (values: StaffAdminEditFormData) => Promise<void>;
}) {
  const tc = useTranslations("profile");
  const form = useForm<StaffAdminEditFormData>({
    resolver: zodResolver(isAdminScope ? staffAdminEditSchema : staffOwnEditSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: AccountStatus.Activated,
    },
  });

  useEffect(() => {
    form.reset({
      name: staffData.name ?? "",
      email: staffData.email ?? "",
      phone: staffData.phone ?? "",
      status: staffData.status ?? AccountStatus.Activated,
    });
  }, [form, staffData]);

  const onValidSubmit = async (values: StaffAdminEditFormData) => {
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
            staffData={staffData}
            avatarUrl={avatarUrl}
            isAdminScope={isAdminScope}
            register={form.register}
          />
          <ContactSection mode="edit" register={form.register} />
        </Box>
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
