"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircleOutlined,
  ChevronRight,
  EditOutlined,
  Save,
  ScheduleOutlined,
  SyncOutlined,
} from "@mui/icons-material";
import { Avatar, Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { FormProvider, type UseFormReturn, useForm } from "react-hook-form";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { Link } from "@/shared/i18n/routing";
import type { MessageSchema } from "@/shared/messages/types/message";
import { ContextualHelperCards } from "./components/ContextualHelperCards";
import { CourseDetailsSection } from "./components/CourseDetailsSection";
import { StudentInformationSection } from "./components/StudentInformationSection";
import {
  createStudentQuotaSchema,
  type StudentQuotaFormData,
  type StudentQuotaFormInput,
} from "./schemas/studentQuotaSchema";
import type { FormActionsProps, MobileProfileHeaderProps, StudentQuotaViewProps } from "./types";

function MobileProfileHeader({ studentData, onEditAvatar }: Readonly<MobileProfileHeaderProps>) {
  const t = useTranslations("dashboard.studentQuota");
  return (
    <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", alignItems: "center", py: 4 }}>
      <Box sx={{ position: "relative", width: 96, height: 96, mb: 2 }}>
        <Avatar
          src={studentData.profileImage}
          alt={studentData.studentName}
          sx={theme => ({
            width: "100%",
            height: "100%",
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: theme.palette.shadow.card,
          })}
        />
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
      </Box>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
        {t("studentId", { id: studentData.id.replace("SRJ-", "") })}
      </Typography>
    </Box>
  );
}

function DesktopBreadcrumbs() {
  const t = useTranslations("dashboard.studentQuota");
  return (
    <Box
      sx={theme => ({
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        gap: 1,
        mb: 3,
        color: theme.palette.onSurfaceVariant,
      })}
    >
      <Link href="/students" style={{ textDecoration: "none" }}>
        <Typography
          variant="labelMd"
          sx={theme => ({
            cursor: "pointer",
            "&:hover": { color: theme.palette.primary.main },
            color: theme.palette.onSurfaceVariant,
          })}
        >
          {t("breadcrumbs.students")}
        </Typography>
      </Link>
      <ChevronRight sx={{ fontSize: 14 }} />
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
        {t("breadcrumbs.editProfile")}
      </Typography>
    </Box>
  );
}

function FormActions({ isSaving, isSaved, studentData, onCancel }: Readonly<FormActionsProps>) {
  const t = useTranslations("dashboard.studentQuota");

  let saveIcon = <Save />;
  if (isSaving) saveIcon = <SyncOutlined sx={{ animation: "spin 1s linear infinite" }} />;
  else if (isSaved) saveIcon = <CheckCircleOutlined />;

  let saveText = t("actions.save");
  if (isSaving) saveText = t("actions.saving");
  else if (isSaved) saveText = t("actions.saved");

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
        <Button
          type="submit"
          disabled={isSaving || isSaved}
          startIcon={saveIcon}
          sx={theme => ({
            height: { xs: 56, md: 48 },
            px: { xs: 0, md: 5 },
            backgroundColor: isSaved ? theme.palette.primary.main : theme.palette.success.main,
            color: isSaved ? theme.palette.onPrimary : theme.palette.onSuccess,
            borderRadius: 1,
            fontWeight: 700,
            letterSpacing: "0.1em",
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
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          sx={theme => ({
            height: { xs: 48, md: 48 },
            px: { xs: 0, md: 4 },
            color: theme.palette.onSurfaceVariant,
            fontWeight: 700,
            letterSpacing: "0.1em",
            "&:hover": {
              color: theme.palette.error.main,
              backgroundColor: { xs: theme.palette.surfaceContainerLow, md: "transparent" },
            },
            width: { xs: "100%", md: "auto" },
          })}
        >
          {t("actions.cancel")}
        </Button>
      </Box>

      <Box
        sx={theme => ({
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 1,
          color: theme.palette.onSurfaceVariant,
        })}
      >
        <ScheduleOutlined sx={{ fontSize: 14 }} />
        <Typography variant="labelMd">
          {t("actions.lastEdited", { time: studentData.lastEditedTime, user: studentData.lastEditedBy })}
        </Typography>
      </Box>
    </Box>
  );
}

export function StudentQuotaView({
  studentData,
  isLoading,
  isSaving,
  isSaved,
  onSave,
  onCancel,
  onEditAvatar,
}: Readonly<StudentQuotaViewProps>) {
  const validationMessages = useTranslations("dashboard.studentQuota.validation");

  const schema = createStudentQuotaSchema(
    validationMessages as unknown as MessageSchema["dashboard"]["studentQuota"]["validation"]
  );

  const methods = useForm<StudentQuotaFormInput, undefined, StudentQuotaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentName: "",
      dateOfBirth: "",
      language: "ar",
      gender: "MALE",
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

  if (isLoading || !studentData) {
    return (
      <PageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MobileProfileHeader studentData={studentData} onEditAvatar={onEditAvatar} />
      <DesktopBreadcrumbs />

      <Box
        sx={theme => ({
          backgroundColor: { xs: "transparent", md: theme.palette.background.paper },
          borderRadius: { xs: 0, md: "xl" },
          boxShadow: { xs: "none", md: theme.palette.shadow.card },
          border: { xs: "none", md: `1px solid ${theme.palette.border.light}` },
          overflow: "hidden",
          maxWidth: "4xl",
          mx: "auto",
        })}
      >
        <FormProvider {...(methods as unknown as UseFormReturn<StudentQuotaFormData>)}>
          <Box
            component="form"
            onSubmit={e => {
              e.preventDefault();
              methods.handleSubmit(onSubmit)(e);
            }}
            sx={{
              p: { xs: 0, md: 4 },
              display: "flex",
              flexDirection: "column",
              gap: { xs: 4, md: 6 },
            }}
          >
            <StudentInformationSection />
            <CourseDetailsSection />
            <FormActions isSaving={isSaving} isSaved={isSaved} studentData={studentData} onCancel={onCancel} />
          </Box>
        </FormProvider>
      </Box>

      <Box sx={{ maxWidth: "4xl", mx: "auto" }}>
        <ContextualHelperCards />
      </Box>
    </PageContainer>
  );
}
