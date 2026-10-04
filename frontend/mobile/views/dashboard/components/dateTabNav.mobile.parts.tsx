"use client";

import { Box, Button, Typography } from "@mui/material";
import { type RefObject, useEffect, useRef } from "react";
import type { GenericTabNavVariantProps } from "@/frontend/common/views/dashboard/components/genericTabNav.types";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui";

type DateTabNavMobileProps = Readonly<Extract<GenericTabNavVariantProps<string>, { variant: "date" }>>;
type DateTab = DateTabNavMobileProps["tabs"][number];

function DateTabPillMobile({
  tab,
  isActive,
  onTabChange,
  activeTabRef,
}: {
  readonly tab: DateTab;
  readonly isActive: boolean;
  readonly onTabChange: (tabId: string) => void;
  readonly activeTabRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Button
      ref={isActive ? activeTabRef : undefined}
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onTabChange(tab.id)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTabChange(tab.id);
        }
      }}
      sx={theme => ({
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        minWidth: 44,
        py: 1.25,
        px: 0.75,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        position: "relative",
        borderBottom: isActive ? `2px solid ${theme.palette.primary.main}` : "2px solid transparent",
      })}
    >
      <Typography
        variant="labelSm"
        sx={theme => ({
          color: isActive ? theme.palette.primary.main : theme.palette.onSurfaceVariant,
          fontWeight: isActive ? 700 : 500,
        })}
      >
        {tab.weekdayLabel}
      </Typography>
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: isActive ? theme.palette.primary.main : "transparent",
        })}
      >
        <Typography
          variant="titleLg"
          sx={theme => ({
            fontWeight: 700,
            color: isActive ? theme.palette.onPrimary : theme.palette.onSurface,
          })}
        >
          {tab.dayNumber}
        </Typography>
      </Box>
      {tab.hasSession && !isActive ? (
        <Box
          sx={theme => ({
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: theme.palette.primary.main,
          })}
        />
      ) : (
        <Box sx={{ width: 5, height: 5 }} />
      )}
    </Button>
  );
}

export function DateTabNavMobile({ activeTab, tabs, onTabChange, ariaLabel }: DateTabNavMobileProps) {
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        mx: -2,
      })}
      role="tablist"
      aria-label={ariaLabel}
    >
      <MobileHorizontalScrollRow leadSpacing={0} sx={theme => ({ gap: theme.spacing(0.5), paddingBottom: 0 })}>
        {tabs.map(tab => (
          <DateTabPillMobile
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onTabChange={onTabChange}
            activeTabRef={activeTabRef}
          />
        ))}
      </MobileHorizontalScrollRow>
    </Box>
  );
}
