"use client";

import { Box, Typography } from "@mui/material";
import type { CSSProperties } from "react";
import type { NavIconKey } from "@/frontend/common/views/dashboard/config/navIconKeys";
import { NavIcon } from "@/frontend/common/views/dashboard/config/navIconRegistry";
import { Link } from "@/shared/i18n";

export const BOTTOM_NAV_SCROLL_THRESHOLD = 5;
const BOTTOM_NAV_ITEM_MIN_WIDTH = 88;

interface BottomNavItemViewMobileProps {
  readonly itemKey: string;
  readonly href: string;
  readonly label: string;
  readonly iconKey: NavIconKey;
  readonly isActive: boolean;
  readonly isScrollable: boolean;
}

export function BottomNavItemViewMobile({
  itemKey,
  href,
  label,
  iconKey,
  isActive,
  isScrollable,
}: Readonly<BottomNavItemViewMobileProps>) {
  // The Link anchor is the flex child of the nav strip, so the item sizing
  // (equal-share vs fixed scroll width) must live on its inline style — flex
  // rules on the inner Box would not participate in the strip layout.
  const linkFlexStyle: CSSProperties = isScrollable
    ? { flex: `0 0 ${BOTTOM_NAV_ITEM_MIN_WIDTH}px`, maxWidth: 104 }
    : { flex: "1 1 0", minWidth: 0 };
  return (
    <Link href={href} style={{ display: "flex", textDecoration: "none", ...linkFlexStyle }}>
      <Box
        key={itemKey}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
        sx={theme => ({
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.25,
          px: 0.75,
          py: 0.75,
          color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
          overflow: "hidden",
        })}
      >
        <NavIcon iconKey={iconKey} sx={{ fontSize: 20, flexShrink: 0 }} />
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
    </Link>
  );
}
