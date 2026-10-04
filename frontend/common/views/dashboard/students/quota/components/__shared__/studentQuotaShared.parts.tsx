"use client";

import { Box, type Theme } from "@mui/material";
import { FormProvider } from "react-hook-form";
import type { StudentQuotaContentSharedProps } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.content.types";
import { FormActionsShared } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.formActions";
import type { StudentQuotaTierConfig } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.types";
import { QuotaFormAccessProvider } from "@/frontend/common/views/dashboard/students/quota/QuotaFormAccessProvider";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";

export function QuotaFormCardShared({
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
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!readOnly) {
                  void methods.handleSubmit(onSubmit)(e);
                }
              }}
            >
              <Box
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
            </form>
          </QuotaFormAccessProvider>
        </FormProvider>
      </Box>

      {embedded ? null : wrapContextualHelperCards(<ContextualHelperCards />)}
    </>
  );
}
