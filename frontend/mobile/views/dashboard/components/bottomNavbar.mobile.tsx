"use client";

import { Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavLabels } from "@/frontend/common/views/dashboard/components/useNavLabels";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import {
  BOTTOM_NAV_SCROLL_THRESHOLD,
  BottomNavItemViewMobile,
} from "@/frontend/mobile/views/dashboard/components/bottomNavItemView.mobile";

const StyledNav = styled("nav")(({ theme }) => ({
  display: "flex",
  height: theme.layout.bottomNavHeight,
  backgroundColor: theme.palette.background.paper,
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    display: "none",
  },
}));

/**
 * Width of the transparent-to-opaque fade at the inline-end edge in scrollable
 * mode. Item basis (88px) does not divide the viewport evenly (e.g. 5 × 88 =
 * 440 > 390 at xs), so the end item is always partially visible; the fade turns
 * that hard clip into an intentional scroll peek affordance.
 */
const SCROLL_EDGE_FADE_PX = 24;

interface BottomNavbarMobileProps {
  readonly items: readonly NavItem[];
  readonly activeKey: string | null;
}

export function BottomNavbarMobile({ items, activeKey }: Readonly<BottomNavbarMobileProps>) {
  const t = useNavLabels();
  const isScrollable = items.length > BOTTOM_NAV_SCROLL_THRESHOLD;

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme => theme.zIndex.appBar,
        borderTop: theme => `1px solid ${theme.palette.border.light}`,
        pb: "env(safe-area-inset-bottom)",
      }}
      elevation={3}
    >
      <StyledNav
        sx={theme => ({
          overflowX: isScrollable ? "auto" : "hidden",
          ...(isScrollable
            ? {
                maskImage: `linear-gradient(to ${theme.direction === "rtl" ? "right" : "left"}, black calc(100% - ${SCROLL_EDGE_FADE_PX}px), transparent)`,
                WebkitMaskImage: `linear-gradient(to ${theme.direction === "rtl" ? "right" : "left"}, black calc(100% - ${SCROLL_EDGE_FADE_PX}px), transparent)`,
              }
            : null),
        })}
      >
        {items.map(item => (
          <BottomNavItemViewMobile
            key={item.key}
            itemKey={item.key}
            href={item.href}
            label={t(item.labelKey)}
            iconKey={item.iconKey}
            isActive={item.key === activeKey}
            isScrollable={isScrollable}
          />
        ))}
      </StyledNav>
    </Paper>
  );
}
