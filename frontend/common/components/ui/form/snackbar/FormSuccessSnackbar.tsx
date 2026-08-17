"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import {
  FormSnackbarShared,
  type FormSnackbarSharedProps,
} from "@/frontend/common/components/ui/form/snackbar/FormSnackbarShared";

export function FormSuccessSnackbar(props: Readonly<Omit<FormSnackbarSharedProps, "icon" | "severityColor">>) {
  return <FormSnackbarShared icon={CheckCircleOutlined} severityColor="primary" component="output" {...props} />;
}
