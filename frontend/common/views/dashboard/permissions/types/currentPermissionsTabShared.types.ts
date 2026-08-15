import type React from "react";
import type { PermissionsLabels } from "@/shared/locale";

export interface CurrentPermissionsEmptyStateProps {
  readonly t: PermissionsLabels;
  readonly onSwitchToAddTab: () => void;
}

export type CurrentPermissionsEmptyStateComponent = React.ComponentType<CurrentPermissionsEmptyStateProps>;
