// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface ManageOverridesDialogProps {
  readonly open: boolean;
  readonly userId: string | null;
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onSave: (userId: string, overrides: Array<{ permissionId: string; state: string }>) => Promise<void>;
}
