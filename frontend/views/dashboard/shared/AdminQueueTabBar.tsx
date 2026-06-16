/* eslint-disable react-refresh/only-export-components */
"use client";

import { Box, Button } from "@mui/material";

export interface AdminQueueTab<T extends string> {
  readonly key: T;
  readonly label: string;
}

interface AdminQueueTabBarProps<T extends string> {
  readonly activeTab: T;
  readonly tabs: readonly AdminQueueTab<T>[];
  readonly onTabChange: (tab: T) => void;
}

export function AdminQueueTabBar<T extends string>({
  activeTab,
  tabs,
  onTabChange,
}: Readonly<AdminQueueTabBarProps<T>>) {
  return (
    <Box sx={{ display: "flex", borderBottom: theme => `1px solid ${theme.palette.outlineVariant}` }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;

        return (
          <Button
            key={tab.key}
            onClick={() => {
              onTabChange(tab.key);
            }}
            sx={theme => ({
              px: 4,
              py: 2,
              borderRadius: 0,
              borderBottom: isActive ? `2px solid ${theme.palette.primary.main}` : "2px solid transparent",
              color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: 700,
              letterSpacing: "0.1em",
            })}
          >
            {tab.label}
          </Button>
        );
      })}
    </Box>
  );
}

export function formatAdminQueueTabLabel(base: string, count: number): string {
  return `${base} (${count})`;
}
