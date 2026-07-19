// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Control, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AssignGroupFormData } from "@/frontend/common/views/dashboard/permissions/schemas/assignGroup.schema";

export interface AssignGroupFormBindings {
  // NEW FOR PLAN v5: NS-2 lifted `useForm`/`zodResolver`/`useEffect` OUT of tier
  // into the common `useAssignGroupForm` hook; tier files receive form bindings
  // as plain props (specs §6.2).
  readonly control: Control<AssignGroupFormData>;
  readonly errors: FieldErrors<AssignGroupFormData>;
  readonly handleSubmit: UseFormHandleSubmit<AssignGroupFormData>;
}

export interface AssignGroupDialogProps extends AssignGroupFormBindings {
  readonly open: boolean;
  readonly group: PermissionGroup | null;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onAssign: (userId: string) => void;
}
