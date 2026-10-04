"use client";

import { Alert } from "@mui/material";
import type { PermissionsLabels } from "@/shared/locale";

export function PermissionErrorAlert({ error, t }: { readonly error: string | null; readonly t: PermissionsLabels }) {
  if (!error) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error === "operationFailed" ? t.errors.operationFailed : error}
    </Alert>
  );
}
