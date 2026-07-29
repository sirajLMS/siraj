"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

export interface RowMarkReadActionProps {
  readonly markReadLabel: string;
  readonly deliveryId: string | null | undefined;
  readonly readAt: string | null | undefined;
  readonly onMarkRead?: (deliveryId: string) => void;
}

export function RowMarkReadAction({ markReadLabel, deliveryId, readAt, onMarkRead }: Readonly<RowMarkReadActionProps>) {
  if (readAt != null || !deliveryId || !onMarkRead) {
    return null;
  }

  return (
    <Tooltip title={markReadLabel}>
      <IconButton
        aria-label={markReadLabel}
        edge="end"
        size="small"
        onClick={event => {
          event.stopPropagation();
          onMarkRead(deliveryId);
        }}
        sx={theme => ({ color: theme.palette.onSurfaceVariant })}
      >
        <CheckCircleOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
