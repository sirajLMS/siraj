"use client";

import { AutoStoriesOutlined, EditNoteOutlined } from "@mui/icons-material";
import { CourseDetailsSectionShared } from "@/frontend/common/views/dashboard/students/quota/components/courseDetailsSectionShared";
import type { CourseDetailsSectionSlotProps } from "@/frontend/common/views/dashboard/students/quota/components/courseDetailsSectionShared.types";
import { SectionHeaderDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/sectionHeader.desktop";

const desktopSlots: CourseDetailsSectionSlotProps = {
  renderHeader: title => <SectionHeaderDesktop title={title} desktopIcon={AutoStoriesOutlined} />,
  teacherLabelId: "student-quota-teacher-label",
  rootGap: 4,
  fieldsContainerSx: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 },
  overrideEndAdornment: {
    icon: EditNoteOutlined,
    iconFontSize: 20,
    boxSx: theme => ({
      display: "flex",
      alignItems: "center",
      gap: 0.5,
      color: theme.palette.primary.main,
      mr: 1,
    }),
    typographySx: { fontWeight: 700, textTransform: "uppercase" },
  },
  overrideNotice: {
    icon: undefined,
    iconFontSize: undefined,
    sx: theme => ({
      color: theme.palette.onSurfaceVariant,
      fontStyle: "italic",
      display: "flex",
      alignItems: "flex-start",
      gap: 0.5,
      mt: 0.5,
    }),
  },
  classesLeftInputSx: theme => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: "lg",
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.primary.main,
      fontWeight: 700,
      "& fieldset": {
        borderWidth: "1px",
        borderColor: theme.palette.border.light,
      },
    },
  }),
};

export function CourseDetailsSectionDesktop() {
  return <CourseDetailsSectionShared slots={desktopSlots} />;
}
