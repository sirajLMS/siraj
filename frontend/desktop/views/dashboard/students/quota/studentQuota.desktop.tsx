"use client";

import { CheckCircleOutlined, Save, ScheduleOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { QuotaFormAccessProvider } from "@/frontend/common/views/dashboard/students/quota/QuotaFormAccessProvider";
import type { FormActionsProps, StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";
import type { StudentQuotaViewModel } from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ContextualHelperCardsDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/contextualHelperCards.desktop";
import { CourseDetailsSectionDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/courseDetailsSection.desktop";
import { StudentInformationSectionDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/studentInformationSection.desktop";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

function DesktopBreadcrumbs(t: StudentQuotaLabels) {
  return [
    { label: t.breadcrumbs.students, href: "/students" },
    { label: t.breadcrumbs.adjustQuota, current: true },
  ];
}

function FormActionsDesktop({
  labels,
  isSaving,
  isSaved,
  studentData,
  onCancel,
  readOnly = false,
  showCancel = true,
}: Readonly<FormActionsProps & { readonly labels: StudentQuotaLabels }>) {
  let saveIcon = <Save />;
  if (isSaving) saveIcon = <SyncOutlined sx={{ animation: "spin 1s linear infinite" }} />;
  else if (isSaved) saveIcon = <CheckCircleOutlined />;

  let saveText = labels.actions.save;
  if (isSaving) saveText = labels.actions.saving;
  else if (isSaved) saveText = labels.actions.saved;

  return (
    <Box
      sx={{
        pt: 5,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          width: "auto",
        }}
      >
        {readOnly ? null : (
          <DesktopPrimaryPageAction
            type="submit"
            disabled={isSaving || isSaved}
            startIcon={saveIcon}
            sx={theme => ({
              height: 48,
              px: 5,
              backgroundColor: isSaved ? theme.palette.primary.main : theme.palette.success.main,
              color: isSaved ? theme.palette.onPrimary : theme.palette.onSuccess,
              "&:hover": { backgroundColor: isSaved ? theme.palette.primary.dark : theme.palette.success.dark },
              "&.Mui-disabled": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                opacity: 0.8,
              },
              width: "auto",
            })}
          >
            {saveText}
          </DesktopPrimaryPageAction>
        )}
        {showCancel ? (
          <DesktopPrimaryPageAction
            type="button"
            variant="text"
            onClick={onCancel}
            disabled={isSaving}
            sx={theme => ({
              height: 48,
              px: 4,
              color: theme.palette.onSurfaceVariant,
              "&:hover": {
                color: theme.palette.error.main,
                backgroundColor: "transparent",
              },
              width: "auto",
            })}
          >
            {labels.actions.cancel}
          </DesktopPrimaryPageAction>
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
          <Typography variant="labelMd">{labels.actions.lastEditedAt(studentData.lastEditedTime)}</Typography>
        </Box>
      ) : null}
    </Box>
  );
}

function QuotaFormCardDesktop({
  t,
  tc,
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
}: Readonly<
  Pick<
    StudentQuotaViewModel,
    | "t"
    | "tc"
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
  > & {
    readonly studentData: StudentProfileData;
  }
>) {
  return (
    <>
      {embedded ? null : (
        <Box sx={{ display: "flex", mb: 3 }}>
          <DesktopPageHeader
            title={t.breadcrumbs.adjustQuota}
            titleVariant="titleLg"
            breadcrumbs={DesktopBreadcrumbs(t)}
          />
        </Box>
      )}

      <Box
        sx={theme => ({
          backgroundColor: embedded ? "transparent" : theme.palette.background.paper,
          borderRadius: embedded ? 0 : "xl",
          boxShadow: embedded ? "none" : theme.palette.shadow.card,
          border: embedded ? "none" : `1px solid ${theme.palette.border.light}`,
          overflow: "hidden",
          maxWidth: "4xl",
          mx: "auto",
        })}
      >
        <FormProvider {...methods}>
          <QuotaFormAccessProvider
            value={{
              readOnly,
              canEditIdentity,
              canEditQuota,
              canViewQuota,
              canViewTeacher,
              labels: t,
              commonLabels: tc,
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
                p: embedded ? 0 : 4,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <StudentInformationSectionDesktop />
              <CourseDetailsSectionDesktop />
              <FormActionsDesktop
                labels={t}
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

      {embedded ? null : (
        <Box sx={{ maxWidth: "4xl", mx: "auto" }}>
          <ContextualHelperCardsDesktop />
        </Box>
      )}
    </>
  );
}

export function StudentQuotaDesktopView({
  t,
  tc,
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
}: Readonly<StudentQuotaViewModel>) {
  if (!studentData) {
    const loadingContent = (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
    return embedded ? loadingContent : <DesktopPageContainer>{loadingContent}</DesktopPageContainer>;
  }

  const formContent = (
    <QuotaFormCardDesktop
      t={t}
      tc={tc}
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

  return <DesktopPageContainer>{formContent}</DesktopPageContainer>;
}
