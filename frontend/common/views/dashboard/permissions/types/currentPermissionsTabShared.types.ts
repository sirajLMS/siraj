import type { PermissionsLabels } from "@/shared/locale";

export interface CurrentPermissionsEmptyStateProps {
  readonly t: PermissionsLabels;
  readonly onSwitchToAddTab: () => void;
}
