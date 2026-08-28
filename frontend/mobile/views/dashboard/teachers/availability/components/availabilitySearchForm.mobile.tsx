// cspell:disable
"use client";

import { AvailabilitySearchFormShared } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilitySearchFormShared";
import type { AvailabilitySearchFormProps } from "@/frontend/common/views/dashboard/teachers/availability/types";
import { MobileAppTimePicker } from "@/frontend/mobile/components/ui/form/time";

export function AvailabilitySearchFormMobile(props: Readonly<AvailabilitySearchFormProps>) {
  return (
    <AvailabilitySearchFormShared
      {...props}
      options={{
        TimePickerComponent: MobileAppTimePicker,
        timePickerSize: "small",
        formLayoutSx: {
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 2,
        },
        buttonHeight: 48,
        buttonFullWidth: true,
      }}
    />
  );
}
