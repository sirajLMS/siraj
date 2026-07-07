"use client";

import { Box, Chip, Stack, Tab, Tabs } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ProfileAudience } from "@/backend/types/profile.types";
import { profileTabs } from "./profileTabs";

export type ProfileTabNavProps = {
  audience: ProfileAudience;
  scope: "own" | "other";
  currentTab?: string;
  onTabChange?: (tab: string) => void;
};

export function ProfileTabNav({
  audience,
  scope,
  currentTab: controlledTab,
  onTabChange: onControlledTabChange,
}: ProfileTabNavProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [internalTab, setInternalTab] = useState(controlledTab ?? profileTabs[0]?.id ?? "");

  const currentTab = controlledTab ?? internalTab;
  const onTabChange = onControlledTabChange ?? setInternalTab;

  // Filter tabs based on audience and scope
  const availableTabs = profileTabs.filter(tab => tab.audiences.includes(audience) && tab.scope === scope);

  // Sync query param with tab selection
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && availableTabs.some(tab => tab.id === tabParam)) {
      onTabChange(tabParam);
    } else if (availableTabs.length > 0 && !currentTab) {
      onTabChange(availableTabs[0].id);
    }
  }, [searchParams, availableTabs, currentTab, onTabChange]);

  // Update query param when tab changes
  useEffect(() => {
    if (!currentTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", currentTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentTab, pathname, router, searchParams]);

  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      {/* Mobile: Chips */}
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

      {/* Desktop: Tabs */}
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
                ? {
                    color: theme.palette.primary.main,
                  }
                : {
                    color: theme.palette.text.secondary,
                  }),
            })}
          />
        ))}
      </Tabs>
    </Box>
  );
}
