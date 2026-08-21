// NEW FOR PLAN v5 (newly created for the migration wave)

import type { PermissionGroupDetailFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PermissionsLabels } from "@/shared/locale";

export interface SingleGroupHeaderProps {
  readonly labels: PermissionsLabels;
  readonly group: PermissionGroupDetailFieldsFragment;
  readonly onBack: () => void;
  readonly onEditGroup: (id: string) => void;
}
