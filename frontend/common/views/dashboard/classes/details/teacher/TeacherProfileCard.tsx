"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";
import type { ClassInstanceTeacherInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { TeacherEntityLink } from "@/frontend/common/views/dashboard/classes/details/components/EntityLinks";
import { Link } from "@/shared/i18n";

interface TeacherProfileCardProps {
  readonly teacher: ClassInstanceTeacherInfo;
  readonly labels: {
    readonly viewFullProfile: string;
  };
}

const StyledTopAccentBar = styled(Box)(({ theme }) => ({
  height: 4,
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: theme.palette.primary.main,
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

export function TeacherProfileCard({ teacher, labels }: TeacherProfileCardProps) {
  if (!teacher.id) {
    return (
      <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
        <StyledTopAccentBar />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
          {teacher.name}
        </Typography>
      </BaseCard>
    );
  }

  const profileHref = profileHrefForTeacher({ teacherId: teacher.id });

  return (
    <BaseCard edgeToEdge sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
      <StyledTopAccentBar />
      <Box sx={{ mb: 3 }}>
        <TeacherEntityLink
          teacherId={teacher.id}
          name={teacher.name ?? ""}
          avatarUrl={teacher.avatarUrl ?? undefined}
          showAvatar
        />
      </Box>

      {profileHref ? (
        <StyledViewProfileButton
          href={profileHref}
          id="view-teacher-profile-btn"
          sx={theme => ({
            border: `1px solid ${theme.palette.outline}`,
            color: theme.palette.primary.main,
            paddingBlock: theme.spacing(1.25),
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
            },
          })}
        >
          {labels.viewFullProfile}
        </StyledViewProfileButton>
      ) : null}
    </BaseCard>
  );
}
