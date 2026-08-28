// cspell:disable
"use client";

import { AppTimePicker } from "@/frontend/common/components/ui/form/time/AppTimePicker";
import { AvailabilitySearchFormShared } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilitySearchFormShared";
import type { AvailabilitySearchFormProps } from "@/frontend/common/views/dashboard/teachers/availability/types";

export function AvailabilitySearchFormDesktop(props: Readonly<AvailabilitySearchFormProps>) {
  return (
    <AvailabilitySearchFormShared
      {...props}
      options={{
        TimePickerComponent: AppTimePicker,
        timePickerSize: "medium",
        formLayoutSx: {
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
          gap: 3,
          alignItems: "end",
          p: 3,
        },
        buttonHeight: 56,
        buttonFullWidth: false,
      }}
    />
  );
}
