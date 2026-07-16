"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircleOutlined, EditOutlined, Save, ScheduleOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { useEffect } from "react";
import { FormProvider, type UseFormReturn, useForm } from "react-hook-form";
import {
  PageContainer,
  PageHeader,
  type PageHeaderBreadcrumb,
  PrimaryPageAction,
  UserAvatar,
} from "@/frontend/common/components/ui";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { ContextualHelperCards } from "@/frontend/common/views/dashboard/students/quota/components/ContextualHelperCards";
import { CourseDetailsSection } from "@/frontend/common/views/dashboard/students/quota/components/CourseDetailsSection";
import { StudentInformationSection } from "@/frontend/common/views/dashboard/students/quota/components/StudentInformationSection";
import { QuotaFormAccessProvider } from "@/frontend/common/views/dashboard/students/quota/QuotaFormAccessProvider";
import {
  createStudentQuotaSchema,
  type StudentQuotaFormData,
  type StudentQuotaFormInput,
} from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import type {
  FormActionsProps,
  MobileProfileHeaderProps,
  StudentQuotaViewProps,
} from "@/frontend/common/views/dashboard/students/quota/types";
import { useAppTranslation } from "@/shared/locale/client";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

function MobileProfileHeader({ studentData, onEditAvatar, showAvatarEdit }: Readonly<MobileProfileHeaderProps>) {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  return (
    <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", alignItems: "center", py: 4 }}>
      <Box sx={{ position: "relative", width: 96, height: 96, mb: 2 }}>
        <UserAvatar
          src={studentData.profileImage}
          label={studentData.studentName}
          size={96}
          sx={theme => ({
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: theme.palette.shadow.card,
          })}
        />
        {showAvatarEdit ? (
          <IconButton
            onClick={onEditAvatar}
            sx={theme => ({
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
              p: 0.75,
              border: `2px solid ${theme.palette.background.paper}`,
              "&:hover": { backgroundColor: theme.palette.primary.dark },
            })}
          >
            <EditOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}
      </Box>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
        {t.studentId(studentData.id)}
      </Typography>
    </Box>
  );
}

function DesktopBreadcrumbs(t: StudentQuotaLabels): readonly PageHeaderBreadcrumb[] {
  return [
    { label: t.breadcrumbs.students, href: "/students" },
    { label: t.breadcrumbs.adjustQuota, current: true },
  ];
}

function FormActions({
  isSaving,
  isSaved,
  studentData,
  onCancel,
  readOnly = false,
  showCancel = true,
}: Readonly<FormActionsProps>) {
  const t = useAppTranslation().dashboardTranslations.studentQuota;

  let saveIcon = <Save />;
  if (isSaving) saveIcon = <SyncOutlined sx={{ animation: "spin 1s linear infinite" }} />;
  else if (isSaved) saveIcon = <CheckCircleOutlined />;

  let saveText = t.actions.save;
  if (isSaving) saveText = t.actions.saving;
  else if (isSaved) saveText = t.actions.saved;

  return (
    <Box
      sx={{
        pt: { xs: 3, md: 5 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 1.5, md: 2 },
          width: { xs: "100%", md: "auto" },
        }}
      >
        {readOnly ? null : (
          <PrimaryPageAction
            type="submit"
            disabled={isSaving || isSaved}
            startIcon={saveIcon}
            sx={theme => ({
              height: { xs: 56, md: 48 },
              px: { xs: 0, md: 5 },
              backgroundColor: isSaved ? theme.palette.primary.main : theme.palette.success.main,
              color: isSaved ? theme.palette.onPrimary : theme.palette.onSuccess,
              "&:hover": { backgroundColor: isSaved ? theme.palette.primary.dark : theme.palette.success.dark },
              "&.Mui-disabled": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                opacity: 0.8,
              },
              width: { xs: "100%", md: "auto" },
            })}
          >
            {saveText}
          </PrimaryPageAction>
        )}
        {showCancel ? (
          <PrimaryPageAction
            type="button"
            variant="text"
            onClick={onCancel}
            disabled={isSaving}
            sx={theme => ({
              height: { xs: 48, md: 48 },
              px: { xs: 0, md: 4 },
              color: theme.palette.onSurfaceVariant,
              "&:hover": {
                color: theme.palette.error.main,
                backgroundColor: { xs: theme.palette.surfaceContainerLow, md: "transparent" },
              },
              width: { xs: "100%", md: "auto" },
            })}
          >
            {t.actions.cancel}
          </PrimaryPageAction>
        ) : null}
      </Box>

      {studentData.lastEditedTime && (
        <Box
          sx={theme => ({
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 1,
            color: theme.palette.onSurfaceVariant,
          })}
        >
          <ScheduleOutlined sx={{ fontSize: 14 }} />
          <Typography variant="labelMd">{t.actions.lastEditedAt(studentData.lastEditedTime)}</Typography>
        </Box>
      )}
    </Box>
  );
}

