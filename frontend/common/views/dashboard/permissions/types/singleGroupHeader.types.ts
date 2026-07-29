// NEW FOR PLAN v5 (newly created for the migration wave)

import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PermissionsLabels } from "@/shared/locale";

export interface SingleGroupHeaderProps {
  readonly labels: PermissionsLabels;
  readonly group: PermissionGroup;
  readonly onBack: () => void;
  readonly onEditGroup: (id: string) => void;
}
