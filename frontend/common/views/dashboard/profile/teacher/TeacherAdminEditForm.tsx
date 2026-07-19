"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormErrorSnackbar, FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { AccountStatus, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/ContactSection";
import {
  type TeacherAdminEditFormData,
  type TeacherEditData,
  teacherAdminEditSchema,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import { useAppTranslation } from "@/shared/locale";

export function TeacherAdminEditForm({
  teacherData,
  targetUserId,
  isSaving,
  onSubmit,
}: {
  readonly teacherData: TeacherEditData;
  readonly targetUserId: string;
  readonly isSaving: boolean;
  readonly onSubmit: (values: TeacherAdminEditFormData) => Promise<void>;
}) {
  const t = useAppTranslation().profileTranslations.teacher;
  const base = useAppTranslation().profileTranslations.base;
  const scope = ProfileScope.Other;
  const { canEdit } = useProfileFieldAccess({ scope });
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: targetUserId });
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const form = useForm<TeacherAdminEditFormData>({
    resolver: zodResolver(teacherAdminEditSchema),
    defaultValues: {
      name: "",
      email: "",
      avatarUrl: null,
      phone: "",
      nationalId: "",
      dateOfBirth: "",
      gender: null,
      address: "",
      qualifications: "",
      timezone: "",
      hourlyRate: "",
      rateCurrency: undefined,
      status: AccountStatus.Activated,
      displayCurrency: null,
    },
  });

  useEffect(() => {
    form.reset({
      name: teacherData.name ?? "",
      email: teacherData.email ?? "",
      avatarUrl: teacherData.avatarUrl ?? null,
      phone: teacherData.phone ?? "",
      nationalId: teacherData.nationalId ?? "",
      dateOfBirth: teacherData.dateOfBirth ?? "",
      gender: teacherData.gender ?? null,
      address: teacherData.address ?? "",
      qualifications: teacherData.qualifications ?? "",
      timezone: teacherData.timezone ?? "",
      hourlyRate: teacherData.hourlyRate ?? "",
      rateCurrency: teacherData.rateCurrency ?? undefined,
      status: teacherData.status ?? AccountStatus.Activated,
      displayCurrency: teacherData.displayCurrency ?? null,
    });
  }, [form, teacherData]);

  const onValidSubmit = async (values: TeacherAdminEditFormData) => {
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
            label={t.fields.avatar}
            title={base.editAvatarTitle}
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
              teacherData={{ name: teacherData.name ?? null, email: teacherData.email ?? null }}
              register={form.register}
              control={form.control}
            />
          ) : null}
          {canEdit("core_contact") || canEdit("teacher_identity") ? (
            <ContactSection mode="edit" scope={scope} isAdminScope register={form.register} control={form.control} />
          ) : null}
          <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} />
          {canEdit("teacher_professional") ? (
            <CompensationSection mode="edit" register={form.register} control={form.control} />
          ) : null}
          {canEdit("teacher_identity") ? (
            <AdminOnlySection mode="edit" register={form.register} control={form.control} />
          ) : null}
        </Box>
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {isSaving ? t.shell.loading : t.actions.save}
        </PrimaryPageAction>
      </Stack>
      <FormSuccessSnackbar open={successOpen} message={base.actions.saveSuccess} onClose={() => setSuccessOpen(false)} />
      <FormErrorSnackbar open={errorOpen} message={base.actions.saveError} onClose={() => setErrorOpen(false)} />
    </Box>
  );
}
