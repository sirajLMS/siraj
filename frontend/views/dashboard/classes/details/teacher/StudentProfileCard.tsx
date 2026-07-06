"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import type { StudentInfo } from "@/frontend/views/dashboard/types/dashboard";
import { Link } from "@/shared/i18n/routing";
import { StudentEntityLink } from "../components/EntityLinks";

interface StudentProfileCardProps {
  readonly student: StudentInfo;
  readonly labels: {
    readonly viewFullProfile: string;
  };
}

const StyledTopAccentBar = styled(Box)(() => ({
  height: 4,
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
}));

const StyledViewProfileButton = styled(Link)(() => ({
  display: "block",
  width: "100%",
  textAlign: "center",
  borderRadius: 6,
  fontWeight: 700,
  letterSpacing: "0.08em",
  paddingBlock: 1.25,
  textDecoration: "none",
  typography: "labelUppercase",
  transition: "all 0.2s ease",
}));

export function StudentProfileCard({ student, labels }: StudentProfileCardProps) {
  if (!student.id) {
    return (
      <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
        <StyledTopAccentBar />
        <Typography variant="titleLg">{student.name}</Typography>
      </BaseCard>
    );
  }

  const profileHref = `/students/${student.id}`;

  return (
    <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
      <StyledTopAccentBar />
      <Box sx={{ mb: 3 }}>
        <StudentEntityLink studentId={student.id} name={student.name} avatarUrl={student.avatarUrl} showAvatar />
      </Box>

      <StyledViewProfileButton
        href={profileHref}
        id="view-student-profile-btn"
        sx={theme => ({
          border: `1px solid ${theme.palette.header}`,
          color: theme.palette.header,
          paddingBlock: theme.spacing(1.25),
          "&:hover": {
            backgroundColor: theme.palette.header,
            color: theme.palette.onHeader,
          },
        })}
      >
        {labels.viewFullProfile}
      </StyledViewProfileButton>
    </BaseCard>
  );
}
