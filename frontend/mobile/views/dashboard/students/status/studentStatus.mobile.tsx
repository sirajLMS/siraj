"use client";

import { Box } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import {
  ReadOnlyStatusCardShared,
  type ReadOnlyStatusCardSharedOptions,
} from "@/frontend/common/views/dashboard/students/status/components/__shared__/studentStatusShared";
import { StudentStatusLabelsProvider } from "@/frontend/common/views/dashboard/students/status/studentStatusLabelsContext";
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

const MOBILE_READ_ONLY_OPTIONS: ReadOnlyStatusCardSharedOptions = {
  StatusBadge: MobileStatusBadge,
  headerSxPadding: { px: 2.5, py: 2, p: 2.5 },
  titleVariant: undefined,
  titleSxTypography: "titleMd",
};

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
          <ReadOnlyStatusCardShared status={student.status} options={MOBILE_READ_ONLY_OPTIONS} />
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
