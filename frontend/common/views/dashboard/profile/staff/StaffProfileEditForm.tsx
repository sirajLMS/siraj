"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormErrorSnackbar, FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { AccountStatus, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { ChangePasswordSection } from "@/frontend/common/views/dashboard/profile/core/components/ChangePasswordSection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/staff/sections/AccountSection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/staff/sections/CompensationSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/staff/sections/ContactSection";
import type { StaffProfileData } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import { toStaffSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import {
  type StaffAdminEditFormData,
  staffAdminEditSchema,
  staffOwnEditSchema,
} from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import { useStaffProfileEditFormViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileEditFormViewModel";

interface StaffProfileEditFormProps {
  readonly staffData: StaffProfileData;
  readonly avatarUrl?: string | null;
  readonly displayCurrency: StaffAdminEditFormData["displayCurrency"];
  readonly profileTimezone?: string | null;
  readonly targetUserId: string;
  readonly isAdminScope: boolean;
  readonly isSaving: boolean;
  readonly onSubmit: (values: StaffAdminEditFormData) => Promise<void>;
}

function buildSectionLabels(labels: ReturnType<typeof useStaffProfileEditFormViewModel>["labels"]) {
  const { base: tc, staff: st } = labels;
  return {
    staff: st,
    baseLabels: toStaffSharedBaseLabels(tc),
  };
}

function buildCompensationViewLabels(
  labels: ReturnType<typeof useStaffProfileEditFormViewModel>["labels"],
  errorLabels: ReturnType<typeof useStaffProfileEditFormViewModel>["errorLabels"]
) {
  const { base: tc, staff: st } = labels;
  return {
    staff: st,
    baseLabels: {
      convertedAmount: tc.convertedAmount,
      convertedTotalApprox: tc.convertedTotalApprox,
    },
    errorLabels,
  };
}

function CompensationSectionRenderer({
  showCompensationEditSection,
  showCompensationViewSection,
  compensationViewLabels,
  st,
  form,
  staffData,
}: {
  readonly showCompensationEditSection: boolean;
  readonly showCompensationViewSection: boolean;
  readonly compensationViewLabels: ReturnType<typeof buildCompensationViewLabels>;
  readonly st: ReturnType<typeof useStaffProfileEditFormViewModel>["labels"]["staff"];
  readonly form: ReturnType<typeof useForm<StaffAdminEditFormData>>;
  readonly staffData: StaffProfileData;
}): React.ReactNode {
  if (showCompensationEditSection) {
    return <CompensationSection mode="edit" labels={{ staff: st }} register={form.register} control={form.control} />;
  }
  if (showCompensationViewSection) {
    return (
      <CompensationSection
        mode="view"
        labels={compensationViewLabels}
        staffData={staffData}
        subjectUserId={staffData.id ?? undefined}
      />
    );
  }
  return null;
}

function useFormSubmitHandler(
  onSubmit: StaffProfileEditFormProps["onSubmit"],
  setSuccessOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setErrorOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
  return async (values: StaffAdminEditFormData) => {
    try {
      await onSubmit(values);
      setSuccessOpen(true);
    } catch {
      setErrorOpen(true);
    }
  };
}

function useFormResetEffect(
  form: ReturnType<typeof useForm<StaffAdminEditFormData>>,
  staffData: StaffProfileData,
  avatarUrl: string | null | undefined,
  displayCurrency: StaffAdminEditFormData["displayCurrency"],
  profileTimezone: string | null | undefined
) {
  useEffect(() => {
    form.reset({
      name: staffData.name ?? "",
      email: staffData.email ?? "",
      avatarUrl: avatarUrl ?? staffData.avatarUrl ?? null,
      phone: staffData.phone ?? "",
      timezone: profileTimezone ?? "",
      status: staffData.status ?? AccountStatus.Activated,
      displayCurrency: displayCurrency ?? null,
      hourlyRate: staffData.hourlyRate ?? "",
      rateCurrency: staffData.rateCurrency ?? null,
    });
  }, [avatarUrl, displayCurrency, form, profileTimezone, staffData]);
}

export function StaffProfileEditForm({
  staffData,
  avatarUrl,
  displayCurrency,
  profileTimezone,
  targetUserId,
  isAdminScope,
  isSaving,
  onSubmit,
}: StaffProfileEditFormProps) {
  const { labels, errorLabels } = useStaffProfileEditFormViewModel();
  const sectionLabels = buildSectionLabels(labels);
  const compensationViewLabels = buildCompensationViewLabels(labels, errorLabels);
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
      timezone: "",
      status: AccountStatus.Activated,
      displayCurrency: null,
      hourlyRate: "",
      rateCurrency: null,
    },
  });

  useFormResetEffect(form, staffData, avatarUrl, displayCurrency, profileTimezone);
  const onValidSubmit = useFormSubmitHandler(onSubmit, setSuccessOpen, setErrorOpen);

  const showAccountSection = canEdit("core_identity") || (isAdminScope && canEdit("staff_role"));
  const showCompensationViewSection =
    canView("staff_role") && (isAdminScope || Boolean(staffData.hourlyRate || staffData.rateCurrency));
  const showCompensationEditSection = isAdminScope && canEdit("staff_role");

  return (
    <Stack spacing={3}>
      <Box component="form" onSubmit={form.handleSubmit(onValidSubmit)}>
        <Stack spacing={3}>
          {canEdit("core_identity") ? (
            <AvatarImageField
              control={form.control}
              name="avatarUrl"
              label={labels.staff.fields.avatar}
              title={labels.base.editAvatarTitle}
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
                labels={sectionLabels}
                scope={scope}
                staffData={staffData}
                isAdminScope={isAdminScope}
                register={form.register}
                control={form.control}
              />
            ) : null}
            {canEdit("core_contact") ? (
              <ContactSection mode="edit" labels={sectionLabels} scope={scope} control={form.control} />
            ) : null}
            <CompensationSectionRenderer
              showCompensationEditSection={showCompensationEditSection}
              showCompensationViewSection={showCompensationViewSection}
              compensationViewLabels={compensationViewLabels}
              st={labels.staff}
              form={form}
              staffData={staffData}
            />
          </Box>
          <PrimaryPageAction type="submit" disabled={isSaving}>
            {labels.base.actions.save}
          </PrimaryPageAction>
        </Stack>
      </Box>
      {!isAdminScope && <ChangePasswordSection />}
      <FormSuccessSnackbar
        open={successOpen}
        message={labels.base.actions.saveSuccess}
        onClose={() => setSuccessOpen(false)}
      />
      <FormErrorSnackbar open={errorOpen} message={labels.base.actions.saveError} onClose={() => setErrorOpen(false)} />
    </Stack>
  );
}
