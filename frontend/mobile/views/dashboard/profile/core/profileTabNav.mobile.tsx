"use client";

import { Box, Chip } from "@mui/material";
import type { ProfileTabNavVariantProps } from "@/frontend/common/views/dashboard/profile/core/profileTabNavTypes";
import type { ProfileTabDefinition } from "@/frontend/common/views/dashboard/profile/core/profileTabs";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";
import { useAppTranslation } from "@/shared/locale";

export type ProfileTabNavMobileViewProps = ProfileTabNavVariantProps;

export function ProfileTabNavMobileView({
  availableTabs,
  currentTab,
  onTabChange,
}: Readonly<ProfileTabNavMobileViewProps>) {
  const t = useAppTranslation().profileTranslations.base;

  if (availableTabs.length === 0) {
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
      aria-label="Profile sections"
    >
      <MobileHorizontalScrollRow>
        {availableTabs.map((tab: ProfileTabDefinition) => (
          <Chip
            key={tab.id}
            role="tab"
            tabIndex={0}
            aria-selected={currentTab === tab.id}
            label={t.shell.tabs[tab.id]}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onTabChange(tab.id);
              }
            }}
            sx={theme => ({
              flexShrink: 0,
              ...(currentTab === tab.id
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
        ))}
      </MobileHorizontalScrollRow>
    </Box>
  );
}
