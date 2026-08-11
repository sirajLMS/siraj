"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Stack } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { FormErrorSnackbar, FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { AccountStatus, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import {
  AdminResetPasswordSection,
  type AdminResetPasswordSectionRef,
} from "@/frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection";
import { TeacherExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection";
import { useAdminResetPassword } from "@/frontend/common/views/dashboard/profile/shared/useAdminResetPassword";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/ContactSection";
import {
  toTeacherPersonalFieldLabels,
  toTeacherSectionLabels,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils";
import type { TeacherProfileViewLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import {
  type TeacherAdminEditFormData,
  type TeacherEditData,
  teacherAdminEditSchema,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";

type FieldScope = ReturnType<typeof useProfileFieldAccess>["canEdit"];

function buildDefaultFormValues(data?: TeacherEditData | null): TeacherAdminEditFormData {
  return {
    name: data?.name ?? "",
    email: data?.email ?? "",
    avatarUrl: data?.avatarUrl ?? null,
    phone: data?.phone ?? "",
    nationalId: data?.nationalId ?? "",
    nationality: data?.nationality ?? "",
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
  readonly labels: TeacherProfileViewLabels;
  readonly teacherData: TeacherEditData;
  readonly targetUserId: string;
  readonly scope: ProfileScope;
  readonly canEdit: FieldScope;
  readonly form: UseFormReturn<TeacherAdminEditFormData>;
}

function TeacherFormSectionsGrid({ labels, teacherData, targetUserId, scope, canEdit, form }: SectionsGridProps) {
  const sectionLabels = toTeacherSectionLabels(labels);
  const personalFieldLabels = toTeacherPersonalFieldLabels(labels);

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
          labels={sectionLabels}
          mode="edit"
          scope={scope}
          teacherData={{ name: teacherData.name ?? null, email: teacherData.email ?? null }}
          register={form.register}
          control={form.control}
        />
      ) : null}
      {canEdit("core_contact") || canEdit("teacher_identity") ? (
        <ContactSection
          labels={sectionLabels}
          scope={scope}
          isAdminScope
          register={form.register}
          control={form.control}
        />
      ) : null}
      <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} />
      {canEdit("teacher_professional") ? (
        <CompensationSection labels={labels} mode="edit" register={form.register} control={form.control} />
      ) : null}
      {canEdit("teacher_identity") || canEdit("teacher_professional") ? (
        <TeacherExtensionProfileSection
          mode="edit"
          scope={scope}
          labels={{
            teacher: labels.teacher,
            personalFieldLabels,
            baseLabels: sectionLabels.baseLabels,
          }}
          sectionTitle={labels.teacher.sections.identity}
          register={form.register}
          control={form.control}
        />
      ) : null}
      {canEdit("teacher_identity") ? (
        <AdminOnlySection labels={sectionLabels} mode="edit" register={form.register} />
      ) : null}
    </Box>
  );
}

export function TeacherAdminEditForm({
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
  readonly onSubmit: (values: TeacherAdminEditFormData) => Promise<void>;
}) {
  const t = labels.teacher;
  const base = labels.base;
  const scope = ProfileScope.Other;
  const { canEdit, canAdminResetPassword } = useProfileFieldAccess({ scope });
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: targetUserId });
  const { successOpen, errorOpen, setSuccessOpen, setErrorOpen } = useSubmitFeedbackStates();
  const form = useTeacherEditForm(teacherData);
  const resetPasswordRef = useRef<AdminResetPasswordSectionRef>(null);
  const { resetPassword } = useAdminResetPassword(base.adminResetPassword.success, base.adminResetPassword.error);

  const onValidSubmit = useCallback(
    async (values: TeacherAdminEditFormData) => {
      try {
        await onSubmit(values);
        const resetData = resetPasswordRef.current?.getResetPasswordData();
        if (resetData?.isValid) {
          const success = await resetPassword(targetUserId, resetData.newPassword, resetData.sendNotificationEmail);
          if (success) {
            resetPasswordRef.current?.reset();
          }
        }
        setSuccessOpen(true);
      } catch {
        setErrorOpen(true);
      }
    },
    [onSubmit, resetPassword, targetUserId, setSuccessOpen, setErrorOpen]
  );

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      void form.handleSubmit(onValidSubmit)(e);
    },
    [form, onValidSubmit]
  );

  const canResetPassword = canAdminResetPassword();
  const teacherName = teacherData.name ?? "";
  const teacherEmail = teacherData.email ?? "";

  return (
    <Box component="form" onSubmit={handleSubmit}>
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
          labels={labels}
          teacherData={teacherData}
          targetUserId={targetUserId}
          scope={scope}
          canEdit={canEdit}
          form={form}
        />
        {canResetPassword && (
          <AdminResetPasswordSection
            ref={resetPasswordRef}
            targetUserId={targetUserId}
            userName={teacherName}
            userEmail={teacherEmail}
          />
        )}
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
