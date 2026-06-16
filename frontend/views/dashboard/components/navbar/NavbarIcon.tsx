"use client";

import { alpha, IconButton, type IconButtonProps, styled, Tooltip } from "@mui/material";
import type React from "react";

// 1. Define the styled component using the theme
const StyledIconButton = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  color: theme.palette.onHeaderContainer,
  "&:hover": {
    backgroundColor: alpha(theme.palette.onHeaderContainer, 0.08),
  },
}));

// 2. Define the prop types for our clean wrapper
interface NavbarIconProps extends Omit<IconButtonProps, "title"> {
  tooltipTitle: string;
  children: React.ReactNode;
}

export function NavbarIcon({ tooltipTitle, children, ...props }: Readonly<NavbarIconProps>) {
  return (
    <Tooltip title={tooltipTitle} enterDelay={1000}>
      <StyledIconButton aria-label={tooltipTitle} {...props}>
        {children}
      </StyledIconButton>
    </Tooltip>
  );
}
