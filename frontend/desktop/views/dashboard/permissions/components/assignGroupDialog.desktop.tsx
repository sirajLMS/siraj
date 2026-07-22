"use client";

import { AssignGroupDialogShared } from "@/frontend/common/views/dashboard/permissions/components/assignGroupDialogShared";
import type { AssignGroupDialogProps } from "@/frontend/common/views/dashboard/permissions/types/assignGroupDialog.types";
import { UserAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

export function AssignGroupDialogDesktop(props: Readonly<AssignGroupDialogProps>) {
  return (
    <AssignGroupDialogShared
      props={props}
      slots={{
        UserAutocomplete: UserAutocompleteDesktop,
        dialogVariant: { fullWidth: true, maxWidth: "xs" },
        formIdSuffix: "desktop",
      }}
    />
  );
}
