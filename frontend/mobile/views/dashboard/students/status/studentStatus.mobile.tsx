"use client";

import { Box, Paper, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentStatusLabelsProvider } from "@/frontend/common/views/dashboard/students/status/studentStatusLabelsContext";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";
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
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${theme.palette.border.main}`,
          backgroundColor: theme.palette.background.default,
        })}
      >
        <Typography sx={theme => ({ typography: "titleMd", color: theme.palette.primary.main, fontWeight: 700 })}>
          {t.fields.accountStatus}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>
        <MobileStatusBadge
          category="studentAccount"
          status={getBadgeStatusKey(status)}
          label={t.statusOptions[status]}
        />
      </Box>
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
  hasContent,
  selectedStatus,
  methods,
  handleSubmit,
}: Readonly<StudentStatusViewModel>) {
  if (!hasTabAccess || !hasContent || !hasLeftColumn) {
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
          breadcrumbs={[
            { label: t.breadcrumbs.students, href: "/students" },
            { label: t.breadcrumbs.statusHold, current: true },
          ]}
          edgeToEdge={false}
        />
      )}
      <StudentStatusHeaderMobile student={student} embedded={embedded} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {canEditStatus && selectedStatus === StudentStatus.Suspended ? <SuspensionWarningBannerMobile /> : null}

        {canEditStatus ? (
          <Box
            component="form"
            onSubmit={e => {
              void methods.handleSubmit(handleSubmit)(e);
            }}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <FormProvider {...methods}>
              <AdminHoldControlsMobile isUpdating={isUpdating} />
            </FormProvider>
            <PolicyOverviewCardMobile />
          </Box>
        ) : (
          <ReadOnlyStatusCardMobile status={student.status} />
        )}
      </Box>
    </>
  );

  if (embedded) {
    return <StudentStatusLabelsProvider labels={t}>{body}</StudentStatusLabelsProvider>;
  }

  return (
    <StudentStatusLabelsProvider labels={t}>
      <MobilePageContainer>{body}</MobilePageContainer>
    </StudentStatusLabelsProvider>
  );
}
