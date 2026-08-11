import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";

/**
 * Slot props supplied by each tier wrapper to {@link ManagementControlsCardShared}.
 *
 * The scaffold renders the entire management controls card body — teacher
 * autocomplete, status select, and action buttons — and delegates only the
 * three tier-specific pieces to the caller:
 * - `CardContainer` — outer card chrome (`BaseCard` on desktop, `MobileBaseCard`
 *   on mobile). Both accept `sx` via the `SharedCardContainerProps` contract.
 * - `StatusBadge` — tier status badge (`DesktopStatusBadge` / `MobileStatusBadge`).
 * - `TeacherAutocomplete` — tier teacher autocomplete component.
 */
export interface ManagementControlsCardSlotProps {
  readonly CardContainer: React.ComponentType<SharedCardContainerProps>;
  readonly StatusBadge: React.ComponentType<SharedStatusBadgeProps>;
  readonly TeacherAutocomplete: React.ComponentType<SharedTeacherAutocompleteProps>;
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
