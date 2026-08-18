"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { ChangePasswordSection } from "@/frontend/common/views/dashboard/profile/core/components/ChangePasswordSection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import {
  toTeacherPersonalFieldLabels,
  toTeacherSectionLabels,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils";
import type { TeacherProfileViewLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { TeacherProfileOwnEditFormBody } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileOwnEditFormBody";
import {
  type TeacherEditData,
  type TeacherOwnEditFormData,
  teacherOwnEditSchemaFactory,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";

export type { TeacherEditData, TeacherOwnEditFormData };

export function TeacherProfileEditForm({
  labels,
  teacherData,
  targetUserId,
  isSaving,
  onSubmit,
}: {
  readonly labels: TeacherProfileViewLabels;
  readonly teacherData: TeacherEditData;
  readonly targetUserId: string;
  readonly isSaving: boolean;
  readonly onSubmit: (values: TeacherOwnEditFormData) => Promise<void>;
}) {
  const t = labels.teacher;
  const base = labels.base;
  const sectionLabels = toTeacherSectionLabels(labels);
  const personalFieldLabels = toTeacherPersonalFieldLabels(labels);
  const { canEdit } = useProfileFieldAccess();
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: targetUserId });
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const schema = teacherOwnEditSchemaFactory({
    nationalIdRequired: t.validation.nationalIdRequired,
    nationalIdInvalid: t.validation.nationalIdInvalid,
    invalidTimezone: t.validation.invalidTimezone,
  });
  const form = useForm<TeacherOwnEditFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      avatarUrl: null,
      phone: "",
      nationalId: "",
      nationality: "",
      timezone: "",
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
      nationality: teacherData.nationality ?? "",
      timezone: teacherData.timezone ?? "",
      displayCurrency: teacherData.displayCurrency ?? null,
    });
  }, [form, teacherData]);

  const onValidSubmit = async (values: TeacherOwnEditFormData) => {
    try {
      await onSubmit(values);
      setSuccessOpen(true);
    } catch {
      setErrorOpen(true);
    }
  };

  return (
    <Stack spacing={3}>
      <Box component="form" onSubmit={form.handleSubmit(onValidSubmit)}>
        <Stack spacing={3}>
          <TeacherProfileOwnEditFormBody
            canEdit={canEdit}
            control={form.control}
            register={form.register}
            sectionLabels={sectionLabels}
            personalFieldLabels={personalFieldLabels}
            teacherData={{ name: teacherData.name ?? null, email: teacherData.email ?? null }}
            identitySectionTitle={t.sections.identity}
            nationalIdLabel={t.fields.nationalId}
            nationalIdError={form.formState.errors.nationalId?.message}
            avatarLabel={t.fields.avatar}
            editAvatarTitle={base.editAvatarTitle}
            onUploadAvatar={onUploadAvatar}
          />
          <PrimaryPageAction type="submit" disabled={isSaving}>
            {isSaving ? t.shell.loading : t.actions.save}
          </PrimaryPageAction>
        </Stack>
      </Box>
      <ChangePasswordSection />
      <FormSuccessSnackbar
        open={successOpen}
        message={base.actions.saveSuccess}
        onClose={() => setSuccessOpen(false)}
      />
      <FormErrorSnackbar open={errorOpen} message={base.actions.saveError} onClose={() => setErrorOpen(false)} />
    </Stack>
  );
}
