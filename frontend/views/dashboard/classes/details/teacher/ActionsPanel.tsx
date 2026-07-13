"use client";

import BoltIcon from "@mui/icons-material/Bolt";
import DeleteIcon from "@mui/icons-material/Delete";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { alpha, Box, Grid, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { BaseCard } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { classDetailsContentPaddingSx } from "@/frontend/views/dashboard/classes/details/classDetailsMobileLayout";

interface ActionConfig {
  readonly key: string;
  readonly icon: React.ElementType;
  readonly statusKey: "active" | "cancelled" | "completed";
  readonly permission?: AppPermission;
}

const ACTION_CONFIGS: ActionConfig[] = [
  {
    key: "activate",
    icon: PowerSettingsNewIcon,
    statusKey: "active",
    permission: AppPermission.SessionActivateClass,
  },
  {
    key: "stop",
    icon: PauseCircleIcon,
    statusKey: "cancelled",
    permission: AppPermission.SessionOverrideActions,
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
    permission: AppPermission.SessionOverrideActions,
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

const StyledActionsHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.header,
  paddingBlock: theme.spacing(2),
}));

const StyledActionsTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onHeader,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledHelpContainer = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: 1.5,
  alignItems: "flex-start",
}));

const StyledHelpText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  lineHeight: 1.6,
}));

const StyledHelpIcon = styled(HelpOutlinedIcon)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  fontSize: 20,
  marginTop: theme.spacing(0.25),
  flexShrink: 0,
}));

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
    <BaseCard edgeToEdge edgeToEdgePadding={false} sx={{ py: 0, overflow: "hidden" }}>
      <StyledActionsHeader sx={classDetailsContentPaddingSx}>
        <StyledActionsTitle variant="titleLg">
          <BoltIcon />
          {labels.actions}
        </StyledActionsTitle>
      </StyledActionsHeader>

      <Box sx={mergeSx({ p: 3 }, classDetailsContentPaddingSx)}>
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
                  const borderColor = status[`${statusKey}Container`];
                  const backgroundColor = status.onActiveContainer; // Fallback to a valid key

                  return {
                    width: "100%",
                    aspectRatio: "1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.5,
                    backgroundColor: backgroundColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 2,
                    cursor: "pointer",
                    color: mainColor,
                    boxShadow: theme.palette.shadow.button,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      backgroundColor: alpha(mainColor, 0.08),
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
                {config.permission ? (
                  <RequirePermission permissions={[config.permission]}>{buttonElement}</RequirePermission>
                ) : (
                  buttonElement
                )}
              </Grid>
            );
          })}
        </Grid>

        <StyledHelpContainer direction="row" sx={{ mt: 2.5 }}>
          <StyledHelpIcon />
          <StyledHelpText variant="caption">{labels.contextualHelp}</StyledHelpText>
        </StyledHelpContainer>
      </Box>
    </BaseCard>
  );
}
