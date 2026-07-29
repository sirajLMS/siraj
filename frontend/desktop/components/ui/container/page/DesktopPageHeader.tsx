"use client";

import { ChevronRightOutlined } from "@mui/icons-material";
import { Box, Breadcrumbs, Link, Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";
import {
  type UsePageBreadcrumbsOptions,
  usePageBreadcrumbs,
} from "@/frontend/common/views/dashboard/lib/usePageBreadcrumbs";

export interface PageHeaderBreadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

export interface DesktopPageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly titleVariant?: TypographyProps["variant"];
  /** Explicit crumbs override auto-generation from the sidebar nav config. */
  readonly breadcrumbs?: readonly PageHeaderBreadcrumb[];
  /** Options for auto-generated crumbs when `breadcrumbs` is omitted. */
  readonly breadcrumbOptions?: UsePageBreadcrumbsOptions;
  readonly actions?: ReactNode;
}

/**
 * Desktop page header. Renders title/subtitle/breadcrumbs/actions using the
 * desktop-default `headlineLg` title variant. Callers inject already-translated
 * `title`/`subtitle` strings — this component does not fetch translations itself.
 *
 * When `breadcrumbs` is omitted, crumbs are auto-generated from the current
 * pathname via {@link usePageBreadcrumbs} (nav-config walk + optional
 * `breadcrumbOptions` overrides from the ViewModel).
 */
export function DesktopPageHeader({
  title,
  subtitle,
  titleVariant = "headlineLg",
  breadcrumbs,
  breadcrumbOptions,
  actions,
}: DesktopPageHeaderProps) {
  const autoBreadcrumbs = usePageBreadcrumbs(breadcrumbOptions ?? {});
  const resolvedBreadcrumbs = breadcrumbs ?? autoBreadcrumbs;
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
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
        {resolvedBreadcrumbs.length > 0 ? (
          <Breadcrumbs
            separator={<ChevronRightOutlined sx={theme => ({ fontSize: 14, color: theme.palette.text.secondary })} />}
            sx={{ mb: 1 }}
          >
            {resolvedBreadcrumbs.map(crumb => {
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
      {actions ? <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>{actions}</Box> : null}
    </Box>
  );
}
