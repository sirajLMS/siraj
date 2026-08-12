"use client";

import type { FormSnackbarSharedProps } from "@/frontend/common/components/ui/form/snackbar/FormSnackbarShared";

export type DesktopFormSuccessSnackbarProps = Omit<FormSnackbarSharedProps, "icon" | "severityColor">;

export { FormSuccessSnackbar as DesktopFormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
