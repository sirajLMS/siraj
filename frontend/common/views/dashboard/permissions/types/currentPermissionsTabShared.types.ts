import type React from "react";
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PermissionsLabels } from "@/shared/locale";

export interface CurrentPermissionsEmptyStateProps {
  readonly t: PermissionsLabels;
  readonly group: PermissionGroup;
  readonly onSwitchToAddTab: () => void;
}

export type CurrentPermissionsEmptyStateComponent = React.ComponentType<CurrentPermissionsEmptyStateProps>;
