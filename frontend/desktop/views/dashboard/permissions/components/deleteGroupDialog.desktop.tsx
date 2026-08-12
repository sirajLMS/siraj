"use client";

import { DeleteGroupDialogShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/deleteGroupDialogShared";
import type { DeleteGroupDialogProps } from "@/frontend/common/views/dashboard/permissions/types";

export function DeleteGroupDialogDesktop({ labels, ...props }: Readonly<DeleteGroupDialogProps>) {
  return (
    <DeleteGroupDialogShared
      labels={labels}
      props={props}
      slots={{ dialogVariant: { fullWidth: true, maxWidth: "xs" }, formIdSuffix: "desktop" }}
    />
  );
}
