"use client";

import { Box, Chip, Stack, Tab, Tabs } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { ProfileAudience, ProfileScope } from "@/backend/types/profile.types";
import { useUserStore } from "@/frontend/stores/userStore";
import { getVisibleProfileTabs } from "./profileTabs";

export type ProfileTabNavProps = {
  readonly audience: ProfileAudience;
  readonly scope: ProfileScope;
  readonly currentTab: string;
  readonly onTabChange: (tab: string) => void;
};

export function ProfileTabNav({ audience, scope, currentTab, onTabChange }: ProfileTabNavProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasPermission = useUserStore(state => state.hasPermission);

  const availableTabs = getVisibleProfileTabs({ audience, scope, hasPermission });

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && availableTabs.some(tab => tab.id === tabParam)) {
      onTabChange(tabParam);
      return;
    }

    const fallbackTab = availableTabs[0]?.id;
    if (fallbackTab && fallbackTab !== currentTab) {
      onTabChange(fallbackTab);
    }
  }, [searchParams, availableTabs, currentTab, onTabChange]);

  useEffect(() => {
    if (!currentTab) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tab") === currentTab) {
      return;
    }

    params.set("tab", currentTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentTab, pathname, router, searchParams]);

  if (availableTabs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderBottom: `1px solid ${theme.palette.divider}`,
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
      })}
    >
      <Box sx={{ display: { xs: "flex", md: "none" }, overflowX: "auto", pb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ minWidth: "fit-content", px: 1 }}>
          {availableTabs.map(tab => (
            <Chip
              key={tab.id}
              label={t(tab.i18nKey)}
              onClick={() => onTabChange(tab.id)}
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
        </Stack>
      </Box>

      <Tabs
        value={currentTab}
        onChange={(_, newValue) => onTabChange(newValue)}
        sx={{ display: { xs: "none", md: "flex" } }}
      >
        {availableTabs.map(tab => (
          <Tab
            key={tab.id}
            value={tab.id}
            label={t(tab.i18nKey)}
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
