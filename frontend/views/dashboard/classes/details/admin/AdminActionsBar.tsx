"use client";

import ArticleIcon from "@mui/icons-material/Article";
import DeleteIcon from "@mui/icons-material/Delete";
import PauseIcon from "@mui/icons-material/Pause";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { Box, IconButton, Stack, Typography } from "@mui/material";

interface AdminActionsBarProps {
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
  readonly onGenerateLog: () => void;
  readonly onDelete: () => void;
  readonly labels: {
    readonly administrativeActions: string;
    readonly generateLog: string;
  };
}

export function AdminActionsBar({ onForceActivate, onStop, onGenerateLog, onDelete, labels }: AdminActionsBarProps) {
  return (
    <Box
      sx={theme => ({
        bgcolor: theme.palette.header,
        color: theme.palette.onHeader,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
        <Typography
          variant="labelUppercase"
          sx={{
            letterSpacing: "0.12em",
          }}
        >
          {labels.administrativeActions}
        </Typography>
        {/* Start Actions */}
        <Box sx={theme => ({ width: 1, height: 16, bgcolor: theme.palette.outlineVariant })} />
        <Stack direction="row" sx={{ gap: 1 }}>
          <IconButton
            aria-label="force-activate"
            title="Force Activate"
            onClick={onForceActivate}
            sx={theme => ({
              bgcolor: theme.palette.status.active,
              color: theme.palette.status.onActive,
              borderRadius: 1.5,
              "&:hover": { bgcolor: theme.palette.status.active, filter: "brightness(1.1)" },
              "&:active": { transform: "scale(0.95)" },
              transition: "all 0.15s ease",
            })}
          >
            <PowerSettingsNewIcon />
          </IconButton>
          <IconButton
            aria-label="stop-pause"
            title="Stop/Pause"
            onClick={onStop}
            sx={theme => ({
              bgcolor: theme.palette.status.cancelled,
              color: theme.palette.status.onCancelled,
              borderRadius: 1.5,
              "&:hover": { bgcolor: theme.palette.status.cancelled, filter: "brightness(1.1)" },
              "&:active": { transform: "scale(0.95)" },
              transition: "all 0.15s ease",
            })}
          >
            <PauseIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* End Actions */}
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
        <Box
          component="button"
          onClick={onGenerateLog}
          sx={theme => ({
            px: 2,
            height: 40,
            bgcolor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
            border: "none",
            borderRadius: 1.5,
            cursor: "pointer",
            typography: "labelUppercase",
            display: "flex",
            alignItems: "center",
            gap: 1,
            transition: "background 0.15s ease",
            "&:hover": { bgcolor: theme.palette.primaryContainer, filter: "brightness(0.9)" },
          })}
        >
          <ArticleIcon sx={{ fontSize: 16 }} />
          {labels.generateLog}
        </Box>
        <IconButton
          aria-label="delete-instance"
          title="Delete Instance"
          onClick={onDelete}
          sx={theme => ({
            bgcolor: theme.palette.status.blocked,
            color: theme.palette.status.onBlocked,
            borderRadius: 1.5,
            "&:hover": { bgcolor: theme.palette.status.blocked, filter: "brightness(1.1)" },
            "&:active": { transform: "scale(0.95)" },
            transition: "all 0.15s ease",
          })}
        >
          <DeleteIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
