"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/components/ui";
import { AccountSection } from "./sections/AccountSection";
import { ContactSection } from "./sections/ContactSection";
import { ZoomSection } from "./sections/ZoomSection";
import { type TeacherEditData, type TeacherOwnEditFormData, teacherOwnEditSchema } from "./teacherProfileFormTypes";

export type { TeacherOwnEditFormData } from "./teacherProfileFormTypes";

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
  const form = useForm<TeacherOwnEditFormData>({
    resolver: zodResolver(teacherOwnEditSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      zoomLink: "",
    },
  });

  useEffect(() => {
    form.reset({
      name: teacherData.name ?? "",
      email: teacherData.email ?? "",
      phone: teacherData.phone ?? "",
      zoomLink: teacherData.zoomLink ?? "",
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
          <AccountSection
            mode="edit"
            teacherData={{ name: teacherData.name ?? null, email: teacherData.email ?? null }}
            avatarUrl={avatarUrl}
            register={form.register}
          />
          <ContactSection mode="edit" isAdminScope={false} register={form.register} />
          <ZoomSection mode="edit" isAdminScope={false} register={form.register} />
        </Box>
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {isSaving ? tc("shell.loading") : tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
