"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { Link } from "@/shared/i18n/routing";

export const BOTTOM_NAV_SCROLL_THRESHOLD = 5;
export const BOTTOM_NAV_ITEM_MIN_WIDTH = 88;

interface BottomNavItemViewMobileProps {
  readonly itemKey: string;
  readonly href: string;
  readonly label: string;
  readonly icon: SvgIconComponent;
  readonly isActive: boolean;
  readonly isScrollable: boolean;
}

export function BottomNavItemViewMobile({
  itemKey,
  href,
  label,
  icon,
  isActive,
  isScrollable,
}: Readonly<BottomNavItemViewMobileProps>) {
  const IconComponent = icon;

  return (
    <Box
      key={itemKey}
      component={Link}
      href={href}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      sx={theme => ({
        flex: isScrollable ? `0 0 ${BOTTOM_NAV_ITEM_MIN_WIDTH}px` : 1,
        minWidth: isScrollable ? BOTTOM_NAV_ITEM_MIN_WIDTH : 0,
        maxWidth: isScrollable ? 104 : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
        px: 0.75,
        py: 0.75,
        textDecoration: "none",
        color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
        overflow: "hidden",
      })}
    >
      <IconComponent sx={{ fontSize: 20, flexShrink: 0 }} />
      <Typography
        variant="labelSm"
        sx={{
          fontWeight: isActive ? 600 : 400,
          width: "100%",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          letterSpacing: 0,
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
