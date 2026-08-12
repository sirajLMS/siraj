"use client";

import { CheckCircleOutlined, Save, ScheduleOutlined, SyncOutlined } from "@mui/icons-material";
import type { Theme } from "@mui/material";
import { Box, CircularProgress, Typography } from "@mui/material";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import type { StudentQuotaTierConfig } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.types";
import { QuotaFormAccessProvider } from "@/frontend/common/views/dashboard/students/quota/QuotaFormAccessProvider";
import type { FormActionsProps, StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";
import type { StudentQuotaViewModel } from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export type { StudentQuotaTierConfig };

type QuotaViewModelPick = Pick<
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
>;

export interface StudentQuotaContentSharedProps extends QuotaViewModelPick {
  readonly studentData: StudentProfileData | null;
  readonly tier: StudentQuotaTierConfig;
}

function resolveSaveIcon(isSaving: boolean, isSaved: boolean): ReactElement {
  if (isSaving) return <SyncOutlined sx={{ animation: "spin 1s linear infinite" }} />;
  if (isSaved) return <CheckCircleOutlined />;
  return <Save />;
}

function resolveSaveText(labels: StudentQuotaLabels, isSaving: boolean, isSaved: boolean): string {
  if (isSaving) return labels.actions.saving;
  if (isSaved) return labels.actions.saved;
  return labels.actions.save;
}

const loadingContent: ReactElement = (
  <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
    <CircularProgress />
  </Box>
);

function LoadingContent(): ReactElement {
  return loadingContent;
}

function FormActionsShared({
  labels,
  isSaving,
  isSaved,
  studentData,
  onCancel,
  readOnly = false,
  showCancel = true,
  tier,
}: Readonly<FormActionsProps & { readonly labels: StudentQuotaLabels; readonly tier: StudentQuotaTierConfig }>) {
  const { PrimaryAction, actionsSx } = tier;
  const saveIcon = resolveSaveIcon(isSaving, isSaved);
  const saveText = resolveSaveText(labels, isSaving, isSaved);

  return (
    <Box
      sx={{
        pt: actionsSx.containerPaddingTop,
        display: "flex",
        flexDirection: actionsSx.containerDirection,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: actionsSx.innerDirection,
          gap: actionsSx.innerGap,
          width: actionsSx.innerWidth,
        }}
      >
        {readOnly ? null : (
          <PrimaryAction
            type="submit"
            disabled={isSaving || isSaved}
            startIcon={saveIcon}
            sx={(theme: Theme) => ({
              height: actionsSx.saveButtonHeight,
              px: actionsSx.saveButtonPx,
              backgroundColor: isSaved ? theme.palette.primary.main : theme.palette.success.main,
              color: isSaved ? theme.palette.onPrimary : theme.palette.onSuccess,
              "&:hover": { backgroundColor: isSaved ? theme.palette.primary.dark : theme.palette.success.dark },
              "&.Mui-disabled": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                opacity: 0.8,
              },
              width: actionsSx.saveButtonWidth,
            })}
          >
            {saveText}
          </PrimaryAction>
        )}
        {showCancel ? (
          <PrimaryAction
            type="button"
            variant="text"
            onClick={onCancel}
            disabled={isSaving}
            sx={(theme: Theme) => ({
              height: actionsSx.cancelButtonHeight,
              px: actionsSx.cancelButtonPx,
              width: actionsSx.cancelButtonWidth,
              ...(actionsSx.cancelButtonHoverBg === "surfaceContainerLow"
                ? {
                    color: theme.palette.onSurfaceVariant,
                    "&:hover": { color: theme.palette.error.main, backgroundColor: theme.palette.surfaceContainerLow },
                  }
                : {
                    color: theme.palette.onSurfaceVariant,
                    "&:hover": { color: theme.palette.error.main, backgroundColor: "transparent" },
                  }),
            })}
          >
            {labels.actions.cancel}
          </PrimaryAction>
        ) : null}
      </Box>

      {studentData.lastEditedTime ? (
        <Box
          sx={(theme: Theme) => ({
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

function QuotaFormCardShared({
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
  tier,
}: Readonly<
  Omit<StudentQuotaContentSharedProps, "studentData" | "tier"> & {
    readonly studentData: StudentProfileData;
    readonly tier: StudentQuotaTierConfig;
  }
>) {
  const { sections, renderHeader, cardSx, wrapContextualHelperCards } = tier;
  const { StudentInformationSection, CourseDetailsSection, ContextualHelperCards } = sections;

  return (
    <>
      {embedded ? null : renderHeader({ t, studentData })}

      <Box
        sx={(theme: Theme) =>
          cardSx.useCardStyling
            ? {
                backgroundColor: embedded ? "transparent" : theme.palette.background.paper,
                borderRadius: embedded ? 0 : "xl",
                boxShadow: embedded ? "none" : theme.palette.shadow.card,
                border: embedded ? "none" : `1px solid ${theme.palette.border.light}`,
                overflow: "hidden",
                maxWidth: "4xl",
                mx: "auto",
              }
            : {
                backgroundColor: "transparent",
                borderRadius: 0,
                overflow: "hidden",
                maxWidth: "4xl",
                mx: "auto",
              }
        }
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
                  void methods.handleSubmit(onSubmit)(e);
                }
              }}
              sx={{
                p: cardSx.formPadding,
                display: "flex",
                flexDirection: "column",
                gap: cardSx.formGap,
              }}
            >
              <StudentInformationSection />
              <CourseDetailsSection />
              <FormActionsShared
                labels={t}
                isSaving={isSaving}
                isSaved={isSaved}
                studentData={studentData}
                onCancel={onCancel}
                readOnly={readOnly}
                showCancel={!embedded}
                tier={tier}
              />
            </Box>
          </QuotaFormAccessProvider>
        </FormProvider>
      </Box>

      {embedded ? null : wrapContextualHelperCards(<ContextualHelperCards />)}
    </>
  );
}

function StudentQuotaContent({
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
  tier,
}: Readonly<StudentQuotaContentSharedProps>): ReactElement | null {
  if (!studentData) {
    return embedded ? loadingContent : null;
  }

  return (
    <QuotaFormCardShared
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
      tier={tier}
    />
  );
}

export interface StudentQuotaViewProps {
  readonly props: Readonly<StudentQuotaViewModel>;
  readonly tier: StudentQuotaTierConfig;
  readonly PageContainer: ComponentType<{ readonly children: ReactNode }>;
}

export function StudentQuotaView({ props, tier, PageContainer }: Readonly<StudentQuotaViewProps>): ReactElement {
  const { studentData, embedded } = props;
  if (!studentData && !embedded) {
    return (
      <PageContainer>
        <LoadingContent />
      </PageContainer>
    );
  }

  const content = (
    <StudentQuotaContent
      t={props.t}
      tc={props.tc}
      studentData={studentData}
      embedded={embedded}
      readOnly={props.readOnly}
      isSaving={props.isSaving}
      isSaved={props.isSaved}
      canEditIdentity={props.canEditIdentity}
      canEditQuota={props.canEditQuota}
      canViewQuota={props.canViewQuota}
      canViewTeacher={props.canViewTeacher}
      methods={props.methods}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      tier={tier}
    />
  );

  if (embedded) {
    return content ?? <LoadingContent />;
  }

  return <PageContainer>{content}</PageContainer>;
}
