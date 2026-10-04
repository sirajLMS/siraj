"use client";

import { Box, useTheme } from "@mui/material";
import { type KeyboardEvent, useRef } from "react";
import type { GenericTabNavVariantProps } from "@/frontend/common/views/dashboard/components/genericTabNav.types";
import { MobileHorizontalScrollRow, MobileTabPill } from "@/frontend/mobile/components/ui";

type DefaultTabNavMobileProps = Readonly<Extract<GenericTabNavVariantProps<string>, { variant?: "default" }>>;

export function DefaultTabNavMobile({ activeTab, tabs, ariaLabel }: DefaultTabNavMobileProps) {
  const { direction } = useTheme();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // The pill tablist is link-based (no MUI Tabs wrapper on mobile), so the row
  // re-implements the usual tablist keyboard contract: roving tabindex with
  // arrow/Home/End focus movement, RTL-aware arrow direction.
  const targetIndexForKey = (key: string, index: number): number | null => {
    const forwardKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    if (key === "Home") return 0;
    if (key === "End") return tabs.length - 1;
    if (key === forwardKey) return (index + 1) % tabs.length;
    if (key === "ArrowLeft" || key === "ArrowRight") return (index - 1 + tabs.length) % tabs.length;
    return null;
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLElement>) => {
    const targetIndex = targetIndexForKey(event.key, index);
    if (targetIndex === null) return;
    event.preventDefault();
    tabRefs.current[targetIndex]?.focus();
  };

  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderBottom: `1px solid ${theme.palette.divider}`,
        mx: -2,
      })}
      role="tablist"
      aria-label={ariaLabel}
    >
      <MobileHorizontalScrollRow>
        {tabs.map((tab, index) => (
          <MobileTabPill
            key={tab.id}
            label={tab.label}
            href={tab.href}
            isActive={activeTab === tab.id}
            tabRef={element => {
              tabRefs.current[index] = element;
            }}
            onKeyDown={handleKeyDown(index)}
          />
        ))}
      </MobileHorizontalScrollRow>
    </Box>
  );
}