function QuotaFormCard({
  methods,
  onSubmit,
  studentData,
  isSaving,
  isSaved,
  readOnly,
  embedded,
  onCancel,
  canEditIdentity,
  canEditQuota,
  canViewQuota,
  canViewTeacher,
}: Readonly<{
  methods: UseFormReturn<StudentQuotaFormInput, undefined, StudentQuotaFormData>;
  onSubmit: (data: StudentQuotaFormData) => Promise<void>;
  studentData: NonNullable<StudentQuotaViewProps["studentData"]>;
  isSaving: boolean;
  isSaved: boolean;
  readOnly: boolean;
  embedded: boolean;
  onCancel: () => void;
  canEditIdentity: boolean;
  canEditQuota: boolean;
  canViewQuota: boolean;
  canViewTeacher: boolean;
}>) {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const showAvatarEdit = !embedded && !readOnly && canEditIdentity;

  return (
    <>
      {!embedded ? <MobileProfileHeader studentData={studentData} showAvatarEdit={showAvatarEdit} /> : null}
      {!embedded ? (
        <Box sx={{ display: { xs: "none", md: "flex" }, mb: 3 }}>
          <PageHeader title={t.breadcrumbs.adjustQuota} titleVariant="titleLg" breadcrumbs={DesktopBreadcrumbs(t)} />
        </Box>
      ) : null}

      <Box
        sx={theme => ({
          backgroundColor: { xs: "transparent", md: embedded ? "transparent" : theme.palette.background.paper },
          borderRadius: { xs: 0, md: embedded ? 0 : "xl" },
          boxShadow: { xs: "none", md: embedded ? "none" : theme.palette.shadow.card },
          border: { xs: "none", md: embedded ? "none" : `1px solid ${theme.palette.border.light}` },
          overflow: "hidden",
          maxWidth: "4xl",
          mx: "auto",
        })}
      >
        <FormProvider {...(methods as unknown as UseFormReturn<StudentQuotaFormData>)}>
          <QuotaFormAccessProvider
            value={{
              readOnly,
              canEditIdentity,
              canEditQuota,
              canViewQuota,
              canViewTeacher,
            }}
          >
            <Box
              component="form"
              onSubmit={e => {
                e.preventDefault();
                if (!readOnly) {
                  methods.handleSubmit(onSubmit)(e);
                }
              }}
              sx={{
                p: { xs: 0, md: embedded ? 0 : 4 },
                display: "flex",
                flexDirection: "column",
                gap: { xs: 4, md: 6 },
              }}
            >
              <StudentInformationSection />
              <CourseDetailsSection />
              <FormActions
                isSaving={isSaving}
                isSaved={isSaved}
                studentData={studentData}
                onCancel={onCancel}
                readOnly={readOnly}
                showCancel={!embedded}
              />
            </Box>
          </QuotaFormAccessProvider>
        </FormProvider>
      </Box>

      {!embedded ? (
        <Box sx={{ maxWidth: "4xl", mx: "auto" }}>
          <ContextualHelperCards />
        </Box>
      ) : null}
    </>
  );
}

function useQuotaForm(
  studentData: StudentQuotaViewProps["studentData"],
  onSave: (data: StudentQuotaFormData) => Promise<void>
) {
  const validationMessages = useAppTranslation().dashboardTranslations.studentQuota.validation;
  const schema = createStudentQuotaSchema(validationMessages as StudentQuotaLabels["validation"]);

  const methods = useForm<StudentQuotaFormInput, undefined, StudentQuotaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentName: "",
      dateOfBirth: "",
      language: "ar",
      gender: "",
      teacher: "",
      totalClasses: 0,
      classesLeft: 0,
    },
  });

  useEffect(() => {
    if (studentData) {
      methods.reset({
        studentName: studentData.studentName,
        dateOfBirth: studentData.dateOfBirth,
        language: studentData.language,
        gender: studentData.gender,
        teacher: studentData.teacher,
        totalClasses: studentData.totalClasses,
        classesLeft: studentData.classesLeft,
      });
    }
  }, [studentData, methods]);

  const onSubmit = async (data: StudentQuotaFormData) => {
    await onSave(data);
  };

  return { methods, onSubmit };
}

export function StudentQuotaView({
  studentData,
  isSaving,
  isSaved,
  embedded = false,
  readOnly = false,
  onSave,
  onCancel,
}: Readonly<StudentQuotaViewProps>) {
  const { canView, canEdit } = useStudentFieldAccess();
  const canEditIdentity = canEdit("student_identity");
  const canEditQuota = canEdit("student_quota_edit");
  const canViewQuota = canView("student_quota_edit");
  const canViewTeacher = canView("student_teacher");

  const { methods, onSubmit } = useQuotaForm(studentData, onSave);

  if (!studentData) {
    const loadingContent = (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
    return embedded ? loadingContent : <PageContainer>{loadingContent}</PageContainer>;
  }

  const formContent = (
    <QuotaFormCard
      methods={methods}
      onSubmit={onSubmit}
      studentData={studentData}
      isSaving={isSaving}
      isSaved={isSaved}
      readOnly={readOnly}
      embedded={embedded}
      onCancel={onCancel}
      canEditIdentity={canEditIdentity}
      canEditQuota={canEditQuota}
      canViewQuota={canViewQuota}
      canViewTeacher={canViewTeacher}
    />
  );

  if (embedded) {
    return formContent;
  }

  return <PageContainer>{formContent}</PageContainer>;
}
