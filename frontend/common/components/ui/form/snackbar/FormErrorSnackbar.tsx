"use client";

import { ErrorOutlined } from "@mui/icons-material";
import {
  FormSnackbarShared,
  type FormSnackbarSharedProps,
} from "@/frontend/common/components/ui/form/snackbar/FormSnackbarShared";

export function FormErrorSnackbar(props: Readonly<Omit<FormSnackbarSharedProps, "icon" | "severityColor">>) {
  return <FormSnackbarShared icon={ErrorOutlined} severityColor="error" {...props} />;
}
