// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface SingleGroupHeaderProps {
  readonly group: PermissionGroup;
  readonly onBack: () => void;
  readonly onEditGroup: (id: string) => void;
}
