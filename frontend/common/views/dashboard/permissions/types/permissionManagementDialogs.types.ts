// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AssignGroupFormBindings } from "@/frontend/common/views/dashboard/permissions/components/useAssignGroupForm";
import type { ManageOverridesState } from "@/frontend/common/views/dashboard/permissions/components/useManageOverridesState";
import type { PermissionGroupFormState } from "@/frontend/common/views/dashboard/permissions/components/usePermissionGroupForm";

export interface PermissionManagementDialogsProps {
  readonly isLoading: boolean;
  readonly activeGroup: PermissionGroup | null;
  readonly selectedGroupId: string | null;
  readonly isCreateDialogOpen: boolean;
  readonly isEditDialogOpen: boolean;
  readonly isDeleteDialogOpen: boolean;
  readonly isAssignDialogOpen: boolean;
  readonly isManageOverridesOpen: boolean;
  readonly closeCreateDialog: () => void;
  readonly closeEditDialog: () => void;
  readonly closeDeleteDialog: () => void;
  readonly closeAssignDialog: () => void;
  readonly closeManageOverrides: () => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
  readonly onDeleteGroup: (id: string) => Promise<void>;
  readonly onAssignGroup: (groupId: string, userId: string) => Promise<void>;
  // NEW FOR PLAN v5: form bindings composed by the ViewModel from common hooks
  // (NS-2 — lift of useForm/zodResolver/useEffect out of tier dialog files).
  readonly createGroupForm: PermissionGroupFormState;
  readonly editGroupForm: PermissionGroupFormState;
  readonly assignGroupForm: AssignGroupFormBindings;
  // NEW FOR PLAN v5: pre-computed manage-overrides dialog state composed by the
  // ViewModel (NS-3 N26 lift). The tier dialog consumes the flat bag as a
  // plain prop instead of calling `useManageOverridesState(...)` itself.
  readonly manageOverridesState: ManageOverridesState;
}
