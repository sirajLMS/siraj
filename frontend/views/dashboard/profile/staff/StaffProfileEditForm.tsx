"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/components/ui";
import { AccountStatus, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/views/dashboard/profile/staff/sections/AccountSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/staff/sections/ContactSection";
import type { StaffProfileData } from "@/frontend/views/dashboard/profile/staff/sections/staffProfileTypes";
import {
  type StaffAdminEditFormData,
  staffAdminEditSchema,
  staffOwnEditSchema,
} from "@/frontend/views/dashboard/profile/staff/staffProfileFormTypes";

export function StaffProfileEditForm({
  staffData,
  displayCurrency,
  isAdminScope,
  isSaving,
  onSubmit,
}: {
  readonly staffData: StaffProfileData;
  readonly displayCurrency: StaffAdminEditFormData["displayCurrency"];
  readonly isAdminScope: boolean;
  readonly isSaving: boolean;
  readonly onSubmit: (values: StaffAdminEditFormData) => Promise<void>;
}) {
  const tc = useTranslations("profile");
  const scope = isAdminScope ? ProfileScope.Other : ProfileScope.Own;
  const { canEdit } = useProfileFieldAccess({ scope });
  const form = useForm<StaffAdminEditFormData>({
    resolver: zodResolver(isAdminScope ? staffAdminEditSchema : staffOwnEditSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: AccountStatus.Activated,
      displayCurrency: null,
    },
  });

  useEffect(() => {
    form.reset({
      name: staffData.name ?? "",
      email: staffData.email ?? "",
      phone: staffData.phone ?? "",
      status: staffData.status ?? AccountStatus.Activated,
      displayCurrency: displayCurrency ?? null,
    });
  }, [displayCurrency, form, staffData]);

  const onValidSubmit = async (values: StaffAdminEditFormData) => {
    await onSubmit(values);
  };

  const showAccountSection = canEdit("core_identity") || (isAdminScope && canEdit("staff_role"));

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
          {showAccountSection ? (
            <AccountSection
              mode="edit"
              scope={scope}
              staffData={staffData}
              isAdminScope={isAdminScope}
              register={form.register}
              control={form.control}
            />
          ) : null}
          {canEdit("core_contact") ? <ContactSection mode="edit" scope={scope} control={form.control} /> : null}
        </Box>
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
