"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormErrorSnackbar, FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { ChangePasswordSection } from "@/frontend/common/views/dashboard/profile/core/components/ChangePasswordSection";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AccountSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/ContactSection";
import {
  type TeacherEditData,
  type TeacherOwnEditFormData,
  teacherOwnEditSchemaFactory,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import { useAppTranslation } from "@/shared/locale";

export type { TeacherEditData, TeacherOwnEditFormData };

export function TeacherProfileEditForm({
  teacherData,
  targetUserId,
  isSaving,
  onSubmit,
}: {
  readonly teacherData: TeacherEditData;
  readonly targetUserId: string;
  readonly isSaving: boolean;
  readonly onSubmit: (values: TeacherOwnEditFormData) => Promise<void>;
}) {
  const t = useAppTranslation().profileTranslations.teacher;
  const base = useAppTranslation().profileTranslations.base;
  const scope = ProfileScope.Own;
  const { canEdit } = useProfileFieldAccess({ scope });
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: targetUserId });
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const schema = teacherOwnEditSchemaFactory({
    nationalIdRequired: t.validation.nationalIdRequired,
    nationalIdInvalid: t.validation.nationalIdInvalid,
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
              <ContactSection scope={scope} isAdminScope={false} register={form.register} control={form.control} />
            ) : null}
            <TextField
              {...form.register("nationalId")}
              label={t.fields.nationalId}
              required
              error={Boolean(form.formState.errors.nationalId)}
              helperText={form.formState.errors.nationalId?.message}
              fullWidth
              size="small"
            />
          </Box>
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
