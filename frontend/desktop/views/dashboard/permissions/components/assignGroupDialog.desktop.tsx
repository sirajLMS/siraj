"use client";

import { AssignGroupDialogShared } from "@/frontend/common/views/dashboard/permissions/components/assignGroupDialogShared";
import type { AssignGroupDialogProps } from "@/frontend/common/views/dashboard/permissions/types/assignGroupDialog.types";
import { UserAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

export function AssignGroupDialogDesktop({ labels, ...props }: Readonly<AssignGroupDialogProps>) {
  return (
    <AssignGroupDialogShared
      labels={labels}
      props={props}
      slots={{
        labels,
        UserAutocomplete: UserAutocompleteDesktop,
        dialogVariant: { fullWidth: true, maxWidth: "xs" },
        formIdSuffix: "desktop",
      }}
    />
  );
}
