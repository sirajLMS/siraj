"use client";

import BoltIcon from "@mui/icons-material/Bolt";
import DeleteIcon from "@mui/icons-material/Delete";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { alpha, Box, Grid, Stack, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { BaseCard } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

interface ActionConfig {
  readonly key: string;
  readonly icon: React.ElementType;
  readonly statusKey: "active" | "cancelled" | "completed";
}

const ACTION_CONFIGS: ActionConfig[] = [
  {
    key: "activate",
    icon: PowerSettingsNewIcon,
    statusKey: "active",
  },
  {
    key: "stop",
    icon: PauseCircleIcon,
    statusKey: "cancelled",
  },
  {
    key: "infoEdit",
    icon: EditNoteIcon,
    statusKey: "completed",
  },
  {
    key: "delete",
    icon: DeleteIcon,
    statusKey: "cancelled",
  },
];

interface ActionsPanelProps {
  readonly onActivate: () => void;
  readonly onStop: () => void;
  readonly onInfoEdit: () => void;
  readonly onDelete: () => void;
  readonly labels: {
    readonly actions: string;
    readonly activate: string;
    readonly stopPause: string;
    readonly infoEdit: string;
    readonly delete: string;
    readonly contextualHelp: string;
  };
}

export function ActionsPanel({ onActivate, onStop, onInfoEdit, onDelete, labels }: ActionsPanelProps) {
  const handlers: Record<string, () => void> = {
    activate: onActivate,
    stop: onStop,
    infoEdit: onInfoEdit,
    delete: onDelete,
  };

  const actionLabels: Record<string, string> = {
    activate: labels.activate,
    stop: labels.stopPause,
    infoEdit: labels.infoEdit,
    delete: labels.delete,
  };

  return (
    <BaseCard sx={{ p: 0, overflow: "hidden" }}>
      {/* Action header */}
      <Box sx={theme => ({ bgcolor: theme.palette.header, py: 2, px: 3 })}>
        <Typography
          variant="titleLg"
          sx={theme => ({
            color: theme.palette.onHeader,
            display: "flex",
            alignItems: "center",
            gap: 1,
          })}
        >
          <BoltIcon />
          {labels.actions}
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* 2×2 action button grid */}
        <Grid container spacing={2}>
          {ACTION_CONFIGS.map(config => {
            const Icon = config.icon;
            const { statusKey } = config;
            const buttonElement = (
              <Box
                component="button"
                id={`action-btn-${config.key}`}
                onClick={handlers[config.key]}
                sx={theme => {
                  const status = theme.palette.status;
                  const mainColor = status[statusKey];
                  const borderColor = status[`${statusKey}Container` as keyof typeof status];
                  const capitalized = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
                  const bgColor = status[`on${capitalized}Container` as keyof typeof status];

                  return {
                    width: "100%",
                    aspectRatio: "1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.5,
                    bgcolor: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 2,
                    cursor: "pointer",
                    color: mainColor,
                    boxShadow: theme.palette.shadow.button,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: alpha(mainColor, 0.08),
                      boxShadow: theme.palette.shadow.buttonHover,
                      "& .action-icon": { transform: "scale(1.1)" },
                    },
                    "&:active": { transform: "scale(0.95)" },
                  };
                }}
              >
                <Icon className="action-icon" sx={{ fontSize: 36, transition: "transform 0.15s ease" }} />
                <Typography variant="labelUppercase" sx={{ color: "inherit" }}>
                  {actionLabels[config.key]}
                </Typography>
              </Box>
            );

            return (
              <Grid key={config.key} size={{ xs: 6 }}>
                {config.key === "activate" ? (
                  <RequirePermission permissions={[AppPermission.SessionActivateClass]}>
                    {buttonElement}
                  </RequirePermission>
                ) : (
                  buttonElement
                )}
              </Grid>
            );
          })}
        </Grid>

        {/* Contextual help */}
        <Stack
          direction="row"
          sx={theme => ({
            gap: 1.5,
            mt: 2.5,
            p: 2,
            bgcolor: theme.palette.background.default,
            borderRadius: 1.5,
            alignItems: "flex-start",
          })}
        >
          <HelpOutlinedIcon
            sx={theme => ({ color: theme.palette.onSurfaceVariant, fontSize: 20, mt: 0.25, flexShrink: 0 })}
          />
          <Typography variant="caption" sx={theme => ({ color: theme.palette.onSurfaceVariant, lineHeight: 1.6 })}>
            {labels.contextualHelp}
          </Typography>
        </Stack>
      </Box>
    </BaseCard>
  );
}
