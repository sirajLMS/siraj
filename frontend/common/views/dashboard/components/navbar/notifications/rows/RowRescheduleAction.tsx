"use client";

import { Button } from "@mui/material";

export interface RowRescheduleActionProps {
  readonly rescheduleLabel: string;
  readonly classInstanceId: string;
  readonly onReschedule: (classInstanceId: string) => void;
}

export function RowRescheduleAction({
  rescheduleLabel,
  classInstanceId,
  onReschedule,
}: Readonly<RowRescheduleActionProps>) {
  return (
    <Button
      size="small"
      variant="text"
      onClick={event => {
        event.stopPropagation();
        onReschedule(classInstanceId);
      }}
      sx={{ minWidth: 0, px: 0.5, alignSelf: "flex-start" }}
    >
      {rescheduleLabel}
    </Button>
  );
}
