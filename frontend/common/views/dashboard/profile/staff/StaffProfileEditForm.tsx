"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormErrorSnackbar, FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { AccountStatus, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/staff/sections/AccountSection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/staff/sections/CompensationSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/staff/sections/ContactSection";
import type { StaffProfileData } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import {
  type StaffAdminEditFormData,
  staffAdminEditSchema,
  staffOwnEditSchema,
} from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import { useAppTranslation } from "@/shared/locale";

export function StaffProfileEditForm({
  staffData,
  avatarUrl,
  displayCurrency,
  targetUserId,
  isAdminScope,
  isSaving,
  onSubmit,
}: {
  readonly staffData: StaffProfileData;
  readonly avatarUrl?: string | null;
  readonly displayCurrency: StaffAdminEditFormData["displayCurrency"];
  readonly targetUserId: string;
  readonly isAdminScope: boolean;
  readonly isSaving: boolean;
  readonly onSubmit: (values: StaffAdminEditFormData) => Promise<void>;
}) {
  const tc = useAppTranslation().profileTranslations.base;
  const st = useAppTranslation().profileTranslations.staff;
  const scope = isAdminScope ? ProfileScope.Other : ProfileScope.Own;
  const { canView, canEdit } = useProfileFieldAccess({ scope });
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: targetUserId });
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const form = useForm<StaffAdminEditFormData>({
    resolver: zodResolver(isAdminScope ? staffAdminEditSchema : staffOwnEditSchema),
    defaultValues: {
      name: "",
      email: "",
      avatarUrl: null,
      phone: "",
      status: AccountStatus.Activated,
      displayCurrency: null,
      hourlyRate: "",
      rateCurrency: null,
    },
  });

  useEffect(() => {
    form.reset({
      name: staffData.name ?? "",
      email: staffData.email ?? "",
      avatarUrl: avatarUrl ?? staffData.avatarUrl ?? null,
      phone: staffData.phone ?? "",
      status: staffData.status ?? AccountStatus.Activated,
      displayCurrency: displayCurrency ?? null,
      hourlyRate: staffData.hourlyRate ?? "",
      rateCurrency: staffData.rateCurrency ?? null,
    });
  }, [avatarUrl, displayCurrency, form, staffData]);

  const onValidSubmit = async (values: StaffAdminEditFormData) => {
    try {
      await onSubmit(values);
      setSuccessOpen(true);
    } catch {
      setErrorOpen(true);
    }
  };

  const showAccountSection = canEdit("core_identity") || (isAdminScope && canEdit("staff_role"));
  const showCompensationViewSection =
    canView("staff_role") && (isAdminScope || Boolean(staffData.hourlyRate || staffData.rateCurrency));
  const showCompensationEditSection = isAdminScope && canEdit("staff_role");

  let compensationSection: React.ReactNode = null;
  if (showCompensationEditSection) {
    compensationSection = <CompensationSection mode="edit" register={form.register} control={form.control} />;
  } else if (showCompensationViewSection) {
    compensationSection = (
      <CompensationSection mode="view" staffData={staffData} subjectUserId={staffData.id ?? undefined} />
    );
  }

  return (
    <Box component="form" onSubmit={form.handleSubmit(onValidSubmit)}>
      <Stack spacing={3}>
        {canEdit("core_identity") ? (
          <AvatarImageField
            control={form.control}
            name="avatarUrl"
            label={st.fields.avatar}
            title={tc.editAvatarTitle}
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
          {compensationSection}
        </Box>
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {tc.actions.save}
        </PrimaryPageAction>
      </Stack>
      <FormSuccessSnackbar open={successOpen} message={tc.actions.saveSuccess} onClose={() => setSuccessOpen(false)} />
      <FormErrorSnackbar open={errorOpen} message={tc.actions.saveError} onClose={() => setErrorOpen(false)} />
    </Box>
  );
}
