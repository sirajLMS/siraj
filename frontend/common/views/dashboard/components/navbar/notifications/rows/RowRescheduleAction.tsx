"use client";

import { Button } from "@mui/material";
import { useAppTranslation } from "@/shared/locale/client";

export interface RowRescheduleActionProps {
  readonly classInstanceId: string;
  readonly onReschedule: (classInstanceId: string) => void;
}

export function RowRescheduleAction({ classInstanceId, onReschedule }: Readonly<RowRescheduleActionProps>) {
  const rescheduleLabel = useAppTranslation().notificationsTranslations.reschedule;

  return (
    <Button
      size="small"
      variant="text"
      onClick={event => {
        event.stopPropagation();
        onReschedule(classInstanceId);
      }}
      sx={{ alignSelf: "flex-start", minWidth: 0, px: 0.5 }}
    >
      {rescheduleLabel}
    </Button>
  );
}
