"use client";

import { Box, type SxProps, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import {
  type UsePageBreadcrumbsOptions,
  usePageBreadcrumbs,
} from "@/frontend/common/views/dashboard/lib/usePageBreadcrumbs";
import {
  MobilePageHeaderActionsRow,
  MobilePageHeaderBreadcrumbs,
} from "@/frontend/mobile/components/ui/container/page/MobilePageHeader.parts";

export interface MobilePageHeaderBreadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

export interface MobilePageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly titleVariant?: UiTypographyVariant;
  /** Explicit crumbs override auto-generation from the sidebar nav config. */
  readonly breadcrumbs?: readonly MobilePageHeaderBreadcrumb[];
  /** Options for auto-generated crumbs when `breadcrumbs` is omitted. */
  readonly breadcrumbOptions?: UsePageBreadcrumbsOptions;
  readonly actions?: ReactNode;
  /**
   * Full-width chrome (header spans the viewport). Does not remove content
   * gutter — titles always keep horizontal inset on the edge-to-edge shell.
   */
  readonly edgeToEdge?: boolean;
  readonly sticky?: boolean;
  readonly sx?: SxProps<Theme>;
}

/**
 * Mobile page header. Always applies the content gutter so titles never sit
 * flush against the edge-to-edge page shell. `edgeToEdge` controls full-width
 * chrome only (sticky bar / background bleed) — it does NOT remove text inset.
 */
export function MobilePageHeader({
  title,
  subtitle,
  titleVariant = "headlineMd",
  breadcrumbs,
  breadcrumbOptions,
  actions,
  edgeToEdge = true,
  sticky = false,
  sx,
}: MobilePageHeaderProps) {
  const autoBreadcrumbs = usePageBreadcrumbs(breadcrumbOptions ?? {});
  const resolvedBreadcrumbs = breadcrumbs ?? autoBreadcrumbs;

  const headerSx = mergeSx(
    {
      px: { xs: 2, md: 3 },
      py: { xs: 1, md: 2 },
      ...(edgeToEdge
        ? {
            width: "100%",
          }
        : {}),
      ...(sticky
        ? {
            position: "sticky",
            top: 0,
            zIndex: theme => theme.zIndex.appBar,
            backgroundColor: theme => theme.palette.background.paper,
            borderBottom: theme => `1px solid ${theme.palette.divider}`,
          }
        : {}),
    },
    sx
  );

  return (
    <Box sx={headerSx}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <MobilePageHeaderBreadcrumbs breadcrumbs={resolvedBreadcrumbs} />
          <Typography variant={titleVariant} sx={theme => ({ color: theme.palette.primary.main })}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.text.secondary })}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {actions ? <MobilePageHeaderActionsRow actions={actions} /> : null}
      </Box>
    </Box>
  );
}
