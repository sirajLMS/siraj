"use client";

import { alpha, Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";

interface MobileSectionPanelTitleBarProps {
  readonly title: ReactNode;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
}

/**
 * Section panel header: padded title/subtitle stack plus an optional
 * wrap-friendly actions row, separated from the body by a hairline border.
 */
export function MobileSectionPanelTitleBar({ title, subTitle, actions }: MobileSectionPanelTitleBarProps) {
  return (
    <Box
      sx={mergeSx(mobileContentGutterSx, {
        py: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Box sx={sectionTitleColumnSx}>
        <Box sx={sectionTitleRowSx}>{renderTitle(title)}</Box>
        {subTitle ? (
          <Typography variant="bodyMd" sx={sectionSubTitleSx}>
            {subTitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box sx={sectionActionsSx}>{actions}</Box> : null}
    </Box>
  );
}

function renderTitle(title: ReactNode): ReactNode {
  let content: ReactNode;
  if (typeof title === "string") {
    content = (
      <Typography sx={theme => ({ typography: "titleLg", color: theme.palette.onSurface })}>{title}</Typography>
    );
  } else {
    content = title;
  }
  return content;
}

const sectionTitleColumnSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  gap: 0.25,
};

const sectionTitleRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  flexWrap: "wrap",
};

const sectionSubTitleSx: SxProps<Theme> = {
  color: theme => alpha(theme.palette.onSurfaceVariant, 0.85),
  paddingInlineStart: 0.25,
};

const sectionActionsSx: SxProps<Theme> = {
  display: "flex",
  gap: 1,
  flexWrap: "wrap",
  "& > *": { flex: "1 1 auto", minWidth: 0 },
};
