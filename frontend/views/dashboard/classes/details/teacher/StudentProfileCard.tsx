"use client";

import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
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

export function StudentProfileCard({ student, onViewProfile, labels }: StudentProfileCardProps) {
  return (
    <BaseCard sx={{ position: "relative", overflow: "hidden", pt: 4 }}>
      <Box
        sx={theme => ({
          height: 4,
          bgcolor: theme.palette.header,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        })}
      />
      <Stack direction="row" sx={{ alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar src={student.avatarUrl} alt={student.name} sx={{ width: 64, height: 64 }} />
        <Box>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
            {student.name}
          </Typography>
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.studentLevel}: {student.level} (Advanced)
          </Typography>
        </Box>
      </Stack>

      <Button
        fullWidth
        variant="outlined"
        id="view-student-profile-btn"
        onClick={onViewProfile}
        sx={theme => ({
          borderRadius: 6,
          borderColor: theme.palette.header,
          color: theme.palette.header,
          fontWeight: 700,
          letterSpacing: "0.08em",
          "&:hover": {
            bgcolor: theme.palette.header,
            color: theme.palette.onHeader,
            borderColor: theme.palette.header,
          },
          transition: "all 0.2s ease",
        })}
      >
        {labels.viewFullProfile}
      </Button>
    </BaseCard>
  );
}
