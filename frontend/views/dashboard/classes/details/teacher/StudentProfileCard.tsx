"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import Link from "next/link";
import { useLocale } from "next-intl";
import { BaseCard } from "@/frontend/components/ui";
import type { StudentInfo } from "@/frontend/views/dashboard/types/dashboard";
import { StudentEntityLink } from "../components/EntityLinks";

interface StudentProfileCardProps {
  readonly student: StudentInfo;
  readonly labels: {
    readonly viewFullProfile: string;
  };
}

const StyledTopAccentBar = styled(Box)(({ theme }) => ({
  height: 4,
  backgroundColor: theme.palette.header,
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
}));

const StyledViewProfileButton = styled(Link)(({ theme }) => ({
  display: "block",
  width: "100%",
  textAlign: "center",
  borderRadius: 6,
  border: `1px solid ${theme.palette.header}`,
  color: theme.palette.header,
  fontWeight: 700,
  letterSpacing: "0.08em",
  paddingBlock: theme.spacing(1.25),
  textDecoration: "none",
  typography: "labelUppercase",
  "&:hover": {
    backgroundColor: theme.palette.header,
    color: theme.palette.onHeader,
  },
  transition: "all 0.2s ease",
}));

export function StudentProfileCard({ student, labels }: StudentProfileCardProps) {
  const locale = useLocale();

  if (!student.id) {
    return (
      <BaseCard sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
        <StyledTopAccentBar />
        <Typography variant="titleLg">{student.name}</Typography>
      </BaseCard>
    );
  }

  const profileHref = `/${locale}/students/${student.id}`;

  return (
    <BaseCard sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
      <StyledTopAccentBar />
      <Box sx={{ mb: 3 }}>
        <StudentEntityLink studentId={student.id} name={student.name} avatarUrl={student.avatarUrl} showAvatar />
      </Box>

      <StyledViewProfileButton href={profileHref} id="view-student-profile-btn">
        {labels.viewFullProfile}
      </StyledViewProfileButton>
    </BaseCard>
  );
}
