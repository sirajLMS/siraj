import { BlockOutlined, WarningAmberOutlined } from "@mui/icons-material";
import type { Theme } from "@mui/material/styles";
import type { SxProps } from "@mui/system";
import type { ReactElement } from "react";
import { SessionStatus } from "@/frontend/common/views/dashboard/classes/status/tracking/types";

// NEW FOR PLAN v5 (newly created for the migration wave)
// Lifted from statusTrackingDataGrid.{mobile,desktop}.tsx + statusTrackingCardList.mobile.tsx (specs.md §3 N9)
// — duplicate lowercase pure-data helpers (returned JSX icon decoration) defined in three tier files; now canonical in common.
export function getStatusIcon(sessionStatus: SessionStatus): ReactElement | undefined {
  if (sessionStatus === SessionStatus.SUSPENDED_PENDING) {
    return <BlockOutlined sx={{ fontSize: 12 }} />;
  }
  if (sessionStatus === SessionStatus.PENDING_VERIFICATION) {
    return <WarningAmberOutlined sx={{ fontSize: 12 }} />;
  }
  return undefined;
}

// NEW FOR PLAN v5 (newly created for the migration wave)
// Lifted from statusTrackingCardList.mobile.tsx (specs.md §3 N16)
// — status→palette-token color resolver. The tier passes `theme` to this function
// rather than computing palette-key lookups inline in the tier, so the lifeguard
// pattern (palette-key → color mapping logic) lives once in common.
// Consumers should call this from inside an `sx={(theme) => getStatusAvatarSx(theme, sessionStatus)}`
// callback so the tier never needs to declare its own `useTheme()`.
export function getStatusAvatarStyles(
  theme: Theme,
  sessionStatus: SessionStatus
): { readonly backgroundColor: string; readonly color: string } {
  if (sessionStatus === SessionStatus.SUSPENDED_PENDING) {
    return {
      backgroundColor: theme.palette.status.blockedContainer,
      color: theme.palette.status.onBlockedContainer,
    };
  }
  if (sessionStatus === SessionStatus.ON_LEAVE) {
    return {
      backgroundColor: theme.palette.secondaryContainer,
      color: theme.palette.onSecondaryContainer,
    };
  }
  if (sessionStatus === SessionStatus.PENDING_VERIFICATION) {
    return {
      backgroundColor: theme.palette.status.pendingContainer,
      color: theme.palette.status.onPendingContainer,
    };
  }
  return {
    backgroundColor: theme.palette.status.activeContainer,
    color: theme.palette.status.onActiveContainer,
  };
}

// NEW FOR PLAN v5: returns an `SxProps<Theme>` so tiers can pass this to a Box's `sx`
// prop without calling `useTheme()` themselves. Eliminates the lone residual `useTheme()`
// in `statusTrackingCardList.mobile.tsx` (specs.md §3 N16).
export function getStatusAvatarSx(sessionStatus: SessionStatus): SxProps<Theme> {
  return (theme: Theme) => {
    const styles = getStatusAvatarStyles(theme, sessionStatus);
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
    };
  };
}
