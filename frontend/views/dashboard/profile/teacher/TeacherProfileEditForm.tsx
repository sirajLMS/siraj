"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/views/dashboard/profile/teacher/sections/AccountSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/teacher/sections/ContactSection";
import {
  type TeacherEditData,
  type TeacherOwnEditFormData,
  teacherOwnEditSchema,
} from "@/frontend/views/dashboard/profile/teacher/teacherProfileFormTypes";

export type { TeacherEditData, TeacherOwnEditFormData };

export function TeacherProfileEditForm({
  teacherData,
  avatarUrl,
  isSaving,
  onSubmit,
}: {
  readonly teacherData: TeacherEditData;
  readonly avatarUrl?: string | null;
  readonly isSaving: boolean;
  readonly onSubmit: (values: TeacherOwnEditFormData) => Promise<void>;
}) {
  const tc = useTranslations("profile");
  const scope = ProfileScope.Own;
  const { canEdit } = useProfileFieldAccess({ scope });
  const form = useForm<TeacherOwnEditFormData>({
    resolver: zodResolver(teacherOwnEditSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      displayCurrency: null,
    },
  });

  useEffect(() => {
    form.reset({
      name: teacherData.name ?? "",
      email: teacherData.email ?? "",
      phone: teacherData.phone ?? "",
      displayCurrency: teacherData.displayCurrency ?? null,
    });
  }, [form, teacherData]);

  const onValidSubmit = async (values: TeacherOwnEditFormData) => {
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
          {canEdit("core_identity") ? (
            <AccountSection
              mode="edit"
              scope={scope}
              teacherData={{ name: teacherData.name ?? null, email: teacherData.email ?? null }}
              avatarUrl={avatarUrl}
              register={form.register}
              control={form.control}
            />
          ) : null}
          {canEdit("core_contact") || canEdit("teacher_identity") ? (
            <ContactSection
              mode="edit"
              scope={scope}
              isAdminScope={false}
              register={form.register}
              control={form.control}
            />
          ) : null}
        </Box>
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {isSaving ? tc("shell.loading") : tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
