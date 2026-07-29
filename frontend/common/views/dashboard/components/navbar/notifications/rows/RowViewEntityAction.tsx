"use client";

import { Button } from "@mui/material";
import type { NotificationMetadata } from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";

export interface RowViewEntityActionProps {
  readonly viewLabel: string;
  readonly metadata: NotificationMetadata;
  readonly onViewEntity: (metadata: NotificationMetadata) => void;
}

export function RowViewEntityAction({ viewLabel, metadata, onViewEntity }: Readonly<RowViewEntityActionProps>) {
  return (
    <Button
      size="small"
      variant="text"
      onClick={event => {
        event.stopPropagation();
        onViewEntity(metadata);
      }}
      sx={{ minWidth: 0, px: 0.5, alignSelf: "flex-start" }}
    >
      {viewLabel}
    </Button>
  );
}
