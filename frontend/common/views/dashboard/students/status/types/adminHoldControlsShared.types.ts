import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";

/**
 * Slot props supplied by each tier wrapper to {@link AdminHoldControlsShared}.
 *
 * The shared scaffold renders the Status-selection / Reason-entry / Submit-button
 * body and lets the mobile/desktop caller swap the tier-specific primitives:
 * - `FilterButton` and `PrimaryPageAction` come from the tier's ui barrel
 *   (`DesktopFilterButton`/`DesktopPrimaryPageAction` or `Mobile*`).
 * - `AdminControlPanel` is the outer card chrome for the form.
 * - `QuickReasonsContainer` lets mobile render reasons inside a horizontal
 *   scroll row while desktop uses a plain flex-wrapped Box.
 */
export interface AdminHoldControlsSlotProps {
  readonly FilterButton: React.ComponentType<{
    readonly size?: "small" | "medium" | "large";
    readonly onClick?: () => void;
    readonly sx?: SxProps<Theme>;
    readonly children: ReactNode;
  }>;
  readonly PrimaryPageAction: React.ComponentType<{
    readonly type?: "submit" | "button" | "reset";
    readonly disabled?: boolean;
    readonly fullWidth?: boolean;
    readonly sx?: SxProps<Theme>;
    readonly children: ReactNode;
  }>;
  readonly AdminControlPanel: React.ComponentType<{
    readonly title: string;
    readonly children: ReactNode;
  }>;
  readonly QuickReasonsContainer: React.ComponentType<{
    readonly children: ReactNode;
  }>;
}
