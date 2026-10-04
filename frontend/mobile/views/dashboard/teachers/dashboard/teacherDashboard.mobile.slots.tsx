"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Alert, Box, Typography } from "@mui/material";
import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { MobileContentInset, MobileSectionTitleRow } from "@/frontend/mobile/components/ui";
import { ManualClassEntryDialogMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/manualClassEntryDialog.mobile";
import { ManualClassEntryStudentSelectMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/manualClassEntryStudentSelect.mobile";
import { MissedClassAlertBannerMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/missedClassAlertBanner.mobile";

export function WelcomeSummaryRow({ summary }: { readonly summary: string }) {
  return (
    <MobileSectionTitleRow
      title={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarMonthOutlined sx={theme => ({ color: theme.palette.primary.main })} />
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {summary}
          </Typography>
        </Box>
      }
    />
  );
}

interface ManualEntryDialogSlotProps {
  readonly open: boolean;
  readonly defaultActive: boolean;
  readonly teacherId: string;
  readonly subjects: TeacherDashboardViewModel["subjects"];
  readonly subjectsLoading: boolean;
  readonly labels: TeacherDashboardViewModel["labels"]["manualClassEntry"];
  readonly onClose: () => void;
  readonly onSubmit: TeacherDashboardViewModel["onManualEntrySubmit"];
}

export function ManualEntryDialogSlot({
  open,
  defaultActive,
  teacherId,
  subjects,
  subjectsLoading,
  labels,
  onClose,
  onSubmit,
}: ManualEntryDialogSlotProps) {
  return (
    <ManualClassEntryDialogMobile
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      defaultActive={defaultActive}
      subjects={subjects}
      subjectsLoading={subjectsLoading}
      labels={labels}
      studentSelect={
        <ManualClassEntryStudentSelectMobile teacherId={teacherId} open={open} studentLabel={labels.studentLabel} />
      }
    />
  );
}

interface DashboardBannersProps {
  readonly missedAlert: TeacherDashboardViewModel["missedAlert"];
  readonly labels: TeacherDashboardViewModel["labels"];
  readonly activationError: TeacherDashboardViewModel["activationError"];
}

export function DashboardBanners({ missedAlert, labels, activationError }: DashboardBannersProps) {
  return (
    <>
      {missedAlert && (
        <MobileContentInset>
          <MissedClassAlertBannerMobile alert={missedAlert} labels={labels.alert} />
        </MobileContentInset>
      )}
      {activationError && (
        <MobileContentInset>
          <Alert severity="error">{activationError}</Alert>
        </MobileContentInset>
      )}
    </>
  );
}
