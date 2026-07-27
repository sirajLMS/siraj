"use client";

import { CloseOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";

/**
 * Desktop client island for the missed-class alert banner dismiss action.
 *
 * The only interactive (event-handler) piece of the banner — isolated as a
 * tiny `"use client"` island so the surrounding banner markup (`<Alert>` +
 * `<Typography>`) can be rendered by a Server Component. The parent Server
 * Component renders this island as a child via the `action` slot of MUI
 * `Alert`, passing the `onDismiss` callback through React's serialization
 * boundary (functions are supported across the server→client boundary when
 * passed as props from a Server Component to a Client Component).
 */
interface DismissAlertButtonDesktopProps {
  readonly onDismiss: () => void;
  readonly ariaLabel: string;
}

export function DismissAlertButtonDesktop({ onDismiss, ariaLabel }: Readonly<DismissAlertButtonDesktopProps>) {
  return (
    <IconButton
      size="small"
      aria-label={ariaLabel}
      onClick={onDismiss}
      sx={theme => ({ color: theme.palette.error.main })}
    >
      <CloseOutlined fontSize="small" />
    </IconButton>
  );
}
