"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";

export interface DesktopSectionPanelProps {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly subTitle?: string;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  /**
   * When `true` (default), children are wrapped in padded inset.
   * Set to `false` for data grids (`DesktopAppDataGrid`, `*DataGrid.desktop.tsx`)
   * so the grid sits flush under the title bar. Use `desktopSectionContentInsetSx`
   * on any non-grid prefix siblings (filters, toolbars) in the same section.
   */
  readonly contentPadding?: boolean;
  readonly sx?: SxProps<Theme>;
}

/**
 * Desktop section shell: bordered Paper with optional title bar + actions.
 *
 * Delegates to the shared {@link SectionPanel} — `contentPadding` is mapped
 * to the inverse `edgeToEdge` flag so that `contentPadding={false}` produces
 * edge-to-edge content (for data grids).
 */
export function DesktopSectionPanel({
  id,
  title,
  subTitle,
  actions,
  children,
  contentPadding = true,
  sx,
}: DesktopSectionPanelProps) {
  return (
    <SectionPanel id={id} title={title} subTitle={subTitle} actions={actions} edgeToEdge={!contentPadding} sx={sx}>
      {children}
    </SectionPanel>
  );
}
