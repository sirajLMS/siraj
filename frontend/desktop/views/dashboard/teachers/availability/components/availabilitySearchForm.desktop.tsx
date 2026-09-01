// cspell:disable
"use client";

import { AvailabilitySearchFormShared } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilitySearchFormShared";
import type { AvailabilitySearchFormProps } from "@/frontend/common/views/dashboard/teachers/availability/types";
import { DesktopAppTimePicker } from "@/frontend/desktop/components/ui/form/time";
import { GenderSelectorDesktop } from "@/frontend/desktop/components/ui/input/genderSelector";

export function AvailabilitySearchFormDesktop(props: Readonly<AvailabilitySearchFormProps>) {
  return (
    <AvailabilitySearchFormShared
      {...props}
      options={{
        TimePickerComponent: DesktopAppTimePicker,
        GenderSelectorComponent: GenderSelectorDesktop,
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
