import type { SxProps, Theme } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import type { UseGeneralUserCreateViewModel } from "@/frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel";

type Vm = UseGeneralUserCreateViewModel;

/** Translation slice consumed by every field of the create-user form. */
export type VmLabels = Vm["labels"];

/** Permission group option rendered by the permission-group autocomplete. */
export interface PermissionGroupOption {
  readonly slug: string;
  readonly name: string;
}

/** Slot prop signature for the tier-injected section panel. */
interface SectionPanelProps {
  readonly title: string;
  readonly children: ReactNode;
}

/** Slot prop signature for the tier-injected primary action button. */
interface PrimaryPageActionProps {
  readonly type?: "submit" | "reset" | "button";
  readonly variant?: "text" | "outlined" | "contained";
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
  readonly onClick?: () => void;
}

/** Slot prop signature for the tier-injected snackbar components. */
interface SnackbarProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
}

/** Tier-specific components and styling values injected into the shared scaffold. */
export interface GeneralUserCreateSharedOptions {
  readonly SectionPanel: ComponentType<SectionPanelProps>;
  readonly PrimaryPageAction: ComponentType<PrimaryPageActionProps>;
  readonly FormSuccessSnackbar: ComponentType<SnackbarProps>;
  readonly FormErrorSnackbar?: ComponentType<SnackbarProps>;
  readonly footerPadding: number;
  readonly buttonFullWidth?: boolean;
  readonly buttonSx: SxProps<Theme>;
  readonly formGap: number;
}

function getErrorMessage(error: unknown): string | undefined {
  if (error && typeof error === "object" && "message" in error) {
    const msg = error.message;
    return typeof msg === "string" ? msg : undefined;
  }
  return undefined;
}

/**
 * Maps a react-hook-form validation error key to its localized user-facing
 * message. Unknown keys (server-provided messages) pass through unchanged.
 */
export function validationMessage(labels: VmLabels, error: unknown): string | undefined {
  const msg = getErrorMessage(error);
  if (!msg) return undefined;
  if (msg === "nameRequired") return labels.nameRequired;
  if (msg === "emailRequired") return labels.emailRequired;
  if (msg === "emailInvalid") return labels.emailInvalid;
  if (msg === "emailExists") return labels.emailExists;
  if (msg === "passwordRequired") return labels.passwordRequired;
  if (msg === "passwordWeak") return labels.passwordWeak;
  if (msg === "passwordMinLength") return labels.passwordMinLength;
  if (msg === "passwordWeakComplexity") return labels.passwordWeakComplexity;
  if (msg === "permissionGroupRequired") return labels.permissionGroupRequired;
  if (msg === "specializedGroupNotAllowed") return labels.specializedGroupNotAllowed;
  if (msg === "permissionGroupNotFound") return labels.permissionGroupNotFound;
  return msg;
}
