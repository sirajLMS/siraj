"use client";

import { Box, Paper, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import type { StudentStatusViewModel } from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";
import { MobilePageHeader } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";
import { AdminHoldControlsMobile } from "@/frontend/mobile/views/dashboard/students/status/components/adminHoldControls.mobile";
import {
  PolicyOverviewCardMobile,
  SuspensionWarningBannerMobile,
} from "@/frontend/mobile/views/dashboard/students/status/components/policyOverviewCard.mobile";
import { StudentStatusHeaderMobile } from "@/frontend/mobile/views/dashboard/students/status/components/studentStatusHeader.mobile";
import { UpcomingClassesTableMobile } from "@/frontend/mobile/views/dashboard/students/status/components/upcomingClassesTable.mobile";
import { useAppTranslation } from "@/shared/locale";

const STATUS_BADGE_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.OnTrial]: "on_trial",
  [StudentStatus.Deactivated]: "deactivated",
};

function getBadgeStatusKey(status: StudentStatus): string {
  return STATUS_BADGE_MAP[status] ?? "regular";
}

function ReadOnlyStatusCardMobile({ status }: Readonly<{ status: StudentStatus }>) {
  const t = useAppTranslation().dashboardTranslations.studentStatus;

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: "cardPadding",
        border: `1px solid ${theme.palette.border.main}`,
      })}
    >
      <Typography
        variant="labelMd"
        sx={theme => ({ color: theme.palette.onSurfaceVariant, mb: 1.5, display: "block" })}
      >
        {t.fields.accountStatus}
      </Typography>
      <MobileStatusBadge category="studentAccount" status={getBadgeStatusKey(status)} label={t.statusOptions[status]} />
    </Paper>
  );
}

export function StudentStatusMobileView({
  t,
  student,
  embedded,
  isUpdating,
  canEditStatus,
  hasTabAccess,
  hasLeftColumn,
  hasRightColumn,
  hasContent,
  selectedStatus,
  methods,
  handleSubmit,
}: Readonly<StudentStatusViewModel>) {
  if (!hasTabAccess || !hasContent) {
    const restricted = <ProfileRestrictedSection title={t.pageTitle} />;
    return embedded ? restricted : <MobilePageContainer>{restricted}</MobilePageContainer>;
  }

  if (!student) {
    return null;
  }

  const body = (
    <>
      {embedded ? null : (
        <MobilePageHeader
          title={t.pageTitle}
          subtitle={t.studentId(student.id)}
          breadcrumbs={[
            { label: t.breadcrumbs.students, href: "/students" },
            { label: t.breadcrumbs.statusHold, current: true },
          ]}
          edgeToEdge={false}
        />
      )}
      <StudentStatusHeaderMobile student={student} embedded={embedded} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}>
        {hasLeftColumn ? (
          canEditStatus ? (
            <Box
              component="form"
              onSubmit={e => {
                methods.handleSubmit(handleSubmit)(e);
              }}
              sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}
            >
              <FormProvider {...methods}>
                <AdminHoldControlsMobile isUpdating={isUpdating} />
              </FormProvider>
              <PolicyOverviewCardMobile />
            </Box>
          ) : (
            <ReadOnlyStatusCardMobile status={student.status} />
          )
        ) : null}

        {hasRightColumn ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}>
            {canEditStatus && selectedStatus === StudentStatus.Suspended ? <SuspensionWarningBannerMobile /> : null}
            <UpcomingClassesTableMobile classes={student.upcomingClasses} studentId={student.id} />
          </Box>
        ) : null}
      </Box>
    </>
  );

  if (embedded) {
    return body;
  }

  return <MobilePageContainer>{body}</MobilePageContainer>;
}
