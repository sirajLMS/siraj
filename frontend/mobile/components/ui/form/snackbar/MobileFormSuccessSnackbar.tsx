"use client";

import type { FormSnackbarSharedProps } from "@/frontend/common/components/ui/form/snackbar/FormSnackbarShared";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";

export type MobileFormSuccessSnackbarProps = Omit<FormSnackbarSharedProps, "icon" | "severityColor">;

export const MobileFormSuccessSnackbar = FormSuccessSnackbar;
