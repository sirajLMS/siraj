"use client";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LanguageIcon from "@mui/icons-material/Language";
import { Avatar, Box, Chip, Divider, Stack, Typography } from "@mui/material";
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

export function ClassInfoCard({ courseName, instanceId, student, teacher, isActive, labels }: ClassInfoCardProps) {
  return (
    <BaseCard sx={{ position: "relative", overflow: "hidden", height: "100%" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <Chip
            label={labels.liveInstance}
            size="small"
            sx={theme => ({
              bgcolor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
              typography: "labelUppercase",
              mb: 1.5,
              opacity: 0.8,
              "& .MuiChip-label": { px: 1.5 },
            })}
          />
          <Typography variant="h3" sx={theme => ({ color: theme.palette.primary.main, mb: 0.5 })}>
            {courseName}
          </Typography>
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
            Instance ID:{" "}
            <Box
              component="span"
              sx={theme => ({ fontFamily: "monospace", fontWeight: 700, color: theme.palette.primary.main })}
            >
              {instanceId}
            </Box>
          </Typography>
        </Box>
        {isActive && (
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <FiberManualRecordIcon sx={theme => ({ fontSize: 12, color: theme.palette.status.active })} />
            <Typography
              variant="caption"
              sx={theme => ({
                color: theme.palette.text.secondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              })}
            >
              {labels.activeConnection}
            </Typography>
          </Stack>
        )}
      </Stack>

      <Stack direction="row" sx={{ gap: 4, mt: 2 }}>
        {/* Student */}
        <Stack direction="row" sx={{ alignItems: "center", gap: 2, flex: 1 }}>
          <Avatar
            src={student.avatarUrl}
            alt={student.name}
            sx={theme => ({
              width: 64,
              height: 64,
              bgcolor: theme.palette.background.default,
              color: theme.palette.primary.main,
            })}
          >
            {avatarInitials(student.name)}
          </Avatar>
          <Box>
            <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, display: "block" })}>
              {labels.student}
            </Typography>
            <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, display: "block" })}>
              {student.name}
            </Typography>
            <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
              {student.grade} • ID: {student.id}
            </Typography>
          </Box>
        </Stack>

        <Divider orientation="vertical" flexItem />

        {/* Teacher */}
        <Stack direction="row" sx={{ alignItems: "center", gap: 2, flex: 1 }}>
          <Avatar
            sx={theme => ({
              width: 64,
              height: 64,
              bgcolor: theme.palette.primaryContainer,
              color: theme.palette.onPrimaryContainer,
            })}
            alt={teacher.name}
            src={teacher.avatarUrl}
          >
            {avatarInitials(teacher.name)}
          </Avatar>
          <Box>
            <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, display: "block" })}>
              {labels.moduleInstructor}
            </Typography>
            <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, display: "block" })}>
              {teacher.name}
            </Typography>
            <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
              {teacher.title}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Decorative background icon */}
      <Box
        sx={theme => ({
          position: "absolute",
          right: -16,
          bottom: -16,
          opacity: 0.03,
          pointerEvents: "none",
          color: theme.palette.primary.main,
        })}
      >
        <LanguageIcon sx={{ fontSize: 200 }} />
      </Box>
    </BaseCard>
  );
}
