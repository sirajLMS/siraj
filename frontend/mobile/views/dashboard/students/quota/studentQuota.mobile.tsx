"use client";

import { CheckCircleOutlined, EditOutlined, Save, ScheduleOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { FormProvider, type UseFormReturn } from "react-hook-form";
import { PrimaryPageAction, UserAvatar } from "@/frontend/common/components/ui";
import { QuotaFormAccessProvider } from "@/frontend/common/views/dashboard/students/quota/QuotaFormAccessProvider";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import type {
  FormActionsProps,
  MobileProfileHeaderProps,
  StudentProfileData,
} from "@/frontend/common/views/dashboard/students/quota/types";
import type { StudentQuotaViewModel } from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";
import { ContextualHelperCardsMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/contextualHelperCards.mobile";
import { CourseDetailsSectionMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/courseDetailsSection.mobile";
import { StudentInformationSectionMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/studentInformationSection.mobile";
import { useAppTranslation } from "@/shared/locale";

function MobileProfileHeader({ studentData, onEditAvatar, showAvatarEdit }: Readonly<MobileProfileHeaderProps>) {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
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

function FormActionsMobile({
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
        pt: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          width: "100%",
        }}
      >
        {readOnly ? null : (
          <PrimaryPageAction
            type="submit"
            disabled={isSaving || isSaved}
            startIcon={saveIcon}
            sx={theme => ({
              height: 56,
              px: 0,
              backgroundColor: isSaved ? theme.palette.primary.main : theme.palette.success.main,
              color: isSaved ? theme.palette.onPrimary : theme.palette.onSuccess,
              "&:hover": { backgroundColor: isSaved ? theme.palette.primary.dark : theme.palette.success.dark },
              "&.Mui-disabled": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                opacity: 0.8,
              },
              width: "100%",
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
              height: 48,
              px: 0,
              color: theme.palette.onSurfaceVariant,
              "&:hover": {
                color: theme.palette.error.main,
                backgroundColor: theme.palette.surfaceContainerLow,
              },
              width: "100%",
            })}
          >
            {t.actions.cancel}
          </PrimaryPageAction>
        ) : null}
      </Box>

      {studentData.lastEditedTime ? (
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.onSurfaceVariant,
          })}
        >
          <ScheduleOutlined sx={{ fontSize: 14 }} />
          <Typography variant="labelMd">{t.actions.lastEditedAt(studentData.lastEditedTime)}</Typography>
        </Box>
      ) : null}
    </Box>
  );
}

function QuotaFormCardMobile({
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
  onEditAvatar,
}: Readonly<
  Pick<
    StudentQuotaViewModel,
    | "methods"
    | "onSubmit"
    | "isSaving"
    | "isSaved"
    | "readOnly"
    | "embedded"
    | "onCancel"
    | "canEditIdentity"
    | "canEditQuota"
    | "canViewQuota"
    | "canViewTeacher"
    | "onEditAvatar"
  > & {
    readonly studentData: StudentProfileData;
  }
>) {
  const showAvatarEdit = !embedded && !readOnly && canEditIdentity && Boolean(onEditAvatar);

  return (
    <>
      {!embedded ? (
        <MobileProfileHeader studentData={studentData} showAvatarEdit={showAvatarEdit} onEditAvatar={onEditAvatar} />
      ) : null}

      <Box
        sx={{
          backgroundColor: "transparent",
          borderRadius: 0,
          overflow: "hidden",
          maxWidth: "4xl",
          mx: "auto",
        }}
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
                p: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <StudentInformationSectionMobile />
              <CourseDetailsSectionMobile />
              <FormActionsMobile
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
          <ContextualHelperCardsMobile />
        </Box>
      ) : null}
    </>
  );
}

export function StudentQuotaMobileView({
  studentData,
  embedded,
  readOnly,
  isSaving,
  isSaved,
  canEditIdentity,
  canEditQuota,
  canViewQuota,
  canViewTeacher,
  methods,
  onSubmit,
  onCancel,
  onEditAvatar,
}: Readonly<StudentQuotaViewModel>) {
  if (!studentData) {
    const loadingContent = (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
    return embedded ? loadingContent : <MobilePageContainer>{loadingContent}</MobilePageContainer>;
  }

  const formContent = (
    <QuotaFormCardMobile
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
      onEditAvatar={onEditAvatar}
    />
  );

  if (embedded) {
    return formContent;
  }

  return <MobilePageContainer>{formContent}</MobilePageContainer>;
}
