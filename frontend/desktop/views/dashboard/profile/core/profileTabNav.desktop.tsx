"use client";

import { Box, Tab, Tabs } from "@mui/material";
import type { ProfileTabNavVariantProps } from "@/frontend/common/views/dashboard/profile/core/profileTabNavTypes";
import { useAppTranslation } from "@/shared/locale";

export type ProfileTabNavDesktopViewProps = ProfileTabNavVariantProps;

export function ProfileTabNavDesktopView({
  availableTabs,
  currentTab,
  onTabChange,
}: Readonly<ProfileTabNavDesktopViewProps>) {
  const t = useAppTranslation().profileTranslations.base;

  if (availableTabs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Tabs value={currentTab} onChange={(_, newValue) => onTabChange(newValue)}>
        {availableTabs.map(tab => (
          <Tab
            key={tab.id}
            value={tab.id}
            label={t.shell.tabs[tab.id]}
            sx={theme => ({
              fontSize: theme.typography.bodyMd.fontSize,
              ...(currentTab === tab.id
                ? { color: theme.palette.primary.main }
                : { color: theme.palette.text.secondary }),
            })}
          />
        ))}
      </Tabs>
    </Box>
  );
}
