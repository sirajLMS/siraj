"use client";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LanguageIcon from "@mui/icons-material/Language";
import { Avatar, Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import { avatarInitials } from "@/frontend/utils/avatar";
import type { StudentInfo, TeacherInfo } from "@/frontend/views/dashboard/types/dashboard";

interface ClassInfoCardProps {
  readonly courseName: string;
  readonly instanceId: string;
  readonly student: StudentInfo;
  readonly teacher: TeacherInfo;
  readonly isActive: boolean;
  readonly labels: {
    readonly liveInstance: string;
    readonly activeConnection: string;
    readonly student: string;
    readonly moduleInstructor: string;
  };
}

// Primary-background LIVE INSTANCE chip shown in the card header
const StyledLiveInstanceChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  typography: "labelUppercase",
  opacity: 0.8,
  "& .MuiChip-label": {
    paddingInline: theme.spacing(1.5),
  },
}));

// Primary-colored h3 course name heading
const StyledCourseNameHeading = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Secondary-colored body text for the instance ID label
const StyledInstanceIdLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Small active-status dot colored with the status.active palette token
const StyledActiveStatusDot = styled(FiberManualRecordIcon)(({ theme }) => ({
  fontSize: 12,
  color: theme.palette.status.active,
}));

// Uppercase secondary-colored caption next to the active status dot
const StyledActiveConnectionCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
}));

// Default-background avatar used for the student slot
const StyledStudentAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.primary.main,
}));

// PrimaryContainer-tinted avatar used for the teacher slot
const StyledTeacherAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
}));

// Block-display secondary caption used above a person's role (Student / Module Instructor)
const StyledPersonRoleCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: "block",
}));

// Block-display primary name used for student / teacher name
const StyledPersonNameText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  display: "block",
}));

// Secondary caption used for student grade+ID or teacher title beneath the name
const StyledPersonDetailCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Absolute-positioned decorative Language icon rendered at near-invisible opacity
const StyledDecorativeIconWrapper = styled(Box)(({ theme }) => ({
  position: "absolute",
  right: -16,
  bottom: -16,
  opacity: 0.03,
  pointerEvents: "none",
  color: theme.palette.primary.main,
}));

export function ClassInfoCard({ courseName, instanceId, student, teacher, isActive, labels }: ClassInfoCardProps) {
  return (
    <BaseCard sx={{ position: "relative", overflow: "hidden", height: "100%" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <StyledLiveInstanceChip label={labels.liveInstance} size="small" sx={{ mb: 1.5 }} />
          <StyledCourseNameHeading variant="h3" sx={{ mb: 0.5 }}>
            {courseName}
          </StyledCourseNameHeading>
          <StyledInstanceIdLabel variant="body2">
            Instance ID:{" "}
            <Box
              component="span"
              sx={theme => ({
                fontFamily: "monospace",
                fontWeight: 700,
                color: theme.palette.primary.main,
              })}
            >
              {instanceId}
            </Box>
          </StyledInstanceIdLabel>
        </Box>
        {isActive && (
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <StyledActiveStatusDot />
            <StyledActiveConnectionCaption variant="caption">{labels.activeConnection}</StyledActiveConnectionCaption>
          </Stack>
        )}
      </Stack>

      <Stack direction="row" sx={{ gap: 4, mt: 2 }}>
        {/* Student */}
        <Stack direction="row" sx={{ alignItems: "center", gap: 2, flex: 1 }}>
          <StyledStudentAvatar src={student.avatarUrl} alt={student.name}>
            {avatarInitials(student.name)}
          </StyledStudentAvatar>
          <Box>
            <StyledPersonRoleCaption variant="caption">{labels.student}</StyledPersonRoleCaption>
            <StyledPersonNameText variant="titleLg">{student.name}</StyledPersonNameText>
            <StyledPersonDetailCaption variant="caption">
              {student.grade} • ID: {student.id}
            </StyledPersonDetailCaption>
          </Box>
        </Stack>

        <Divider orientation="vertical" flexItem />

        {/* Teacher */}
        <Stack direction="row" sx={{ alignItems: "center", gap: 2, flex: 1 }}>
          <StyledTeacherAvatar alt={teacher.name} src={teacher.avatarUrl}>
            {avatarInitials(teacher.name)}
          </StyledTeacherAvatar>
          <Box>
            <StyledPersonRoleCaption variant="caption">{labels.moduleInstructor}</StyledPersonRoleCaption>
            <StyledPersonNameText variant="titleLg">{teacher.name}</StyledPersonNameText>
            <StyledPersonDetailCaption variant="caption">{teacher.title}</StyledPersonDetailCaption>
          </Box>
        </Stack>
      </Stack>

      {/* Decorative background icon */}
      <StyledDecorativeIconWrapper>
        <LanguageIcon sx={{ fontSize: 200 }} />
      </StyledDecorativeIconWrapper>
    </BaseCard>
  );
}
