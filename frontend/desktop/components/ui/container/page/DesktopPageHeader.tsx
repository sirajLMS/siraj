import { ChevronRightOutlined } from "@mui/icons-material";
import { Box, Breadcrumbs, Link, Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface PageHeaderBreadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

export interface DesktopPageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly titleVariant?: TypographyProps["variant"];
  readonly breadcrumbs?: readonly PageHeaderBreadcrumb[];
  readonly actions?: ReactNode;
}

/**
 * Desktop page header (Server Component). Renders title/subtitle/breadcrumbs/actions using
 * the desktop-default `headlineLg` title variant. Callers inject already-translated
 * `title`/`subtitle` strings — this component does not fetch translations itself.
 */
export function DesktopPageHeader({
  title,
  subtitle,
  titleVariant = "headlineLg",
  breadcrumbs,
  actions,
}: DesktopPageHeaderProps) {
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
