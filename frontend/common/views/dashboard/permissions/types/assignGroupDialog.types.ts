// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface AssignGroupDialogProps {
  readonly open: boolean;
  readonly group: PermissionGroup | null;
  readonly users: readonly User[];
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onAssign: (userId: string) => void;
}
