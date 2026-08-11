"use client";

import { BookOutlined, InfoOutlined, SyncProblemOutlined } from "@mui/icons-material";
import { CourseDetailsSectionShared } from "@/frontend/common/views/dashboard/students/quota/components/courseDetailsSectionShared";
import type { CourseDetailsSectionSlotProps } from "@/frontend/common/views/dashboard/students/quota/components/courseDetailsSectionShared.types";
import { SectionHeaderMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/sectionHeader.mobile";

const mobileSlots: CourseDetailsSectionSlotProps = {
  renderHeader: title => <SectionHeaderMobile title={title} mobileIcon={BookOutlined} />,
  teacherLabelId: "student-quota-teacher-label-mobile",
  rootGap: 3,
  fieldsContainerSx: { display: "flex", flexDirection: "column", gap: 2 },
  overrideEndAdornment: {
    icon: SyncProblemOutlined,
    iconFontSize: 16,
    boxSx: theme => ({
      display: "flex",
      alignItems: "center",
      gap: 0.5,
      color: theme.palette.tertiary,
      mr: 1,
    }),
    typographySx: { fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" },
  },
  overrideNotice: {
    icon: InfoOutlined,
    iconFontSize: 14,
    sx: theme => ({
      color: theme.palette.tertiaryContainer,
      fontStyle: "italic",
      display: "flex",
      alignItems: "flex-start",
      gap: 0.5,
      mt: 1,
    }),
  },
  classesLeftInputSx: theme => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: "lg",
      backgroundColor: "transparent",
      color: theme.palette.tertiary,
      fontWeight: 700,
      "& fieldset": {
        borderWidth: "0 0 2px 0",
        borderColor: theme.palette.tertiary,
      },
    },
  }),
};

export function CourseDetailsSectionMobile() {
  return <CourseDetailsSectionShared slots={mobileSlots} />;
}
