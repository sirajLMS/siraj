"use client";

import {
  UpdateSchedulesButtonShared,
  type UpdateSchedulesButtonSharedProps,
} from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/updateSchedulesButtonShared";
import { DESKTOP_UPDATE_SCHEDULES_OPTIONS } from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/updateSchedulesButtonShared.options";

export function UpdateSchedulesButtonDesktop(props: Readonly<UpdateSchedulesButtonSharedProps>) {
  return <UpdateSchedulesButtonShared {...props} options={DESKTOP_UPDATE_SCHEDULES_OPTIONS} />;
}
