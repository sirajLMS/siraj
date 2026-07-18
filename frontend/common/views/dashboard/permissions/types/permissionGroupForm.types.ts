// NEW FOR PLAN v5 (newly created for the migration wave)
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import type {
  PermissionGroupFormState,
  ValidPermission,
} from "@/frontend/common/views/dashboard/permissions/components/usePermissionGroupForm";

// NEW FOR PLAN v5: NS-2 lifted `useForm`/`zodResolver`/`useEffect`/react-hook-form
// `control`/`setValue`/`useWatch` data flow OUT of the tier component, into the
// common `usePermissionGroupForm` hook. Tier files consume the form state as
// plain props (specs §6.2 — ViewModel owns the form).
export interface PermissionGroupFormProps extends Omit<PermissionGroupFormState, "isLoading"> {
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onSave: (name: LocalizedString, description: LocalizedString, permissionIds: string[]) => Promise<void>;
}

export type { ValidPermission };
