"use client";

import { Box } from "@mui/material";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import {
  HeaderActions,
  StudentAvatar,
  StudentInfo,
} from "@/frontend/common/views/dashboard/students/status/components/studentStatusHeaderShared.parts";
import type { StudentStatusHeaderSharedProps } from "@/frontend/common/views/dashboard/students/status/types/studentStatusHeaderShared.types";

export function StudentStatusHeaderShared({ student, embedded, slots }: Readonly<StudentStatusHeaderSharedProps>) {
  const { showField } = useStudentFieldAccess();
  const showAvatar = showField(student.avatarUrl ?? student.name, "student_identity");

  if (embedded) {
    if (slots.embeddedInnerWrapperSx) {
      return (
        <Box sx={slots.embeddedWrapperSx}>
          <Box sx={slots.embeddedInnerWrapperSx}>
            <HeaderActions student={student} buttonFullWidth={slots.buttonFullWidth} slots={slots} />
          </Box>
        </Box>
      );
    }
    return (
      <Box sx={slots.embeddedWrapperSx}>
        <HeaderActions student={student} buttonFullWidth={slots.buttonFullWidth} slots={slots} />
      </Box>
    );
  }

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: { xs: 3, md: "cardPadding" },
        mb: { xs: 3, md: 4 },
        border: `1px solid ${theme.palette.border.main}`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "center", md: "center" },
        justifyContent: "space-between",
        textAlign: { xs: "center", md: "left" },
        gap: 3,
      })}
    >
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: 3 }}>
        <StudentAvatar student={student} showAvatar={showAvatar} slots={slots} />
        <StudentInfo student={student} slots={slots} />
      </Box>
      <HeaderActions student={student} buttonFullWidth={slots.buttonFullWidth} slots={slots} />
    </Box>
  );
}
