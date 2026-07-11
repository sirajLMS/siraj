"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type { ReactNode } from "react";
import { PageHeader } from "@/frontend/components/ui/container/page/PageHeader";

export interface MobilePageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly titleVariant?: TypographyProps["variant"];
  readonly breadcrumbs?: readonly {
    readonly label: string;
    readonly href?: string;
    readonly current?: boolean;
  }[];
  readonly actions?: ReactNode;
  readonly edgeToEdge?: boolean;
  readonly sticky?: boolean;
  readonly sx?: SxProps<Theme>;
}

export function MobilePageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  edgeToEdge = true,
  sticky = false,
  sx,
}: MobilePageHeaderProps) {
  const headerSx: SxProps<Theme> = {
    ...(edgeToEdge && {
      px: { xs: 2, md: 3 },
      py: { xs: 1, md: 2 },
    }),
    ...(sticky && {
      position: "sticky",
      top: 0,
      zIndex: theme => theme.zIndex.appBar,
      backgroundColor: theme => theme.palette.background.paper,
      borderBottom: theme => `1px solid ${theme.palette.divider}`,
    }),
    ...sx,
  };

  return (
    <Box sx={headerSx}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={actions}
        titleVariant="headlineMd"
      />
    </Box>
  );
}
