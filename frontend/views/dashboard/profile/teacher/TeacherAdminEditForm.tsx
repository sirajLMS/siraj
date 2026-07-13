"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { AccountStatus, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/views/dashboard/profile/teacher/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/teacher/sections/ContactSection";
import {
  type TeacherAdminEditFormData,
  type TeacherEditData,
  teacherAdminEditSchema,
} from "@/frontend/views/dashboard/profile/teacher/teacherProfileFormTypes";

export function TeacherAdminEditForm({
  teacherData,
  avatarUrl,
  targetUserId,
  isSaving,
  onSubmit,
}: {
  readonly teacherData: TeacherEditData;
  readonly avatarUrl?: string | null;
  readonly targetUserId?: string;
  readonly isSaving: boolean;
  readonly onSubmit: (values: TeacherAdminEditFormData) => Promise<void>;
}) {
  const tc = useTranslations("profile");
  const scope = ProfileScope.Other;
  const { canEdit } = useProfileFieldAccess({ scope });
  const form = useForm<TeacherAdminEditFormData>({
    resolver: zodResolver(teacherAdminEditSchema),
    defaultValues: {
      name: "",
      email: "",
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
            <ContactSection mode="edit" scope={scope} isAdminScope register={form.register} control={form.control} />
          ) : null}
          {targetUserId ? <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} /> : null}
          {canEdit("teacher_professional") ? (
            <CompensationSection mode="edit" register={form.register} control={form.control} />
          ) : null}
          {canEdit("teacher_identity") ? (
            <AdminOnlySection mode="edit" register={form.register} control={form.control} />
          ) : null}
        </Box>
        <PrimaryPageAction type="submit" disabled={isSaving}>
          {isSaving ? tc("shell.loading") : tc("actions.save")}
        </PrimaryPageAction>
      </Stack>
    </Box>
  );
}
