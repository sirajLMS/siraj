"use client";

import {
  UpdateSchedulesButtonShared,
  type UpdateSchedulesButtonSharedProps,
} from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/updateSchedulesButtonShared";
import { MOBILE_UPDATE_SCHEDULES_OPTIONS } from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/updateSchedulesButtonShared.options";

export function UpdateSchedulesButtonMobile(props: Readonly<UpdateSchedulesButtonSharedProps>) {
  return <UpdateSchedulesButtonShared {...props} options={MOBILE_UPDATE_SCHEDULES_OPTIONS} />;
}
