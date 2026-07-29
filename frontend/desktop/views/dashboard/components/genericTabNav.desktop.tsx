"use client";

import { Box, Tab, Tabs } from "@mui/material";
import Link from "next/link";
import type { GenericTabNavVariantProps } from "@/frontend/common/views/dashboard/components/GenericTabNav";

export type GenericTabNavDesktopViewProps = GenericTabNavVariantProps<string>;

export function GenericTabNavDesktopView({ activeTab, tabs }: Readonly<GenericTabNavDesktopViewProps>) {
  if (tabs.length === 0) {
    return null;
  }

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
