"use client";

import { Box, Chip, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { GenericTabNavVariantProps } from "@/frontend/common/views/dashboard/components/genericTabNav.types";
import { isDateTabNavProps } from "@/frontend/common/views/dashboard/components/genericTabNav.types";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";

export type GenericTabNavMobileViewProps = GenericTabNavVariantProps<string>;

function DefaultTabNavMobile({
  activeTab,
  tabs,
  ariaLabel = "Sections",
}: Readonly<Extract<GenericTabNavMobileViewProps, { variant?: "default" }>>) {
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
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;

          return (
            <Chip
              key={tab.id}
              component={Link}
              href={tab.href}
              scroll={false}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              label={tab.label}
              clickable
              sx={theme => ({
                flexShrink: 0,
                textDecoration: "none",
                ...(isActive
                  ? {
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.onPrimary,
                      borderColor: theme.palette.primary.dark,
                    }
                  : {
                      bgcolor: "transparent",
                      color: theme.palette.text.primary,
                      borderColor: theme.palette.divider,
                    }),
                borderWidth: 1,
                borderStyle: "solid",
              })}
            />
          );
        })}
      </MobileHorizontalScrollRow>
    </Box>
  );
}

function DateTabNavMobile({
  activeTab,
  tabs,
  onTabChange,
  ariaLabel = "Days",
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
            <Box
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              component="button"
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
            </Box>
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
