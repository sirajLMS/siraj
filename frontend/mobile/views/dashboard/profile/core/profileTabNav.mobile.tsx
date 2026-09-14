"use client";

import { Box } from "@mui/material";
import type { ProfileTabNavVariantProps } from "@/frontend/common/views/dashboard/profile/core/profileTabNavTypes";
import { MobileHorizontalScrollRow, MobileTabPill } from "@/frontend/mobile/components/ui";
import { Translation, useAppTranslation } from "@/shared/locale";

export type ProfileTabNavMobileViewProps = ProfileTabNavVariantProps;

export function ProfileTabNavMobileView({
  labels,
  availableTabs,
  currentTab,
  onTabChange,
}: Readonly<ProfileTabNavMobileViewProps>) {
  const t = useAppTranslation(Translation.Common);
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
      aria-label={t.ariaProfileSections}
    >
      <MobileHorizontalScrollRow>
        {availableTabs.map(tab => (
          <MobileTabPill
            key={tab.id}
            label={labels.shell.tabs[tab.id]}
            isActive={currentTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </MobileHorizontalScrollRow>
    </Box>
  );
}
