"use client";

import { Box, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { edgeToEdgeCardShellSx } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import type { AdminActionLabels } from "@/frontend/common/views/dashboard/classes/details/admin/adminActionsBar.helpers";
import { SecondaryAdminActions } from "@/frontend/common/views/dashboard/classes/details/admin/adminActionsBarSecondaryActions.parts";
import { SessionControlButtons } from "@/frontend/common/views/dashboard/classes/details/admin/adminActionsBarSessionControls.parts";

interface AdminActionsBarProps {
  readonly executionState: string;
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
  readonly onGenerateLog: () => void;
  readonly onReschedule: () => void;
  readonly onDelete: () => void;
  readonly onOverrideRate: () => void;
  readonly labels: AdminActionLabels;
}

const StyledActionsDivider = styled(Box)(() => ({}));

const StyledAdminActionsBar = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(1.5),
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

export function AdminActionsBar({
  executionState,
  onForceActivate,
  onStop,
  onGenerateLog,
  onReschedule,
  onDelete,
  onOverrideRate,
  labels,
}: AdminActionsBarProps) {
  return (
    <StyledAdminActionsBar
      sx={mergeSx(
        theme => ({
          mb: { xs: 0, lg: 3 },
          backgroundColor: theme.palette.headerContainer,
          color: theme.palette.onHeaderContainer,
          paddingInline: theme.spacing(2),
          paddingBlock: theme.spacing(1.5),
          boxShadow: theme.palette.shadow.card,
        }),
        edgeToEdgeCardShellSx
      )}
    >
      <Typography variant="labelUppercase" sx={{ flex: "1 1 auto", minWidth: 0 }}>
        {labels.administrativeActions}
      </Typography>

      <StyledActionsDivider
        sx={theme => ({
          width: 1,
          height: 16,
          backgroundColor: theme.palette.outlineVariant,
          display: { xs: "none", md: "block" },
        })}
      />

      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          minWidth: 0,
          flex: { xs: "1 1 auto", sm: "0 1 auto" },
          justifyContent: { xs: "flex-start", sm: "flex-end" },
        }}
      >
        <SessionControlButtons
          labels={labels}
          executionState={executionState}
          onForceActivate={onForceActivate}
          onStop={onStop}
        />
        <SecondaryAdminActions
          labels={labels}
          onReschedule={onReschedule}
          onGenerateLog={onGenerateLog}
          onDelete={onDelete}
          onOverrideRate={onOverrideRate}
        />
      </Stack>
    </StyledAdminActionsBar>
  );
}
