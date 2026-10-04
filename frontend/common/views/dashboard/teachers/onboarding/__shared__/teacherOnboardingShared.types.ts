import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";

/**
 * Slot prop contracts for the tier-injected chrome components the teacher
 * onboarding scaffold receives via `TeacherOnboardingSharedOptions`.
 */

export interface PageHeaderProps {
  readonly title: string;
  readonly subtitle: string;
  readonly actions?: ReactNode;
}

export interface SectionPanelProps {
  readonly title: string;
  readonly children: ReactNode;
}

export interface PrimaryPageActionProps {
  readonly type?: "submit" | "reset" | "button";
  readonly variant?: "text" | "outlined" | "contained";
  readonly disabled?: boolean;
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

export interface SnackbarProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
}

/** Labels slice of the teacher onboarding ViewModel. */
export type TeacherOnboardingVmLabels = TeacherOnboardingViewModel["labels"];
