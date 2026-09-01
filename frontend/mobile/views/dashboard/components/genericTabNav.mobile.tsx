"use client";

import { Box, Button, Typography, useTheme } from "@mui/material";
import { type KeyboardEvent, useEffect, useRef } from "react";
import {
  type GenericTabNavVariantProps,
  isDateTabNavProps,
} from "@/frontend/common/views/dashboard/components/genericTabNav.types";
import { MobileHorizontalScrollRow, MobileTabPill } from "@/frontend/mobile/components/ui";

export type GenericTabNavMobileViewProps = GenericTabNavVariantProps<string>;

function DefaultTabNavMobile({
  activeTab,
  tabs,
  ariaLabel,
}: Readonly<Extract<GenericTabNavMobileViewProps, { variant?: "default" }>>) {
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

function DateTabNavMobile({
  activeTab,
  tabs,
  onTabChange,
  ariaLabel,
}: Readonly<Extract<GenericTabNavMobileViewProps, { variant: "date" }>>) {
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        mx: -2,
      })}
      role="tablist"
      aria-label={ariaLabel}
    >
      <MobileHorizontalScrollRow leadSpacing={0} sx={theme => ({ gap: theme.spacing(0.5), paddingBottom: 0 })}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;

          return (
            <Button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onTabChange(tab.id);
                }
              }}
              sx={theme => ({
                flex: "0 0 auto",
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                minWidth: 44,
                py: 1.25,
                px: 0.75,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                position: "relative",
                borderBottom: isActive ? `2px solid ${theme.palette.primary.main}` : "2px solid transparent",
              })}
            >
              <Typography
                variant="labelSm"
                sx={theme => ({
                  color: isActive ? theme.palette.primary.main : theme.palette.onSurfaceVariant,
                  fontWeight: isActive ? 700 : 500,
                })}
              >
                {tab.weekdayLabel}
              </Typography>
              <Box
                sx={theme => ({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: isActive ? theme.palette.primary.main : "transparent",
                })}
              >
                <Typography
                  variant="titleLg"
                  sx={theme => ({
                    fontWeight: 700,
                    color: isActive ? theme.palette.onPrimary : theme.palette.onSurface,
                  })}
                >
                  {tab.dayNumber}
                </Typography>
              </Box>
              {tab.hasSession && !isActive ? (
                <Box
                  sx={theme => ({
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.primary.main,
                  })}
                />
              ) : (
                <Box sx={{ width: 5, height: 5 }} />
              )}
            </Button>
          );
        })}
      </MobileHorizontalScrollRow>
    </Box>
  );
}

export function GenericTabNavMobileView(props: Readonly<GenericTabNavMobileViewProps>) {
  if (props.tabs.length === 0) {
    return null;
  }

  if (isDateTabNavProps(props)) {
    return <DateTabNavMobile {...props} />;
  }

  return <DefaultTabNavMobile {...props} />;
}
