import { PlayCircleOutlined } from "@mui/icons-material";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig";

type NextClassChipProps = {
  readonly isFrozen: boolean | null | undefined;
  readonly countdown: string | null;
  readonly frozenLabel: string;
};

export function NextClassChip({ isFrozen, countdown, frozenLabel }: NextClassChipProps): ReactNode {
  if (isFrozen) {
    return <StatusBadge category="classSession" status="hold" label={frozenLabel} />;
  }
  if (countdown) {
    return (
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onPrimaryContainer, opacity: 0.9 })}>
        {countdown}
      </Typography>
    );
  }
  return null;
}

type NextClassActionProps = {
  readonly joinable: boolean;
  readonly countdown: string | null;
  readonly lessonId: string;
  readonly meetingUrl: string | null | undefined;
  readonly joinNowLabel: string;
  readonly onJoin: (id: string) => void;
};

export function NextClassAction({
  joinable,
  countdown,
  lessonId,
  meetingUrl,
  joinNowLabel,
  onJoin,
}: NextClassActionProps): ReactNode {
  if (joinable) {
    return (
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayCircleOutlined />}
          onClick={() => onJoin(lessonId)}
          sx={theme => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            borderRadius: 2,
            py: 1.25,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark ?? theme.palette.primary.main,
            },
          })}
        >
          {joinNowLabel}
        </Button>
        {meetingUrl ? <CopyMeetingUrlButton meetingUrl={meetingUrl} variant="icon" size="large" /> : null}
      </Stack>
    );
  }
  if (countdown) {
    return (
      <Box>
        <LinearProgress
          sx={theme => ({
            backgroundColor: theme.palette.onPrimaryContainer,
            "& .MuiLinearProgress-bar": {
              backgroundColor: theme.palette.primary.main,
            },
          })}
        />
      </Box>
    );
  }
  return null;
}
