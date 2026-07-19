"use client";

import { ChevronRightOutlined } from "@mui/icons-material";
import { Box, Breadcrumbs, Link, type SxProps, type Theme, Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface MobilePageHeaderBreadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

export interface MobilePageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly titleVariant?: TypographyProps["variant"];
  readonly breadcrumbs?: readonly MobilePageHeaderBreadcrumb[];
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
  actions,
  edgeToEdge = true,
  sticky = false,
  sx,
}: MobilePageHeaderProps) {
  const headerSx: SxProps<Theme> = {
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
    ...sx,
  };

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
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <Breadcrumbs
              separator={<ChevronRightOutlined sx={theme => ({ fontSize: 14, color: theme.palette.text.secondary })} />}
              sx={{ mb: 1 }}
            >
              {breadcrumbs.map(crumb => {
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
                  <Typography
                    key={crumb.label}
                    variant="labelMd"
                    sx={theme => ({ color: theme.palette.text.secondary })}
                  >
                    {crumb.label}
                  </Typography>
                );
              })}
            </Breadcrumbs>
          ) : null}
          <Typography variant={titleVariant} sx={theme => ({ color: theme.palette.primary.main })}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.text.secondary, marginInlineStart: 2 })}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {actions ? (
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
        ) : null}
      </Box>
    </Box>
  );
}
