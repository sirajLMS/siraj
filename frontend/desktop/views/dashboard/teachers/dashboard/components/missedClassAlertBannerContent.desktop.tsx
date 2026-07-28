import { WarningAmberOutlined } from "@mui/icons-material";
import { Alert, Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

/**
 * Server-rendered static content of the missed-class alert banner.
 *
 * Pure presentational Server Component (no `"use client"`): renders the
 * LCP-candidate `<Alert>` + two `<Typography>` children entirely on the
 * server. The interactive dismiss action is isolated in a tiny client
 * island (`DismissAlertButtonDesktop`) which the parent passes in via
 * the `dismissButton` prop as a `ReactNode` — the canonical pattern for
 * crossing the server→client boundary from a Server Component (React
 * elements created on the server are forwarded to client components
 * without re-rendering their internals on the client).
 *
 * To make this server component the live entry point, the parent must
 * fetch the `missedRow` data server-side via a `React.cache()`-wrapped
 * service call. Until then the existing `MissedClassAlertBannerDesktop`
 * client wrapper in `missedClassAlertBanner.desktop.tsx` continues to
 * render inline, while this content component is the canonical server
 * entry point ready to take over once the upstream data flow swaps.
 */

interface MissedClassAlertBannerContentDesktopProps {
  readonly title: string;
  readonly description: string;
  readonly fixed?: boolean;
  readonly dismissButton?: ReactNode;
}

export function MissedClassAlertBannerContentDesktop({
  title,
  description,
  fixed = false,
  dismissButton,
}: Readonly<MissedClassAlertBannerContentDesktopProps>) {
  return (
    <Alert
      severity="error"
      icon={<WarningAmberOutlined />}
      action={dismissButton}
      sx={theme => ({
        mb: 3,
        ...(fixed
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: theme.zIndex.appBar + 2,
              borderRadius: 0,
            }
          : {}),
      })}
    >
      <Box>
        <Typography sx={{ typography: "labelUppercase", fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ typography: "bodyMd", mt: 0.5 }}>{description}</Typography>
      </Box>
    </Alert>
  );
}
