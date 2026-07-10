"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/components/ui";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { AccountSection } from "@/frontend/views/dashboard/profile/teacher/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/teacher/sections/ContactSection";
import { ZoomSection } from "@/frontend/views/dashboard/profile/teacher/sections/ZoomSection";
import {
  type TeacherAdminEditFormData,
  type TeacherEditData,
  teacherAdminEditSchema,
} from "@/frontend/views/dashboard/profile/teacher/teacherProfileFormTypes";

export function TeacherAdminEditForm({
  teacherData,
  avatarUrl,
  hasZoomPassword,
  isSaving,
  onSubmit,
}: {
  readonly teacherData: TeacherEditData;
  readonly avatarUrl?: string | null;
  readonly hasZoomPassword?: boolean;
  readonly isSaving: boolean;
  readonly onSubmit: (values: TeacherAdminEditFormData) => Promise<void>;
}) {
  const tc = useTranslations("profile");
  const form = useForm<TeacherAdminEditFormData>({
    resolver: zodResolver(teacherAdminEditSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      zoomLink: "",
      nationalId: "",
      dateOfBirth: "",
      gender: null,
      address: "",
      qualifications: "",
      zoomUsername: "",
      zoomPassword: "",
      timezone: "",
      hourlyRate: "",
      rateCurrency: undefined,
      paymentMethod: null,
      status: AccountStatus.Activated,
    },
  });

  useEffect(() => {
    form.reset({
      name: teacherData.name ?? "",
      email: teacherData.email ?? "",
      phone: teacherData.phone ?? "",
      zoomLink: teacherData.zoomLink ?? "",
      nationalId: teacherData.nationalId ?? "",
      dateOfBirth: teacherData.dateOfBirth ?? "",
      gender: teacherData.gender ?? null,
      address: teacherData.address ?? "",
      qualifications: teacherData.qualifications ?? "",
      zoomUsername: teacherData.zoomUsername ?? "",
      zoomPassword: "",
      timezone: teacherData.timezone ?? "",
      hourlyRate: teacherData.hourlyRate ?? "",
      rateCurrency: teacherData.rateCurrency ?? undefined,
      paymentMethod: teacherData.paymentMethod ?? null,
      status: teacherData.status ?? AccountStatus.Activated,
    });
  }, [form, teacherData]);

  const onValidSubmit = async (values: TeacherAdminEditFormData) => {
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
          <ContactSection mode="edit" isAdminScope register={form.register} control={form.control} />
          <ZoomSection mode="edit" isAdminScope register={form.register} hasZoomPassword={hasZoomPassword} />
          <CompensationSection mode="edit" register={form.register} control={form.control} />
          <AdminOnlySection mode="edit" register={form.register} control={form.control} />
        </Box>
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {isSaving ? tc("shell.loading") : tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
