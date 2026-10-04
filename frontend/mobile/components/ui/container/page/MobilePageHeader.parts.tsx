"use client";

import { ChevronRightOutlined } from "@mui/icons-material";
import { Box, Breadcrumbs, Link, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeaderBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

function renderBreadcrumb(crumb: PageHeaderBreadcrumbItem) {
  if (crumb.current) {
    return (
      <Typography
        key={crumb.label}
        variant="labelMd"
        sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}
      >
        {crumb.label}
      </Typography>
    );
  }

  if (crumb.href) {
    return (
      <Link
        key={crumb.label}
        href={crumb.href}
        underline="hover"
        variant="labelMd"
        sx={theme => ({ color: theme.palette.text.secondary })}
      >
        {crumb.label}
      </Link>
    );
  }

  return (
    <Typography key={crumb.label} variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
      {crumb.label}
    </Typography>
  );
}

export function MobilePageHeaderBreadcrumbs({
  breadcrumbs,
}: {
  readonly breadcrumbs: readonly PageHeaderBreadcrumbItem[];
}) {
  if (breadcrumbs.length === 0) {
    return null;
  }
  return (
    <Breadcrumbs
      separator={<ChevronRightOutlined sx={theme => ({ fontSize: 14, color: theme.palette.text.secondary })} />}
      sx={{ mb: 1 }}
    >
      {breadcrumbs.map(renderBreadcrumb)}
    </Breadcrumbs>
  );
}

export function MobilePageHeaderActionsRow({ actions }: { readonly actions: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        width: "100%",
        // Stretch Link/wrappers so MobilePrimaryPageAction's width:100%
        // resolves against the full content column, not shrink-wrapped text.
        "& > *": { width: "100%", minWidth: 0 },
      }}
    >
      {actions}
    </Box>
  );
}
