import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";
import type { BaseAvatarVariant } from "@/frontend/common/components/ui/avatar/BaseAvatar";

/**
 * Card container slot — accepts `sx` and `children`.
 * Used by `BaseCard` (desktop) and `MobileBaseCard` (mobile).
 */
interface SharedCardContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly onClick?: () => void;
  readonly children: ReactNode;
}

/**
 * User avatar slot — accepts `src`, `label`, `size`, `variant`, `sx`, `children`.
 * Used by `DesktopUserAvatar` and `MobileUserAvatar`.
 */
interface SharedUserAvatarProps {
  readonly src?: string | null;
  readonly label?: string;
  readonly size?: number;
  readonly variant?: BaseAvatarVariant;
  readonly sx?: SxProps<Theme>;
  readonly children?: ReactNode;
}

/**
 * Status badge slot — accepts `category`, `status`, `label`.
 * Used by `DesktopStatusBadge` and `MobileStatusBadge`.
 */
interface SharedStatusBadgeProps {
  readonly category: "studentAccount";
  readonly status: string;
  readonly label: string;
}

/**
 * Slot props supplied by each tier wrapper to {@link CurrentTeacherCardShared}.
 */
export interface CurrentTeacherCardSlotProps {
  readonly CardContainer: React.ComponentType<SharedCardContainerProps>;
}

/**
 * Slot props supplied by each tier wrapper to {@link ReassignmentBentoGridShared}.
 */
export interface ReassignmentBentoGridSlotProps {
  readonly CardContainer: React.ComponentType<SharedCardContainerProps>;
  readonly UserAvatar: React.ComponentType<SharedUserAvatarProps>;
}

/**
 * Slot props supplied by each tier wrapper to {@link StudentContextCardShared}.
 */
export interface StudentContextCardSlotProps {
  readonly CardContainer: React.ComponentType<SharedCardContainerProps>;
  readonly UserAvatar: React.ComponentType<SharedUserAvatarProps>;
  readonly StatusBadge: React.ComponentType<SharedStatusBadgeProps>;
}
