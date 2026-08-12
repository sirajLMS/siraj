"use client";

import type { FormSnackbarSharedProps } from "@/frontend/common/components/ui/form/snackbar/FormSnackbarShared";

export type MobileFormSuccessSnackbarProps = Omit<FormSnackbarSharedProps, "icon" | "severityColor">;

export { FormSuccessSnackbar as MobileFormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
