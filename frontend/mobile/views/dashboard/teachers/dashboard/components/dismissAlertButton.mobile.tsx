"use client";

import { CloseOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";

/**
 * Mobile client island for the missed-class alert banner dismiss action.
 *
 * The only interactive (event-handler) piece of the banner — isolated as a
 * tiny `"use client"` island so the surrounding banner markup (`<Alert>` +
 * `<Typography>`) can be rendered by a Server Component. The parent Server
 * Component renders this island as a child via the `action` slot of MUI
 * `Alert`, passing the `onDismiss` callback through React's serialization
 * boundary (functions are supported across the server→client boundary when
 * passed as props from a Server Component to a Client Component).
 *
 * Mobile constraints (see `frontend/mobile/AGENTS.md`): this file is
 * `.mobile.tsx`, so it MUST NOT import `useMediaQuery`, `useViewport`, or
 * `ViewportContext` — viewport tier is decided by the parent switcher. No
 * hardcoded colors: theme palette is read via the `sx` theme callback.
 */
interface DismissAlertButtonMobileProps {
  readonly onDismiss: () => void;
  readonly ariaLabel: string;
}

export function DismissAlertButtonMobile({ onDismiss, ariaLabel }: Readonly<DismissAlertButtonMobileProps>) {
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
