"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
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

type FieldScope = ReturnType<typeof useProfileFieldAccess>["canEdit"];

function buildDefaultFormValues(data?: TeacherEditData | null): TeacherAdminEditFormData {
  return {
    name: data?.name ?? "",
    email: data?.email ?? "",
    avatarUrl: data?.avatarUrl ?? null,
    phone: data?.phone ?? "",
    nationalId: data?.nationalId ?? "",
    dateOfBirth: data?.dateOfBirth ?? "",
    gender: data?.gender ?? null,
    address: data?.address ?? "",
    qualifications: data?.qualifications ?? "",
    timezone: data?.timezone ?? "",
    hourlyRate: data?.hourlyRate ?? "",
    rateCurrency: data?.rateCurrency ?? undefined,
    status: data?.status ?? AccountStatus.Activated,
    displayCurrency: data?.displayCurrency ?? null,
  };
}

function useTeacherEditForm(teacherData: TeacherEditData) {
  const form = useForm<TeacherAdminEditFormData>({
    resolver: zodResolver(teacherAdminEditSchema),
    defaultValues: buildDefaultFormValues(),
  });

  useEffect(() => {
    form.reset(buildDefaultFormValues(teacherData));
  }, [form, teacherData]);

  return form;
}

function useSubmitFeedbackStates() {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  return { successOpen, errorOpen, setSuccessOpen, setErrorOpen };
}

interface SectionsGridProps {
  readonly teacherData: TeacherEditData;
  readonly targetUserId: string;
  readonly scope: ProfileScope;
  readonly canEdit: FieldScope;
  readonly form: UseFormReturn<TeacherAdminEditFormData>;
}

function TeacherFormSectionsGrid({ teacherData, targetUserId, scope, canEdit, form }: SectionsGridProps) {
  return (
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
  );
}

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
  const { successOpen, errorOpen, setSuccessOpen, setErrorOpen } = useSubmitFeedbackStates();
  const form = useTeacherEditForm(teacherData);

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
        <TeacherFormSectionsGrid
          teacherData={teacherData}
          targetUserId={targetUserId}
          scope={scope}
          canEdit={canEdit}
          form={form}
        />
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {isSaving ? t.shell.loading : t.actions.save}
        </PrimaryPageAction>
      </Stack>
      <FormSuccessSnackbar
        open={successOpen}
        message={base.actions.saveSuccess}
        onClose={() => setSuccessOpen(false)}
      />
      <FormErrorSnackbar open={errorOpen} message={base.actions.saveError} onClose={() => setErrorOpen(false)} />
    </Box>
  );
}
