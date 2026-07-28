"use client";

import { Box, Chip } from "@mui/material";
import Link from "next/link";
import type { SettingsTabNavVariantProps } from "@/frontend/common/views/dashboard/settings/types/settingsTabNav.types";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";

export type SettingsTabNavMobileViewProps = SettingsTabNavVariantProps;

export function SettingsTabNavMobileView({ activeTab, tabs }: Readonly<SettingsTabNavMobileViewProps>) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderBottom: `1px solid ${theme.palette.divider}`,
        mx: -2,
      })}
      role="tablist"
      aria-label="Settings sections"
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
