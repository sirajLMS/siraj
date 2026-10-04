"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type ReactNode, useEffect, useRef } from "react";
import { useFxLiveRefresh } from "@/frontend/common/hooks/useFxLiveRefresh";
import { FxStaleBanner } from "@/frontend/common/views/dashboard/components/FxStaleBanner";

const StyledMain = styled("main")(({ theme }) => ({
  flexGrow: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
  backgroundColor: theme.palette.background.default,
}));

export function MobileMainScrollArea({
  children,
  hideBottomNav,
}: {
  readonly children: ReactNode;
  readonly hideBottomNav: boolean;
}) {
  const mainRef = useRef<HTMLElement>(null);
  useFxLiveRefresh();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, []);

  return (
    <StyledMain
      ref={mainRef}
      sx={theme => ({
        pb: hideBottomNav
          ? theme.spacing(2)
          : `calc(${theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px) + ${theme.spacing(2)})`,
      })}
    >
      <Box
        sx={theme => ({
          px: 0,
          py: theme.spacing(2),
        })}
      >
        <FxStaleBanner />
        {children}
      </Box>
    </StyledMain>
  );
}
