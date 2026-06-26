"use client";

import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import type { StudentInfo } from "@/frontend/views/dashboard/types/dashboard";

interface StudentProfileCardProps {
  readonly student: StudentInfo;
  readonly onViewProfile: () => void;
  readonly labels: {
    readonly studentLevel: string;
    readonly viewFullProfile: string;
  };
}

// Thin header-colored accent bar spanning the top of the card
const StyledTopAccentBar = styled(Box)(({ theme }) => ({
  height: 4,
  backgroundColor: theme.palette.header,
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
}));

// Primary-colored title used for the student name
const StyledStudentName = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Secondary-colored caption used for the student level line
const StyledStudentLevelCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Full-width outlined button with header-colored border that fills on hover
const StyledViewProfileButton = styled(Button)(({ theme }) => ({
  borderRadius: 6,
  borderColor: theme.palette.header,
  color: theme.palette.header,
  fontWeight: 700,
  letterSpacing: "0.08em",
  "&:hover": {
    backgroundColor: theme.palette.header,
    color: theme.palette.onHeader,
    borderColor: theme.palette.header,
  },
  transition: "all 0.2s ease",
}));

export function StudentProfileCard({ student, onViewProfile, labels }: StudentProfileCardProps) {
  return (
    <BaseCard sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
      <StyledTopAccentBar />
      <Stack direction="row" sx={{ alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar src={student.avatarUrl} alt={student.name} sx={{ width: 64, height: 64 }} />
        <Box>
          <StyledStudentName variant="titleLg">{student.name}</StyledStudentName>
          <StyledStudentLevelCaption variant="caption">
            {labels.studentLevel}: {student.level} (Advanced)
          </StyledStudentLevelCaption>
        </Box>
      </Stack>

      <StyledViewProfileButton fullWidth variant="outlined" id="view-student-profile-btn" onClick={onViewProfile}>
        {labels.viewFullProfile}
      </StyledViewProfileButton>
    </BaseCard>
  );
}
