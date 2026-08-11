import type { SxProps, Theme } from "@mui/material";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";

/**
 * Props for the avatar slot component supplied by each tier.
 *
 * Desktop passes `DesktopUserAvatar` (no status dot overlay).
 * Mobile passes `MobileUserAvatar` plus an optional `StatusDot` overlay.
 */
export interface StudentStatusAvatarSlotProps {
  readonly AvatarComponent: React.ComponentType<{
    readonly src?: string | null;
    readonly label: string;
    readonly size?: number;
    readonly sx?: SxProps<Theme>;
  }>;
  /** Optional status-dot overlay rendered inside the avatar Box. Mobile uses this. */
  readonly StatusDot?: React.ComponentType<{
    readonly student: StudentStatusPageData;
  }>;
}

/**
 * Props for the status-badge slot component supplied by each tier.
 */
export interface StudentStatusBadgeSlotProps {
  readonly StatusBadgeComponent: React.ComponentType<{
    readonly category: "studentAccount";
    readonly status: string;
    readonly label: string;
  }>;
}

/**
 * Slot props supplied by each tier wrapper to {@link StudentStatusHeaderShared}.
 */
export interface StudentStatusHeaderSlotProps extends StudentStatusAvatarSlotProps, StudentStatusBadgeSlotProps {
  /** Whether action buttons should use `fullWidth`. Mobile = true, desktop = false. */
  readonly buttonFullWidth: boolean;
  /** sx for the embedded-mode outer wrapper Box. */
  readonly embeddedWrapperSx?: SxProps<Theme>;
  /** sx for an optional inner wrapper Box inside the embedded layout. Desktop uses maxWidth, mobile omits. */
  readonly embeddedInnerWrapperSx?: SxProps<Theme>;
}

/**
 * Props for the {@link StudentStatusHeaderShared} scaffold component.
 */
export interface StudentStatusHeaderSharedProps {
  readonly student: StudentStatusPageData;
  readonly embedded: boolean;
  readonly slots: StudentStatusHeaderSlotProps;
}
