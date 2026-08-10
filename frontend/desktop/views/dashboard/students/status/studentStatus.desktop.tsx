"use client";

import { Box, Paper, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentStatusLabelsProvider } from "@/frontend/common/views/dashboard/students/status/studentStatusLabelsContext";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";
import type { StudentStatusViewModel } from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page/DesktopPageContainer";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page/DesktopPageHeader";
import { AdminHoldControlsDesktop } from "@/frontend/desktop/views/dashboard/students/status/components/adminHoldControls.desktop";
import {
  PolicyOverviewCardDesktop,
  SuspensionWarningBannerDesktop,
} from "@/frontend/desktop/views/dashboard/students/status/components/policyOverviewCard.desktop";
import { StudentStatusHeaderDesktop } from "@/frontend/desktop/views/dashboard/students/status/components/studentStatusHeader.desktop";

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

function ReadOnlyStatusCardDesktop({ status }: Readonly<{ status: StudentStatus }>) {
  const t = useStudentStatusLabels();

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.main}`,
        overflow: "hidden",
        width: "100%",
      })}
    >
      <Box
        sx={theme => ({
          px: 3,
          py: 2.5,
          borderBottom: `1px solid ${theme.palette.border.main}`,
          backgroundColor: theme.palette.background.default,
        })}
      >
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {t.fields.accountStatus}
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        <StatusBadge category="studentAccount" status={getBadgeStatusKey(status)} label={t.statusOptions[status]} />
      </Box>
    </Paper>
  );
}

function StudentStatusBodyDesktop({
  t,
  student,
  embedded,
  isUpdating,
  canEditStatus,
  selectedStatus,
  methods,
  handleSubmit,
}: Readonly<
  Pick<
    StudentStatusViewModel,
    "t" | "embedded" | "isUpdating" | "canEditStatus" | "selectedStatus" | "methods" | "handleSubmit"
  > & {
    readonly student: StudentStatusPageData;
  }
>) {
  return (
    <>
      {embedded ? null : (
        <DesktopPageHeader
          title={t.pageTitle}
          breadcrumbs={[
            { label: t.breadcrumbs.students, href: "/students" },
            { label: t.breadcrumbs.statusHold, current: true },
          ]}
        />
      )}
      <StudentStatusHeaderDesktop student={student} embedded={embedded} />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          width: "100%",
          maxWidth: 720,
          mx: "auto",
        }}
      >
        {canEditStatus && selectedStatus === StudentStatus.Suspended ? <SuspensionWarningBannerDesktop /> : null}

        {canEditStatus ? (
          <Box
            component="form"
            onSubmit={e => {
              void methods.handleSubmit(handleSubmit)(e);
            }}
            sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}
          >
            <FormProvider {...methods}>
              <AdminHoldControlsDesktop isUpdating={isUpdating} />
            </FormProvider>
            <PolicyOverviewCardDesktop />
          </Box>
        ) : (
          <ReadOnlyStatusCardDesktop status={student.status} />
        )}
      </Box>
    </>
  );
}

export function StudentStatusDesktopView({
  t,
  student,
  embedded,
  isUpdating,
  canEditStatus,
  hasTabAccess,
  hasLeftColumn,
  hasContent,
  selectedStatus,
  methods,
  handleSubmit,
}: Readonly<StudentStatusViewModel>) {
  if (!hasTabAccess || !hasContent || !hasLeftColumn) {
    const restricted = <ProfileRestrictedSection title={t.pageTitle} />;
    return embedded ? restricted : <DesktopPageContainer>{restricted}</DesktopPageContainer>;
  }

  if (!student) {
    return null;
  }

  const body = (
    <StudentStatusLabelsProvider labels={t}>
      <StudentStatusBodyDesktop
        t={t}
        student={student}
        embedded={embedded}
        isUpdating={isUpdating}
        canEditStatus={canEditStatus}
        selectedStatus={selectedStatus}
        methods={methods}
        handleSubmit={handleSubmit}
      />
    </StudentStatusLabelsProvider>
  );

  if (embedded) {
    return body;
  }

  return <DesktopPageContainer>{body}</DesktopPageContainer>;
}
