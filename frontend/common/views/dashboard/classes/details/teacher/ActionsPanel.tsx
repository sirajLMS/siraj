"use client";

import BoltIcon from "@mui/icons-material/Bolt";
import { Box, Button, Grid, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { BaseCard } from "@/frontend/common/components/ui";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import { ACTION_CONFIGS } from "@/frontend/common/views/dashboard/classes/details/teacher/ActionsPanel.constants";
import {
  StyledActionsHeader,
  StyledActionsTitle,
  StyledHelpContainer,
  StyledHelpIcon,
  StyledHelpText,
} from "@/frontend/common/views/dashboard/classes/details/teacher/ActionsPanel.styles";

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
              <Button
                id={`action-btn-${config.key}`}
                variant="outlined"
                onClick={handlers[config.key]}
                sx={theme => ({
                  width: "100%",
                  aspectRatio: "1",
                  flexDirection: "column",
                  gap: 1,
                  borderColor: theme.palette.status[`${statusKey}Container`],
                  color: theme.palette.status[statusKey],
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    borderColor: theme.palette.status[statusKey],
                  },
                })}
              >
                <Icon sx={{ fontSize: 36 }} />
                <Typography variant="labelUppercase" sx={{ color: "inherit" }}>
                  {actionLabels[config.key]}
                </Typography>
              </Button>
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
