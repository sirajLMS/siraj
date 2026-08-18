"use client";

import { Box, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";
import {
  type GenericTabNavVariantProps,
  isDateTabNavProps,
} from "@/frontend/common/views/dashboard/components/genericTabNav.types";

export type GenericTabNavDesktopViewProps = GenericTabNavVariantProps<string>;

function DefaultTabNavDesktop({
  activeTab,
  tabs,
}: Readonly<Extract<GenericTabNavDesktopViewProps, { variant?: "default" }>>) {
  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Tabs value={activeTab}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;

          return (
            <Tab
              key={tab.id}
              component={Link}
              href={tab.href}
              scroll={false}
              value={tab.id}
              label={tab.label}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              sx={theme => ({
                fontSize: theme.typography.bodyMd.fontSize,
                textDecoration: "none",
                ...(isActive ? { color: theme.palette.primary.main } : { color: theme.palette.text.secondary }),
              })}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}

function DateTabNavDesktop({
  activeTab,
  tabs,
  onTabChange,
  ariaLabel,
}: Readonly<Extract<GenericTabNavDesktopViewProps, { variant: "date" }>>) {
  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
      })}
      role="tablist"
      aria-label={ariaLabel}
    >
      <Tabs
        value={activeTab}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(_, value: string) => onTabChange(value)}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;

          return (
            <Tab
              key={tab.id}
              value={tab.id}
              role="tab"
              aria-selected={isActive}
              label={
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25, py: 0.5 }}>
                  <Typography variant="labelSm">{tab.weekdayLabel}</Typography>
                  <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                    {tab.dayNumber}
                  </Typography>
                  {tab.hasSession && !isActive ? (
                    <Box
                      sx={theme => ({
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        backgroundColor: theme.palette.primary.main,
                      })}
                    />
                  ) : null}
                </Box>
              }
              sx={theme => ({
                minWidth: 56,
                textTransform: "none",
                ...(isActive ? { color: theme.palette.primary.main } : { color: theme.palette.text.secondary }),
              })}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}

export function GenericTabNavDesktopView(props: Readonly<GenericTabNavDesktopViewProps>) {
  if (props.tabs.length === 0) {
    return null;
  }

  if (isDateTabNavProps(props)) {
    return <DateTabNavDesktop {...props} />;
  }

  return <DefaultTabNavDesktop {...props} />;
}
