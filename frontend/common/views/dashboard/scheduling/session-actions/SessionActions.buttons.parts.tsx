"use client";

import { AccessTimeOutlined, CancelOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Stack, Tooltip } from "@mui/material";
import type { SelfServiceRescheduleLabels } from "@/shared/locale/types/dashboard/scheduling/self-service-reschedule";

interface SessionActionsButtonsProps {
  readonly compact: boolean;
  readonly labels: SelfServiceRescheduleLabels;
}

export function SessionActionsLockedButtons({ compact, labels }: Readonly<SessionActionsButtonsProps>) {
  return (
    <Tooltip title={labels.errors.sessionLocked} arrow>
      <Box component="span" sx={{ display: "inline-flex" }}>
        {compact ? (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" disabled aria-label={labels.buttons.delay}>
              <AccessTimeOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled aria-label={labels.buttons.cancel}>
              <CancelOutlined fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              disabled
              startIcon={<AccessTimeOutlined />}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {labels.buttons.delay}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled
              startIcon={<CancelOutlined />}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {labels.buttons.cancel}
            </Button>
          </Stack>
        )}
      </Box>
    </Tooltip>
  );
}

interface SessionActionsActionButtonsProps extends SessionActionsButtonsProps {
  readonly onOpenDelay: () => void;
  readonly onOpenCancel: () => void;
}

export function SessionActionsActionButtons({
  compact,
  labels,
  onOpenDelay,
  onOpenCancel,
}: Readonly<SessionActionsActionButtonsProps>) {
  if (compact) {
    return (
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" color="primary" onClick={onOpenDelay} aria-label={labels.buttons.delay}>
          <AccessTimeOutlined fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={onOpenCancel} aria-label={labels.buttons.cancel}>
          <CancelOutlined fontSize="small" />
        </IconButton>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1}>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        startIcon={<AccessTimeOutlined />}
        onClick={onOpenDelay}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        {labels.buttons.delay}
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="error"
        startIcon={<CancelOutlined />}
        onClick={onOpenCancel}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        {labels.buttons.cancel}
      </Button>
    </Stack>
  );
}
