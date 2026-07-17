"use client";

import { Box, Chip, Stack } from "@mui/material";
import type { ProfileTabNavVariantProps } from "@/frontend/common/views/dashboard/profile/core/profileTabNavTypes";
import type { ProfileTabDefinition } from "@/frontend/common/views/dashboard/profile/core/profileTabs";
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
        px: 2,
      })}
    >
      <Box sx={{ overflowX: "auto", pb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ minWidth: "fit-content", px: 1 }}>
          <Box component="div" role="tablist" aria-label="Profile sections">
            {availableTabs.map((tab: ProfileTabDefinition) => (
              <Chip
                key={tab.id}
                role="tab"
                tabIndex={0}
                aria-selected={currentTab === tab.id}
                label={t.shell.tabs[tab.id as keyof typeof t.shell.tabs]}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onTabChange(tab.id);
                  }
                }}
                sx={theme => ({
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
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
