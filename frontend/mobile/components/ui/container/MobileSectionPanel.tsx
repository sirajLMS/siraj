"use client";

import { alpha, Box, Paper, type SxProps } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import { MobileSectionPanelTitleBar } from "@/frontend/mobile/components/ui/container/MobileSectionPanel.parts";

export interface MobileSectionPanelProps {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  /** Mobile default: edge-to-edge (square corners, no inline borders). */
  readonly edgeToEdge?: boolean;
  /**
   * When true (default), body children get the shared content gutter.
   * Set false for full-bleed children that own their own inset
   * (`MobileCardList`, `MobileHorizontalScrollRow`, `MobileMetricCardGrid`).
   */
  readonly contentInset?: boolean;
  readonly sx?: SxProps<Theme>;
}

/**
 * Mobile section shell: bordered Paper with optional title bar + actions.
 * Defaults to edge-to-edge (square corners, no inline borders) so panels
 * cover the full mobile viewport width. Title bar and body (unless
 * `contentInset={false}`) use the shared content gutter.
 */
export function MobileSectionPanel({
  id,
  title,
  subTitle,
  actions,
  children,
  edgeToEdge = true,
  contentInset = true,
  sx,
}: MobileSectionPanelProps) {
  return (
    <Paper id={id} elevation={0} sx={buildSectionPanelSx(edgeToEdge, sx)}>
      {(title ?? actions) ? <MobileSectionPanelTitleBar title={title} subTitle={subTitle} actions={actions} /> : null}
      {renderSectionPanelBody(children, contentInset)}
    </Paper>
  );
}

function buildSectionPanelSx(edgeToEdge: boolean, sx?: SxProps<Theme>): SxProps<Theme> {
  return mergeSx(
    {
      backgroundColor: theme => alpha(theme.palette.surfaceContainer, 0.95),
      overflow: "hidden",
    },
    edgeToEdge
      ? {
          borderRadius: "0 !important",
          borderInlineStart: "none",
          borderInlineEnd: "none",
          borderLeft: "none",
          borderRight: "none",
          borderTop: theme => `1px solid ${theme.palette.outlineVariant}`,
          borderBottom: theme => `1px solid ${theme.palette.outlineVariant}`,
        }
      : undefined,
    sx
  );
}

function renderSectionPanelBody(children: ReactNode, contentInset: boolean): ReactNode {
  let content: ReactNode = null;
  if (children) {
    content = contentInset ? (
      <Box
        sx={mergeSx(mobileContentGutterSx, {
          py: 2,
        })}
      >
        {children}
      </Box>
    ) : (
      children
    );
  }
  return content;
}
