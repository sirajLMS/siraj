import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";

/**
 * Slot props supplied by each tier wrapper to {@link ManagementControlsCardShared}.
 *
 * The scaffold renders the entire management controls card body — teacher
 * autocomplete, status select, and action buttons — and delegates only the
 * tier-specific pieces to the caller:
 * - `CardContainer` — outer card chrome (`BaseCard` on desktop, `MobileBaseCard`
 *   on mobile). Both accept `sx` via the `SharedCardContainerProps` contract.
 * - `StatusBadge` — tier status badge (`DesktopStatusBadge` / `MobileStatusBadge`).
 * - `TeacherAutocomplete` — tier teacher autocomplete component.
 * - `CancelAction` — outlined secondary preset (`DesktopFilterButton` /
 *   `MobileFilterButton`).
 * - `SubmitAction` — contained primary preset (`DesktopPrimaryPageAction` /
 *   `MobilePrimaryPageAction`).
 */
export interface ManagementControlsCardSlotProps {
  readonly CardContainer: React.ComponentType<SharedCardContainerProps>;
  readonly StatusBadge: React.ComponentType<SharedStatusBadgeProps>;
  readonly TeacherAutocomplete: React.ComponentType<SharedTeacherAutocompleteProps>;
  readonly CancelAction: React.ComponentType<SharedActionButtonProps>;
  readonly SubmitAction: React.ComponentType<SharedActionButtonProps>;
}

export interface SharedCardContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

export interface SharedStatusBadgeProps {
  readonly category: "studentAccount";
  readonly status: string;
  readonly label: string;
}

export interface SharedTeacherAutocompleteProps {
  readonly value: PersonOption | null;
  readonly onChange: (next: PersonOption | null) => void;
  readonly label: string;
  readonly placeholder: string;
}

export interface SharedActionButtonProps {
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly onClick?: () => void;
  readonly startIcon?: ReactNode;
  readonly sx?: SxProps<Theme>;
  readonly type?: "button" | "submit";
}
