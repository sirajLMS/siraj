"use client";

import { Button } from "@mui/material";
import type { NotificationMetadata } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/notificationRowVariants";
import { useAppTranslation } from "@/shared/locale/client";

export interface RowViewEntityActionProps {
  readonly metadata: NotificationMetadata;
  readonly onViewEntity: (metadata: NotificationMetadata) => void;
}

export function RowViewEntityAction({ metadata, onViewEntity }: Readonly<RowViewEntityActionProps>) {
  const viewLabel = useAppTranslation().notificationsTranslations.viewEntity;

  return (
    <Button
      size="small"
      variant="text"
      onClick={event => {
        event.stopPropagation();
        onViewEntity(metadata);
      }}
      sx={{ alignSelf: "flex-start", minWidth: 0, px: 0.5 }}
    >
      {viewLabel}
    </Button>
  );
}
