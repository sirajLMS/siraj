"use client";

import { Box } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import type { ReadOnlyStatusCardSharedOptions } from "@/frontend/common/views/dashboard/students/status/components/__shared__/studentStatusShared";
import { ReadOnlyStatusCardShared } from "@/frontend/common/views/dashboard/students/status/components/__shared__/studentStatusShared";
import { StudentStatusLabelsProvider } from "@/frontend/common/views/dashboard/students/status/studentStatusLabelsContext";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";
import type { StudentStatusViewModel } from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page/DesktopPageContainer";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page/DesktopPageHeader";
import { AdminHoldControlsDesktop } from "@/frontend/desktop/views/dashboard/students/status/components/adminHoldControls.desktop";
import {
  PolicyOverviewCardDesktop,
  SuspensionWarningBannerDesktop,
} from "@/frontend/desktop/views/dashboard/students/status/components/policyOverviewCard.desktop";
import { StudentStatusHeaderDesktop } from "@/frontend/desktop/views/dashboard/students/status/components/studentStatusHeader.desktop";

const DESKTOP_READ_ONLY_OPTIONS: ReadOnlyStatusCardSharedOptions = {
  StatusBadge,
  headerSxPadding: { px: 3, py: 2.5, p: 3 },
  titleVariant: "titleLg",
  titleSxTypography: undefined,
};

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
          <ReadOnlyStatusCardShared status={student.status} options={DESKTOP_READ_ONLY_OPTIONS} />
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
