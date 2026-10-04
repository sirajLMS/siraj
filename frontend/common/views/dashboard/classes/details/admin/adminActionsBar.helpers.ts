import type { Theme } from "@mui/material/styles";
import type { AdminViewLabels } from "@/shared/locale";

export type AdminActionLabels = AdminViewLabels["adminActions"];

interface StatusTintTokens {
  readonly container: (theme: Theme) => string;
  readonly onContainer: (theme: Theme) => string;
  readonly strong: (theme: Theme) => string;
}

/** Tonal icon-action styling driven by the shared `palette.status` token family. */
export function tintedIconActionSx(tint: StatusTintTokens) {
  return (theme: Theme) => ({
    borderRadius: 1.5,
    backgroundColor: tint.container(theme),
    color: tint.onContainer(theme),
    transition: theme.transitions.create("background", { duration: 150, easing: "ease" }),
    "&:hover": { backgroundColor: tint.strong(theme), filter: "brightness(1.1)" },
    "&:active": { transform: "scale(0.95)" },
    "&.Mui-disabled": {
      opacity: 0.45,
      backgroundColor: tint.container(theme),
      color: tint.onContainer(theme),
    },
  });
}

export const FORCE_ACTIVATE_TINT: StatusTintTokens = {
  container: theme => theme.palette.status.activeContainer,
  onContainer: theme => theme.palette.status.onActiveContainer,
  strong: theme => theme.palette.status.active,
};

export const STOP_PAUSE_TINT: StatusTintTokens = {
  container: theme => theme.palette.status.cancelledContainer,
  onContainer: theme => theme.palette.status.onCancelledContainer,
  strong: theme => theme.palette.status.cancelled,
};

export const DELETE_TINT: StatusTintTokens = {
  container: theme => theme.palette.status.blockedContainer,
  onContainer: theme => theme.palette.status.onBlockedContainer,
  strong: theme => theme.palette.status.blocked,
};
