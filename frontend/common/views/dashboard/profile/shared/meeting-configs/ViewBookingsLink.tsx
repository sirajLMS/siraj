"use client";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Link as MuiLink } from "@mui/material";
import type { MeetingConfigLinkedClassInstancesLabels } from "@/shared/locale/types/ui";

export interface ViewBookingsLinkProps {
  readonly meetingConfigId: string;
  readonly labels: MeetingConfigLinkedClassInstancesLabels;
  readonly onViewBookings: (meetingConfigId: string) => void;
}

export function ViewBookingsLink({ meetingConfigId, labels, onViewBookings }: Readonly<ViewBookingsLinkProps>) {
  return (
    <MuiLink
      component="button"
      type="button"
      onClick={() => onViewBookings(meetingConfigId)}
      sx={{
        typography: "labelMd",
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        textDecorationColor: "currentColor",
        cursor: "pointer",
      }}
    >
      <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
      {labels.viewBookingsLink}
    </MuiLink>
  );
}
