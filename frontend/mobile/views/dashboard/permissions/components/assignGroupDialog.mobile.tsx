"use client";

import { AssignGroupDialogShared } from "@/frontend/common/views/dashboard/permissions/components/assignGroupDialogShared";
import type { AssignGroupDialogProps } from "@/frontend/common/views/dashboard/permissions/types/assignGroupDialog.types";
import { UserAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

export function AssignGroupDialogMobile(props: Readonly<AssignGroupDialogProps>) {
  return (
    <AssignGroupDialogShared
      props={props}
      slots={{
        UserAutocomplete: UserAutocompleteMobile,
        dialogVariant: { fullScreen: true },
        formIdSuffix: "mobile",
      }}
    />
  );
}
